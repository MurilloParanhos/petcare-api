import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Durante o desenvolvimento o Vite roda na porta 5173 e repassa para o
// Express (porta 3000) a API e os arquivos da pasta public (CSS e imagens).
const express = 'http://localhost:3000';

export default defineConfig({
    plugins: [react()],
    server: {
        // Deixa o front importar a pasta shared/ (regras da agenda), que fica fora de frontend/
        fs: { allow: ['..'] },
        proxy: {
            '/api': express,
            '/css': express,
            '/img': express
        }
    }
});
