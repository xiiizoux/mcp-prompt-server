<template>
  <div class="category-list-container">
    <el-row :gutter="20">
      <el-col :span="24">
        <div class="page-header">
          <h1 class="page-title">类别管理</h1>
          <el-button type="primary" @click="showAddDialog">
            <el-icon><el-icon-plus /></el-icon> 添加类别
          </el-button>
        </div>
      </el-col>
    </el-row>
    
    <!-- 类别列表 -->
    <el-card class="category-table-card">
      <el-table
        v-loading="loading"
        :data="categories"
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="name" label="名称" sortable>
          <template #default="scope">
            {{ scope.row }}
          </template>
        </el-table-column>
        <el-table-column label="提示词数量" width="120">
          <template #default="scope">
            <el-tag type="info">{{ getCategoryPromptCount(scope.row) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="scope">
            <el-button
              size="small"
              type="primary"
              @click="$router.push(`/prompts?category=${scope.row}`)"
            >
              查看提示词
            </el-button>
            <el-dropdown>
              <el-button size="small">
                <el-icon><el-icon-more /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="showEditDialog(scope.row)">
                    重命名
                  </el-dropdown-item>
                  <el-dropdown-item
                    divided
                    @click="showDeleteDialog(scope.row)"
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
      
      <div v-if="categories.length === 0 && !loading" class="empty-data">
        <el-empty description="暂无类别数据" />
      </div>
      
      <div class="table-footer">
        <el-button
          type="danger"
          :disabled="selectedCategories.length === 0"
          @click="showBatchDeleteDialog"
        >
          批量删除
        </el-button>
      </div>
    </el-card>
    
    <!-- 添加/编辑类别对话框 -->
    <el-dialog
      v-model="categoryDialog.visible"
      :title="categoryDialog.isEdit ? '编辑类别' : '添加类别'"
      width="30%"
    >
      <el-form
        ref="categoryForm"
        :model="categoryDialog.form"
        :rules="categoryDialog.rules"
        label-width="80px"
      >
        <el-form-item label="名称" prop="name">
          <el-input
            v-model="categoryDialog.form.name"
            placeholder="输入类别名称"
            autofocus
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="categoryDialog.visible = false">取消</el-button>
          <el-button type="primary" @click="handleSaveCategory" :loading="categoryDialog.saving">
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 删除确认对话框 -->
    <el-dialog
      v-model="deleteDialog.visible"
      title="删除类别"
      width="30%"
    >
      <div class="delete-dialog-content">
        <p v-if="deleteDialog.categories.length === 1">
          确定要删除类别 <strong>{{ deleteDialog.categories[0] }}</strong> 吗？
        </p>
        <p v-else>确定要删除以下类别吗？</p>
        <ul v-if="deleteDialog.categories.length > 1">
          <li v-for="category in deleteDialog.categories" :key="category">
            {{ category }}
          </li>
        </ul>
        <el-alert
          v-if="hasPromptsInCategories"
          type="warning"
          :closable="false"
          show-icon
        >
          <p>注意：删除类别不会删除关联的提示词，但会移除这些提示词的类别属性。</p>
        </el-alert>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="deleteDialog.visible = false">取消</el-button>
          <el-button type="danger" @click="confirmDeleteCategories" :loading="deleteDialog.deleting">
            确定删除
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'CategoryList',
  data() {
    return {
      loading: false,
      selectedCategories: [],
      categoryDialog: {
        visible: false,
        isEdit: false,
        originalName: '',
        saving: false,
        form: {
          name: ''
        },
        rules: {
          name: [
            { required: true, message: '请输入类别名称', trigger: 'blur' },
            { min: 1, max: 50, message: '长度在 1 到 50 个字符', trigger: 'blur' }
          ]
        }
      },
      deleteDialog: {
        visible: false,
        categories: [],
        deleting: false
      }
    };
  },
  computed: {
    categories() {
      return this.$store.getters['categories/allCategories'] || [];
    },
    prompts() {
      return this.$store.getters['prompts/allPrompts'] || [];
    },
    hasPromptsInCategories() {
      return this.deleteDialog.categories.some(category => 
        this.prompts.some(prompt => prompt.category === category)
      );
    }
  },
  async created() {
    this.loading = true;
    try {
      // 加载类别和提示词数据
      await Promise.all([
        this.$store.dispatch('categories/getAllCategories'),
        this.$store.dispatch('prompts/searchPrompts')
      ]);
    } catch (error) {
      console.error('Error loading categories:', error);
      this.$message.error('加载类别数据失败');
    } finally {
      this.loading = false;
    }
  },
  methods: {
    getCategoryPromptCount(category) {
      return this.prompts.filter(prompt => prompt.category === category).length;
    },
    handleSelectionChange(selection) {
      this.selectedCategories = selection.map(item => item);
    },
    showAddDialog() {
      this.categoryDialog.isEdit = false;
      this.categoryDialog.originalName = '';
      this.categoryDialog.form.name = '';
      this.categoryDialog.visible = true;
      this.$nextTick(() => {
        this.$refs.categoryForm && this.$refs.categoryForm.resetFields();
      });
    },
    showEditDialog(category) {
      this.categoryDialog.isEdit = true;
      this.categoryDialog.originalName = category;
      this.categoryDialog.form.name = category;
      this.categoryDialog.visible = true;
    },
    async handleSaveCategory() {
      try {
        await this.$refs.categoryForm.validate();
        
        this.categoryDialog.saving = true;
        
        if (this.categoryDialog.isEdit) {
          // 更新类别
          await this.$store.dispatch('categories/updateCategory', {
            oldName: this.categoryDialog.originalName,
            newName: this.categoryDialog.form.name
          });
          this.$message.success('类别更新成功');
        } else {
          // 添加新类别
          await this.$store.dispatch('categories/addCategory', this.categoryDialog.form.name);
          this.$message.success('类别添加成功');
        }
        
        this.categoryDialog.visible = false;
      } catch (error) {
        console.error('Error saving category:', error);
        this.$message.error(this.categoryDialog.isEdit ? '更新类别失败' : '添加类别失败');
      } finally {
        this.categoryDialog.saving = false;
      }
    },
    showDeleteDialog(category) {
      this.deleteDialog.categories = [category];
      this.deleteDialog.visible = true;
    },
    showBatchDeleteDialog() {
      if (this.selectedCategories.length === 0) {
        this.$message.warning('请先选择要删除的类别');
        return;
      }
      
      this.deleteDialog.categories = this.selectedCategories;
      this.deleteDialog.visible = true;
    },
    async confirmDeleteCategories() {
      this.deleteDialog.deleting = true;
      
      try {
        for (const category of this.deleteDialog.categories) {
          await this.$store.dispatch('categories/deleteCategory', category);
        }
        
        this.$message.success(`成功删除 ${this.deleteDialog.categories.length} 个类别`);
        this.deleteDialog.visible = false;
        this.deleteDialog.categories = [];
        this.selectedCategories = [];
      } catch (error) {
        console.error('Error deleting categories:', error);
        this.$message.error('删除类别失败');
      } finally {
        this.deleteDialog.deleting = false;
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.category-list-container {
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
  
  .category-table-card {
    margin-bottom: 20px;
  }
  
  .empty-data {
    padding: 40px 0;
  }
  
  .table-footer {
    margin-top: 20px;
    display: flex;
    justify-content: flex-start;
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
    
    .el-alert {
      margin-top: 15px;
    }
  }
}
</style>
