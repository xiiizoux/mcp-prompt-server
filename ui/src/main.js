import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';

// 导入 Element Plus 图标
import * as ElementPlusIconsVue from '@element-plus/icons-vue';

// 导入全局样式
import './assets/styles/main.scss';

const app = createApp(App);

// 注册所有图标组件
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(`ElIcon${key}`, component);
}

app.use(router);
app.use(store);
app.use(ElementPlus, { size: 'default' });

app.mount('#app');
