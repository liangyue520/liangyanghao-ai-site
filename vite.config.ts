import {defineConfig} from 'vite';
import vue from '@vitejs/plugin-vue';
const apiPort = Number(process.env.SITE_API_PORT || 3100);
const allowedHosts = (process.env.SITE_ALLOWED_HOSTS || '').split(',').map(s=>s.trim()).filter(Boolean);
export default defineConfig({plugins:[vue()],server:{host:'127.0.0.1',port:Number(process.env.SITE_WEB_PORT||5173),strictPort:true,allowedHosts,proxy:{'/api':`http://127.0.0.1:${apiPort}`}},build:{outDir:'dist'}});
