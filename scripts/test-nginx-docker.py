"""Smoke check with disposable containers; no AWS or real accounts are used."""

import json
import os
import re
import socket
import subprocess
import sys
import time
import urllib.error
import urllib.request

BACKEND = r"""
const http = require('http');
const crypto = require('crypto');
const server = http.createServer((req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = req.url.startsWith('/api/missing') ? 404 : 200;
    res.setHeader('Set-Cookie', 'refresh=fake-only; Path=/api/auth; HttpOnly; SameSite=Lax');
    res.end(JSON.stringify({url:req.url, method:req.method, headers:req.headers}));
});
server.on('upgrade', (req, socket) => {
    if (req.headers.upgrade !== 'websocket' || req.headers.connection.toLowerCase() !== 'upgrade' ||
        !req.headers['x-real-ip'] || !req.headers['x-forwarded-for'] ||
        req.headers['x-real-ip'] !== req.headers['x-forwarded-for'].split(',').at(-1).trim()) {
        socket.end('HTTP/1.1 400 Bad Request\r\n\r\n'); return;
    }
    const accept = crypto.createHash('sha1').update(req.headers['sec-websocket-key'] +
        '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
    socket.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ' + accept + '\r\n\r\n');
    const payload = Buffer.from('CONNECTED\nversion:1.2\n\n\0');
    socket.write(Buffer.concat([Buffer.from([0x81, payload.length]), payload]));
});
server.listen(8080, '0.0.0.0');
"""


def check(condition, message):
    """Keep verification active even when Python runs with -O."""
    if not condition:
        raise AssertionError(message)


def docker(*args):
    return subprocess.check_output(["docker", *args], text=True).strip()


def request(base, path, method="GET", headers=None):
    req = urllib.request.Request(
        base + path, method=method, headers=headers or {}
    )
    try:
        response = urllib.request.urlopen(req, timeout=5)
    except urllib.error.HTTPError as error:
        response = error
    with response:
        return response.status, response.headers, response.read()


def verify_http(base):
    status, _, index = request(base, "/")
    check(status == 200 and b'<div id="root">' in index, "SPA root failed")
    check(
        request(base, "/stocks?symbol=005930")[2] == index,
        "SPA direct route did not return index.html",
    )
    check(
        "no-cache" in request(base, "/index.html")[1]["Cache-Control"],
        "index.html must revalidate",
    )
    match = re.search(rb'src="([^"]+\.js)"', index)
    check(match is not None, "entry script missing from index.html")
    asset = match.group(1).decode()
    check(
        "immutable" in request(base, asset)[1]["Cache-Control"],
        "hashed assets must have immutable caching",
    )
    check(
        request(base, "/assets/does-not-exist.js")[0] == 404,
        "missing assets must not return the SPA",
    )

    for path in ["/api", "/api/probe?q=005930"]:
        status, headers, body = request(
            base,
            path,
            "POST",
            {
                "Authorization": "Bearer fake-smoke-token",
                "Cookie": "refresh=fake-only",
                "Origin": "https://frontend.example.test",
                "CloudFront-Forwarded-Proto": "https",
            },
        )
        data = json.loads(body)
        check(
            status == 200 and data["url"] == path and data["method"] == "POST",
            "API path, method or query changed",
        )
        expected = {
            "authorization": "Bearer fake-smoke-token",
            "cookie": "refresh=fake-only",
            "origin": "https://frontend.example.test",
            "x-forwarded-proto": "https",
        }
        for field, value in expected.items():
            check(data["headers"].get(field) == value, f"{field} not forwarded")
        check(
            bool(data["headers"].get("x-real-ip")),
            "API X-Real-IP not forwarded",
        )
        check(
            "refresh=fake-only" in headers["Set-Cookie"],
            "upstream Set-Cookie missing",
        )
    check(request(base, "/api/missing")[0] == 404, "upstream 404 was replaced")


def verify_websocket(port):
    with socket.create_connection(("127.0.0.1", int(port)), timeout=5) as client:
        handshake = (
            "GET /ws HTTP/1.1\r\nHost: localhost\r\nUpgrade: websocket\r\n"
            "Connection: Upgrade\r\nSec-WebSocket-Version: 13\r\n"
            "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==\r\n\r\n"
        )
        client.sendall(handshake.encode())
        data = b""
        while b"CONNECTED" not in data:
            chunk = client.recv(4096)
            check(bool(chunk), "WebSocket closed before frame arrived")
            data += chunk
        check(data.startswith(b"HTTP/1.1 101"), "WebSocket upgrade failed")


def main():
    image = sys.argv[1] if len(sys.argv) > 1 else "ove-font:issue-59-test"
    prefix = f"ove-font-smoke-{os.getpid()}"
    try:
        docker("network", "create", prefix)
        docker(
            "run", "-d", "--name", prefix + "-backend", "--network", prefix,
            "--network-alias", "quote-api", "node:22-alpine", "node", "-e",
            BACKEND,
        )
        docker(
            "run", "-d", "--name", prefix + "-front", "--network", prefix,
            "-p", "127.0.0.1::80", "-e", "BACKEND_HOST=quote-api", "-e",
            "BACKEND_PORT=8080", image,
        )
        port = docker("port", prefix + "-front", "80/tcp").rsplit(":", 1)[1]
        base = f"http://127.0.0.1:{port}"
        for _ in range(30):
            try:
                if request(base, "/healthz")[0] == 200:
                    break
            except (OSError, urllib.error.URLError):
                pass
            time.sleep(0.2)
        else:
            raise AssertionError(docker("logs", prefix + "-front"))

        config_result = subprocess.check_output(
            ["docker", "exec", prefix + "-front", "nginx", "-t"],
            stderr=subprocess.STDOUT,
            text=True,
        )
        check("syntax is ok" in config_result, "nginx configuration invalid")
        verify_http(base)
        verify_websocket(port)
        print(
            "PASS: nginx config, SPA, caching, API auth/cookie/Origin/IP, "
            "upstream 404, WebSocket 101/IP and frame"
        )
    finally:
        for name in [prefix + "-front", prefix + "-backend"]:
            subprocess.run(
                ["docker", "rm", "-f", name],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                check=False,
            )
        subprocess.run(
            ["docker", "network", "rm", prefix],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            check=False,
        )


if __name__ == "__main__":
    main()
