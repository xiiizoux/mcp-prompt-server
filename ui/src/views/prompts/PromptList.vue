<template>
  <div class="prompt-list-container">
    <el-row :gutter="20">
      <el-col :span="24">
        <div class="page-header">
          <h1 class="page-title">提示词管理</h1>
          <el-button type="primary" @click="$router.push('/prompts/new')">
            <el-icon><el-icon-plus /></el-icon> 创建提示词
          </el-button>
        </div>
      </el-col>
    </el-row>
    
    <!-- 搜索和筛选 -->
    <el-card class="search-card">
      <el-form :model="searchForm" label-width="80px" @submit.prevent="handleSearch">
        <el-row :gutter="20">
          <el-col :xs="24" :sm="8">
            <el-form-item label="关键词">
              <el-input
                v-model="searchForm.keyword"
                placeholder="搜索提示词名称或描述"
                clearable
                @clear="handleSearch"
              />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="8">
            <el-form-item label="类别">
              <el-select
                v-model="searchForm.category"
                placeholder="选择类别"
                clearable
                @change="handleSearch"
              >
                <el-option
                  v-for="category in categories"
                  :key="category"
                  :label="category"
                  :value="category"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="8">
            <el-form-item label="标签">
              <el-select
                v-model="searchForm.tags"
                placeholder="选择标签"
                multiple
                collapse-tags
                clearable
                @change="handleSearch"
              >
                <el-option
                  v-for="tag in tags"
                  :key="tag"
                  :label="tag"
                  :value="tag"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="24" class="search-buttons">
            <el-button type="primary" @click="handleSearch">搜索</el-button>
            <el-button @click="resetSearch">重置</el-button>
            <div class="batch-actions">
              <el-dropdown @command="handleBatchAction">
                <el-button>
                  批量操作 <el-icon><el-icon-arrow-down /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="export">导出选中</el-dropdown-item>
                    <el-dropdown-item command="delete" divided>删除选中</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </el-col>
        </el-row>
      </el-form>
    </el-card>
    
    <!-- 提示词列表 -->
    <el-card class="prompt-table-card">
      <el-table
        v-loading="loading"
        :data="prompts"
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="name" label="名称" width="180" sortable>
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
            <span v-if="!scope.row.tags || scope.row.tags.length === 0">-</span>
          </template>
        </el-table-column>
        <el-table-column label="参数" width="80">
          <template #default="scope">
            <el-tag type="info" v-if="scope.row.parameters && scope.row.parameters.length > 0">
              {{ scope.row.parameters.length }}
            </el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="scope">
            <el-button
              size="small"
              type="primary"
              @click="$router.push(`/prompts/${scope.row.name}`)"
            >
              查看
            </el-button>
            <el-dropdown>
              <el-button size="small">
                <el-icon><el-icon-more /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="$router.push(`/prompts/${scope.row.name}/edit`)">
                    编辑
                  </el-dropdown-item>
                  <el-dropdown-item @click="handleExport([scope.row.name])">
                    导出
                  </el-dropdown-item>
                  <el-dropdown-item
                    divided
                    @click="handleDelete(scope.row.name)"
                    class="text-danger"
                  >
                    删除
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
    
    <!-- 删除确认对话框 -->
    <el-dialog
      v-model="deleteDialog.visible"
      title="删除提示词"
      width="30%"
    >
      <div class="delete-dialog-content">
        <p>确定要删除以下提示词吗？此操作不可恢复。</p>
        <ul v-if="deleteDialog.names.length > 0">
          <li v-for="name in deleteDialog.names" :key="name">{{ name }}</li>
        </ul>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="deleteDialog.visible = false">取消</el-button>
          <el-button type="danger" @click="confirmDelete">确定删除</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  name: 'PromptList',
  data() {
    return {
      loading: false,
      searchForm: {
        keyword: '',
        category: '',
        tags: []
      },
      currentPage: 1,
      pageSize: 10,
      selectedPrompts: [],
      deleteDialog: {
        visible: false,
        names: []
      }
    };
  },
  computed: {
    ...mapGetters({
      prompts: 'prompts/allPrompts',
      pagination: 'prompts/pagination',
      categories: 'categories/allCategories',
      tags: 'tags/allTags'
    }),
    total() {
      return this.pagination.total || 0;
    }
  },
  async created() {
    this.loading = true;
    try {
      // 加载提示词数据
      await this.$store.dispatch('prompts/searchPrompts', {
        page: this.currentPage,
        pageSize: this.pageSize
      });
      
      // 加载类别和标签数据
      await Promise.all([
        this.$store.dispatch('categories/getAllCategories'),
        this.$store.dispatch('tags/getAllTags')
      ]);
    } catch (error) {
      console.error('Error loading prompt list data:', error);
      this.$message.error('加载提示词数据失败');
    } finally {
      this.loading = false;
    }
  },
  methods: {
    async handleSearch() {
      this.loading = true;
      try {
        await this.$store.dispatch('prompts/searchPrompts', {
          keyword: this.searchForm.keyword,
          category: this.searchForm.category,
          tags: this.searchForm.tags,
          page: 1, // 搜索时重置为第一页
          pageSize: this.pageSize
        });
        this.currentPage = 1;
      } catch (error) {
        console.error('Error searching prompts:', error);
        this.$message.error('搜索提示词失败');
      } finally {
        this.loading = false;
      }
    },
    resetSearch() {
      this.searchForm.keyword = '';
      this.searchForm.category = '';
      this.searchForm.tags = [];
      this.$store.dispatch('prompts/resetSearchParams');
      this.handleSearch();
    },
    handleSelectionChange(selection) {
      this.selectedPrompts = selection;
    },
    handleSizeChange(val) {
      this.pageSize = val;
      this.fetchPrompts();
    },
    handleCurrentChange(val) {
      this.currentPage = val;
      this.fetchPrompts();
    },
    async fetchPrompts() {
      this.loading = true;
      try {
        await this.$store.dispatch('prompts/searchPrompts', {
          keyword: this.searchForm.keyword,
          category: this.searchForm.category,
          tags: this.searchForm.tags,
          page: this.currentPage,
          pageSize: this.pageSize
        });
      } catch (error) {
        console.error('Error fetching prompts:', error);
        this.$message.error('获取提示词数据失败');
      } finally {
        this.loading = false;
      }
    },
    handleBatchAction(command) {
      if (this.selectedPrompts.length === 0) {
        this.$message.warning('请先选择提示词');
        return;
      }
      
      const selectedNames = this.selectedPrompts.map(p => p.name);
      
      if (command === 'export') {
        this.handleExport(selectedNames);
      } else if (command === 'delete') {
        this.handleDelete(selectedNames);
      }
    },
    handleDelete(names) {
      // 如果传入的是单个名称，转换为数组
      const nameArray = Array.isArray(names) ? names : [names];
      this.deleteDialog.names = nameArray;
      this.deleteDialog.visible = true;
    },
    async confirmDelete() {
      this.loading = true;
      try {
        for (const name of this.deleteDialog.names) {
          await this.$store.dispatch('prompts/deletePrompt', name);
        }
        
        this.$message.success(`成功删除 ${this.deleteDialog.names.length} 个提示词`);
        this.deleteDialog.visible = false;
        this.deleteDialog.names = [];
        
        // 刷新列表
        this.fetchPrompts();
      } catch (error) {
        console.error('Error deleting prompts:', error);
        this.$message.error('删除提示词失败');
      } finally {
        this.loading = false;
      }
    },
    async handleExport(names) {
      this.loading = true;
      try {
        const exportData = await this.$store.dispatch('prompts/exportPrompts', names);
        
        // 创建下载链接
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        
        const exportFileName = `mcp-prompts-${new Date().toISOString().slice(0, 10)}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileName);
        linkElement.click();
        
        this.$message.success(`成功导出 ${names.length} 个提示词`);
      } catch (error) {
        console.error('Error exporting prompts:', error);
        this.$message.error('导出提示词失败');
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.prompt-list-container {
  padding: 20px;
  
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    
    .page-title {
      margin: 0;
      font-size: 24px;
      font-weight: 500;
    }
  }
  
  .search-card {
    margin-bottom: 20px;
    
    .search-buttons {
      display: flex;
      justify-content: flex-start;
      
      .batch-actions {
        margin-left: auto;
      }
    }
  }
  
  .prompt-table-card {
    margin-bottom: 20px;
  }
  
  .pagination-container {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }
  
  .prompt-link {
    color: #409EFF;
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }
  
  .tag-item {
    margin-right: 5px;
    margin-bottom: 5px;
  }
  
  .text-danger {
    color: #F56C6C;
  }
  
  .delete-dialog-content {
    ul {
      max-height: 200px;
      overflow-y: auto;
      padding-left: 20px;
    }
  }
}
</style>
