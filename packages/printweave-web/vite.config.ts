import { defineConfig } from 'vite';
// @ts-ignore
import vue from '@vitejs/plugin-vue';
// @ts-ignore
import path from 'path';

export default defineConfig({
  resolve:{
    alias:{
      '@': path.resolve(__dirname, 'src')
    }
  },
  plugins: [vue()],
});
