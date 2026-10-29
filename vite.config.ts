import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    const target = env.DEV_PROXY_TARGET || 'https://d2ixqaurp751o3.cloudfront.net';
    return {
        plugins: [react()],
        server: {
            proxy: {
                '/ws': { target, ws: true, changeOrigin: true },
                '/api': { target, changeOrigin: true, cookieDomainRewrite: '' },
            },
        },
    };
});
