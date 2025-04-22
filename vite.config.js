import { defineConfig } from 'vite';
import { resolve } from 'path';
import { readdirSync } from 'fs';

const htmlDir = resolve(__dirname, 'src/html');

// Encuentra automáticamente todos los HTML en src/html/
const input = readdirSync(htmlDir).reduce((entries, file) => {
  if (file.endsWith('.html')) {
    const name = file.replace('.html', '');
    entries[name] = resolve(htmlDir, file);
  }
  return entries;
}, {});

export default defineConfig({
  root: 'src',
  publicDir: '../public',
  base:'/super_tema_copy/',
  build: {
    outDir: '../dist',
    rollupOptions: {
      input,
    },
    emptyOutDir: true
  },
  server: {
    open: '/html/index.html'
  }
});
