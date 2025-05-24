<template>
  <div id="app">
    <el-container class="app-container">
      <!-- 侧边栏 -->
      <el-aside width="250px" class="sidebar">
        <div class="logo">
          <h1>MCP Prompt Server</h1>
        </div>
        <el-menu
          :router="true"
          :default-active="activeMenu"
          class="sidebar-menu"
          background-color="#001529"
          text-color="#fff"
          active-text-color="#409EFF"
        >
          <el-menu-item index="/dashboard">
            <el-icon><el-icon-odometer /></el-icon>
            <span>仪表盘</span>
          </el-menu-item>
          <el-sub-menu index="/prompts">
            <template #title>
              <el-icon><el-icon-document /></el-icon>
              <span>提示词管理</span>
            </template>
            <el-menu-item index="/prompts">提示词列表</el-menu-item>
            <el-menu-item index="/prompts/new">创建提示词</el-menu-item>
          </el-sub-menu>
          <el-menu-item index="/categories">
            <el-icon><el-icon-folder /></el-icon>
            <span>类别管理</span>
          </el-menu-item>
          <el-menu-item index="/tags">
            <el-icon><el-icon-collection-tag /></el-icon>
            <span>标签管理</span>
          </el-menu-item>
          <el-menu-item index="/settings">
            <el-icon><el-icon-setting /></el-icon>
            <span>系统设置</span>
          </el-menu-item>
        </el-menu>
      </el-aside>
      
      <!-- 主内容区 -->
      <el-container class="main-container">
        <!-- 头部 -->
        <el-header class="header">
          <div class="header-left">
            <el-breadcrumb separator="/">
              <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
              <el-breadcrumb-item v-for="(item, index) in breadcrumbs" :key="index">
                {{ item }}
              </el-breadcrumb-item>
            </el-breadcrumb>
          </div>
          <div class="header-right">
            <el-dropdown>
              <span class="user-dropdown">
                管理员 <el-icon><el-icon-arrow-down /></el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="$router.push('/settings')">系统设置</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </el-header>
        
        <!-- 内容区 -->
        <el-main class="main">
          <router-view />
        </el-main>
        
        <!-- 页脚 -->
        <el-footer height="40px" class="footer">
          <div class="footer-content">
            <span>© {{ new Date().getFullYear() }} MCP Prompt Server</span>
          </div>
        </el-footer>
      </el-container>
    </el-container>
  </div>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      breadcrumbs: []
    };
  },
  computed: {
    activeMenu() {
      const { path } = this.$route;
      // 处理子路由的激活状态
      if (path.startsWith('/prompts/') && path !== '/prompts/new') {
        return '/prompts';
      }
      return path;
    }
  },
  watch: {
    $route: {
      handler(route) {
        // 更新面包屑
        this.updateBreadcrumbs(route);
      },
      immediate: true
    }
  },
  methods: {
    updateBreadcrumbs(route) {
      const { meta, params, path } = route;
      const breadcrumbs = [];
      
      // 添加当前页面标题
      if (meta && meta.title) {
        breadcrumbs.push(meta.title);
      }
      
      // 如果是详情页或编辑页，添加 ID
      if (params.id) {
        if (path.includes('/edit')) {
          breadcrumbs.push(params.id, '编辑');
        } else {
          breadcrumbs.push(params.id);
        }
      }
      
      this.breadcrumbs = breadcrumbs;
    }
  }
};
</script>

<style lang="scss">
/* 全局样式重置 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', Arial, sans-serif;
}

#app {
  height: 100%;
}

.app-container {
  height: 100vh;
}

/* 侧边栏样式 */
.sidebar {
  background-color: #001529;
  color: #fff;
  height: 100%;
  
  .logo {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 60px;
    background-color: #002140;
    
    h1 {
      font-size: 18px;
      color: #fff;
      margin: 0;
      white-space: nowrap;
    }
  }
  
  .sidebar-menu {
    border-right: none;
  }
}

/* 头部样式 */
.header {
  background-color: #fff;
  border-bottom: 1px solid #e6e6e6;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  
  .header-right {
    .user-dropdown {
      cursor: pointer;
      display: flex;
      align-items: center;
    }
  }
}

/* 主内容区样式 */
.main {
  background-color: #f0f2f5;
  padding: 20px;
  height: calc(100vh - 100px);
  overflow-y: auto;
}

/* 页脚样式 */
.footer {
  background-color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  font-size: 12px;
  border-top: 1px solid #e6e6e6;
}
</style>
