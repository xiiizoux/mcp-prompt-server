import { createRouter, createWebHistory } from 'vue-router';

// 导入视图组件
import Dashboard from '../views/Dashboard.vue';
import PromptList from '../views/prompts/PromptList.vue';
import PromptDetail from '../views/prompts/PromptDetail.vue';
import PromptEdit from '../views/prompts/PromptEdit.vue';
import CategoryList from '../views/categories/CategoryList.vue';
import TagList from '../views/tags/TagList.vue';
import Settings from '../views/settings/Settings.vue';
import NotFound from '../views/NotFound.vue';

const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: Dashboard,
    meta: { title: '仪表盘' }
  },
  {
    path: '/prompts',
    name: 'PromptList',
    component: PromptList,
    meta: { title: '提示词管理' }
  },
  {
    path: '/prompts/new',
    name: 'PromptCreate',
    component: PromptEdit,
    meta: { title: '创建提示词' }
  },
  {
    path: '/prompts/:id',
    name: 'PromptDetail',
    component: PromptDetail,
    meta: { title: '提示词详情' }
  },
  {
    path: '/prompts/:id/edit',
    name: 'PromptEdit',
    component: PromptEdit,
    meta: { title: '编辑提示词' }
  },
  {
    path: '/categories',
    name: 'CategoryList',
    component: CategoryList,
    meta: { title: '类别管理' }
  },
  {
    path: '/tags',
    name: 'TagList',
    component: TagList,
    meta: { title: '标签管理' }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: Settings,
    meta: { title: '系统设置' }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFound,
    meta: { title: '页面未找到' }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// 全局前置守卫，设置页面标题
router.beforeEach((to, from, next) => {
  document.title = to.meta.title ? `${to.meta.title} - MCP Prompt Server` : 'MCP Prompt Server';
  next();
});

export default router;
