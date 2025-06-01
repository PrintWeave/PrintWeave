import { createApp } from 'vue'
import './style.css'
import router from './route/index.ts';
import App from "./App.vue";

createApp(App).use(router).mount('#app')
