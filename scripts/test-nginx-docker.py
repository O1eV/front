"""Built-image smoke check using a disposable fake backend; no AWS or real accounts."""
import json
import os
import re
import socket
import subprocess
import sys
import time
import urllib.error
import urllib.request

IMAGE = sys.argv[1] if len(sys.argv) > 1 else "ove-font:issue-59-test"
PREFIX = f"ove-font-smoke-{os.getpid()}"
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
    if (req.headers.upgrade !== 'websocket' || req.headers.connection.toLowerCase() !== 'upgrade') {
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


def docker(*args):
    return subprocess.check_output(["docker", *args], text=True).strip()


def request(base, path, method="GET", headers=None):
    req = urllib.request.Request(base + path, method=method, headers=headers or {})
    try:
        response = urllib.request.urlopen(req, timeout=5)
    except urllib.error.HTTPError as error:
        response = error
    with response:
        return response.status, response.headers, response.read()


try:
    docker("network", "create", PREFIX)
    docker("run", "-d", "--name", PREFIX + "-backend", "--network", PREFIX,
           "--network-alias", "quote-api", "node:22-alpine", "node", "-e", BACKEND)
    docker("run", "-d", "--name", PREFIX + "-front", "--network", PREFIX,
           "-p", "127.0.0.1::80", "-e", "BACKEND_HOST=quote-api", "-e",
           "BACKEND_PORT=8080", IMAGE)
    port = docker("port", PREFIX + "-front", "80/tcp").rsplit(":", 1)[1]
    base = f"http://127.0.0.1:{port}"
    for attempt in range(30):
        try:
            if request(base, "/healthz")[0] == 200:
                break
        except (OSError, urllib.error.URLError):
            pass
        time.sleep(0.2)
    else:
        raise AssertionError(docker("logs", PREFIX + "-front"))

    assert "syntax is ok" in subprocess.check_output(
        ["docker", "exec", PREFIX + "-front", "nginx", "-t"], stderr=subprocess.STDOUT, text=True)
    status, headers, index = request(base, "/")
    assert status == 200 and b'<div id="root">' in index
    assert request(base, "/stocks?symbol=005930")[2] == index
    assert "no-cache" in request(base, "/index.html")[1]["Cache-Control"]
    asset = re.search(rb'src="([^"]+\.js)"', index).group(1).decode()
    assert "immutable" in request(base, asset)[1]["Cache-Control"]
    assert request(base, "/assets/does-not-exist.js")[0] == 404

    for path in ["/api", "/api/probe?q=005930"]:
        status, headers, body = request(base, path, "POST", {
            "Authorization": "Bearer fake-smoke-token", "Cookie": "refresh=fake-only",
            "Origin": "https://frontend.example.test", "CloudFront-Forwarded-Proto": "https",
        })
        data = json.loads(body)
        assert status == 200 and data["url"] == path and data["method"] == "POST"
        assert data["headers"]["authorization"] == "Bearer fake-smoke-token"
        assert data["headers"]["cookie"] == "refresh=fake-only"
        assert data["headers"]["origin"] == "https://frontend.example.test"
        assert data["headers"]["x-forwarded-proto"] == "https"
        assert "refresh=fake-only" in headers["Set-Cookie"]
    assert request(base, "/api/missing")[0] == 404

    with socket.create_connection(("127.0.0.1", int(port)), timeout=5) as client:
        client.sendall(("GET /ws HTTP/1.1\r\nHost: localhost\r\nUpgrade: websocket\r\n"
                        "Connection: Upgrade\r\nSec-WebSocket-Version: 13\r\n"
                        "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==\r\n\r\n").encode())
        data = b""
        while b"CONNECTED" not in data:
            chunk = client.recv(4096)
            assert chunk, "WebSocket tunnel closed before frame arrived"
            data += chunk
        assert data.startswith(b"HTTP/1.1 101")
    print("PASS: nginx config, SPA, static caching, API path/query/auth/cookie/Origin, upstream 404, WebSocket 101 and frame")
finally:
    for name in [PREFIX + "-front", PREFIX + "-backend"]:
        subprocess.run(["docker", "rm", "-f", name], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=False)
    subprocess.run(["docker", "network", "rm", PREFIX], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=False)
