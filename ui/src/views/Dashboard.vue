<template>
  <div class="dashboard-container">
    <el-row :gutter="20">
      <el-col :span="24">
        <h1 class="page-title">仪表盘</h1>
      </el-col>
    </el-row>
    
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="stats-card">
          <div class="stats-icon">
            <el-icon><el-icon-document /></el-icon>
          </div>
          <div class="stats-info">
            <div class="stats-title">提示词总数</div>
            <div class="stats-value">{{ stats.promptCount }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="stats-card">
          <div class="stats-icon">
            <el-icon><el-icon-folder /></el-icon>
          </div>
          <div class="stats-info">
            <div class="stats-title">类别总数</div>
            <div class="stats-value">{{ stats.categoryCount }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="stats-card">
          <div class="stats-icon">
            <el-icon><el-icon-collection-tag /></el-icon>
          </div>
          <div class="stats-info">
            <div class="stats-title">标签总数</div>
            <div class="stats-value">{{ stats.tagCount }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="stats-card">
          <div class="stats-icon">
            <el-icon><el-icon-time /></el-icon>
          </div>
          <div class="stats-info">
            <div class="stats-title">最近更新</div>
            <div class="stats-value">{{ stats.lastUpdated }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <!-- 最近添加的提示词 -->
    <el-row :gutter="20" class="recent-row">
      <el-col :span="24">
        <el-card class="recent-card">
          <template #header>
            <div class="card-header">
              <span>最近添加的提示词</span>
              <el-button type="primary" size="small" @click="$router.push('/prompts')">
                查看全部
              </el-button>
            </div>
          </template>
          <el-table :data="recentPrompts" style="width: 100%">
            <el-table-column prop="name" label="名称" width="180" />
            <el-table-column prop="description" label="描述" />
            <el-table-column prop="category" label="类别" width="120" />
            <el-table-column label="标签" width="200">
              <template #default="scope">
                <el-tag
                  v-for="tag in scope.row.tags"
                  :key="tag"
                  size="small"
                  class="tag-item"
                >
                  {{ tag }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120">
              <template #default="scope">
                <el-button
                  size="small"
                  type="primary"
                  @click="$router.push(`/prompts/${scope.row.name}`)"
                >
                  查看
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
    
    <!-- 类别和标签统计 -->
    <el-row :gutter="20" class="charts-row">
      <el-col :xs="24" :md="12">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>类别统计</span>
              <el-button type="primary" size="small" @click="$router.push('/categories')">
                管理类别
              </el-button>
            </div>
          </template>
          <div class="chart-container">
            <!-- 这里可以放置类别统计图表 -->
            <div v-if="categoryStats.length === 0" class="empty-chart">
              暂无类别数据
            </div>
            <div v-else class="category-list">
              <div
                v-for="category in categoryStats"
                :key="category.name"
                class="category-item"
              >
                <span class="category-name">{{ category.name }}</span>
                <el-progress
                  :percentage="(category.count / maxCategoryCount) * 100"
                  :format="() => category.count"
                  :stroke-width="15"
                />
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :md="12">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>标签云</span>
              <el-button type="primary" size="small" @click="$router.push('/tags')">
                管理标签
              </el-button>
            </div>
          </template>
          <div class="chart-container">
            <!-- 这里可以放置标签云 -->
            <div v-if="tagCloud.length === 0" class="empty-chart">
              暂无标签数据
            </div>
            <div v-else class="tag-cloud">
              <el-tag
                v-for="tag in tagCloud"
                :key="tag.name"
                :size="tagSizeMap[tag.weight]"
                class="tag-cloud-item"
                :style="{ fontSize: `${tag.weight * 2 + 10}px` }"
              >
                {{ tag.name }} ({{ tag.count }})
              </el-tag>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="stat-card">
          <div class="stat-content category-stat">
            <div class="stat-icon">
              <el-icon><el-icon-folder /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.categoryCount }}</div>
              <div class="stat-label">类别</div>
            </div>
          </div>
          <div class="stat-footer">
            <router-link to="/categories">查看全部</router-link>
          </div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="stat-card">
          <div class="stat-content tag-stat">
            <div class="stat-icon">
              <el-icon><el-icon-collection-tag /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.tagCount }}</div>
              <div class="stat-label">标签</div>
            </div>
          </div>
          <div class="stat-footer">
            <router-link to="/tags">查看全部</router-link>
          </div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="stat-card">
          <div class="stat-content update-stat">
            <div class="stat-icon">
              <el-icon><el-icon-time /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value time-value">{{ stats.lastUpdated }}</div>
              <div class="stat-label">最近更新</div>
            </div>
          </div>
          <div class="stat-footer">
            <span>系统状态: <el-tag size="small" type="success">正常</el-tag></span>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <!-- 最近提示词和标签云 -->
    <el-row :gutter="20" class="dashboard-content">
      <el-col :xs="24" :lg="16">
        <el-card class="recent-prompts-card">
          <template #header>
            <div class="card-header">
              <span>最近提示词</span>
              <router-link to="/prompts">查看更多</router-link>
            </div>
          </template>
          <div v-if="loading" class="loading-container">
            <el-skeleton :rows="5" animated />
          </div>
          <div v-else-if="recentPrompts.length > 0" class="recent-prompts-list">
            <el-table :data="recentPrompts" style="width: 100%">
              <el-table-column prop="name" label="名称" width="180">
                <template #default="scope">
                  <router-link :to="`/prompts/${scope.row.name}`" class="prompt-link">
                    {{ scope.row.name }}
                  </router-link>
                </template>
              </el-table-column>
              <el-table-column prop="description" label="描述" show-overflow-tooltip />
              <el-table-column prop="category" label="类别" width="120">
                <template #default="scope">
                  <el-tag type="success" effect="plain" v-if="scope.row.category">
                    {{ scope.row.category }}
                  </el-tag>
                  <span v-else>-</span>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="100">
                <template #default="scope">
                  <el-button
                    size="small"
                    type="primary"
                    @click="$router.push(`/prompts/${scope.row.name}`)"
                  >
                    查看
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
          <div v-else class="empty-data">
            <el-empty description="暂无提示词数据" />
            <el-button type="primary" @click="$router.push('/prompts/new')">
              创建提示词
            </el-button>
          </div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :lg="8">
        <el-row :gutter="20">
          <el-col :span="24">
            <el-card class="tag-cloud-card">
              <template #header>
                <div class="card-header">
                  <span>标签云</span>
                  <router-link to="/tags">管理标签</router-link>
                </div>
              </template>
              <div v-if="loading" class="loading-container">
                <el-skeleton :rows="3" animated />
              </div>
              <div v-else-if="allTags.length > 0" class="tag-cloud">
                <router-link 
                  v-for="tag in allTags" 
                  :key="tag" 
                  :to="`/prompts?tags=${tag}`"
                >
                  <el-tag 
                    :size="getTagSize(tag)" 
                    class="tag-item"
                    effect="plain"
                  >
                    {{ tag }}
                  </el-tag>
                </router-link>
              </div>
              <div v-else class="empty-data">
                <el-empty description="暂无标签数据" />
              </div>
            </el-card>
          </el-col>
          
          <el-col :span="24" class="mt-20">
            <el-card class="quick-actions-card">
              <template #header>
                <div class="card-header">
                  <span>快捷操作</span>
                </div>
              </template>
              <div class="quick-actions">
                <el-button type="primary" @click="$router.push('/prompts/new')">
                  <el-icon><el-icon-plus /></el-icon> 创建提示词
                </el-button>
                <el-button @click="$router.push('/categories')">
                  <el-icon><el-icon-folder-add /></el-icon> 管理类别
                </el-button>
                <el-button @click="$router.push('/tags')">
                  <el-icon><el-icon-price-tag /></el-icon> 管理标签
                </el-button>
                <el-button @click="$router.push('/settings')">
                  <el-icon><el-icon-setting /></el-icon> 系统设置
                </el-button>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </el-col>
    </el-row>
  </div>
</template>

<script>
export default {
  name: 'Dashboard',
  data() {
    return {
      loading: false,
      stats: {
        promptCount: 0,
        categoryCount: 0,
        tagCount: 0,
        lastUpdated: '无数据'
      },
      recentPrompts: [],
      tagUsageCount: {}
    };
  },
  computed: {
    allTags() {
      return this.$store.getters['tags/allTags'] || [];
    },
    allPrompts() {
      return this.$store.getters['prompts/allPrompts'] || [];
    }
  },
  async created() {
    try {
      // 加载提示词数据
      await this.$store.dispatch('prompts/searchPrompts');
      
      // 加载类别和标签数据
      await Promise.all([
        this.$store.dispatch('categories/getAllCategories'),
        this.$store.dispatch('categories/getCategoryStats'),
        this.$store.dispatch('tags/getAllTags'),
        this.$store.dispatch('tags/getTagStats')
      ]);
      
      // 更新统计信息
      this.updateStats();
      
      // 获取最近的提示词
      this.getRecentPrompts();
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  },
  methods: {
    updateStats() {
      this.stats.promptCount = this.allPrompts.length;
      this.stats.categoryCount = this.categoriesWithCount.length;
      this.stats.tagCount = this.tagCloud.length;
      
      // 查找最近更新的提示词
      if (this.allPrompts.length > 0) {
        const sortedPrompts = [...this.allPrompts].sort((a, b) => {
          return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
        });
        
        const latestPrompt = sortedPrompts[0];
        if (latestPrompt && latestPrompt.updatedAt) {
          this.stats.lastUpdated = new Date(latestPrompt.updatedAt).toLocaleString();
        }
      }
    },
    getRecentPrompts() {
      // 获取最近添加的 5 个提示词
      this.recentPrompts = [...this.allPrompts]
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .slice(0, 5);
    }
  }
};
</script>

<style lang="scss" scoped>
.dashboard-container {
  padding: 20px;
  
  .page-title {
    margin-bottom: 20px;
    font-size: 24px;
    font-weight: 500;
  }
  
  .stats-row {
    margin-bottom: 20px;
  }
  
  .stats-card {
    display: flex;
    align-items: center;
    padding: 10px;
    height: 120px;
    
    .stats-icon {
      font-size: 48px;
      margin-right: 20px;
      color: #409EFF;
    }
    
    .stats-info {
      .stats-title {
        font-size: 14px;
        color: #909399;
        margin-bottom: 5px;
      }
      
      .stats-value {
        font-size: 24px;
        font-weight: bold;
      }
    }
  }
  
  .recent-row, .charts-row {
    margin-bottom: 20px;
  }
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .tag-item {
    margin-right: 5px;
    margin-bottom: 5px;
  }
  
  .chart-container {
    height: 300px;
    overflow-y: auto;
  }
  
  .empty-chart {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    color: #909399;
    font-size: 14px;
  }
  
  .category-list {
    .category-item {
      margin-bottom: 15px;
      
      .category-name {
        display: block;
        margin-bottom: 5px;
      }
    }
  }
  
  .tag-cloud {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    height: 100%;
    
    .tag-cloud-item {
      margin: 5px;
      cursor: pointer;
    }
  }
}
</style>
