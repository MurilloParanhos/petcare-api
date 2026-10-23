import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Durante o desenvolvimento o Vite roda na porta 5173 e repassa para o
// Express (porta 3000) tudo que ainda nao e React: a API e as paginas antigas.
const express = 'http://localhost:3000';

export default defineConfig({
    plugins: [react()],
    server: {
        proxy: {
            '/api': express,
            '/dashboard.html': express,
            '/css': express,
            '/js': express,
            '/img': express
        }
    }
});
