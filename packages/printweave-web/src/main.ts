import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import router from './route/index.ts';
import App from "./App.vue";

const app = createApp(App);
const pinia = createPinia();

app.use(router);
app.use(pinia);
app.mount('#app');
