<template>
  <div class="tag-list-container">
    <el-row :gutter="20">
      <el-col :span="24">
        <div class="page-header">
          <h1 class="page-title">标签管理</h1>
          <el-button type="primary" @click="showAddDialog">
            <el-icon><el-icon-plus /></el-icon> 添加标签
          </el-button>
        </div>
      </el-col>
    </el-row>
    
    <!-- 标签列表 -->
    <el-card class="tag-table-card">
      <el-table
        v-loading="loading"
        :data="tags"
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="name" label="名称" sortable>
          <template #default="scope">
            <el-tag>{{ scope.row }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="使用次数" width="120">
          <template #default="scope">
            <el-tag type="info">{{ getTagUsageCount(scope.row) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="scope">
            <el-button
              size="small"
              type="primary"
              @click="$router.push(`/prompts?tags=${scope.row}`)"
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
      
      <div v-if="tags.length === 0 && !loading" class="empty-data">
        <el-empty description="暂无标签数据" />
      </div>
      
      <div class="table-footer">
        <el-button
          type="danger"
          :disabled="selectedTags.length === 0"
          @click="showBatchDeleteDialog"
        >
          批量删除
        </el-button>
      </div>
    </el-card>
    
    <!-- 添加/编辑标签对话框 -->
    <el-dialog
      v-model="tagDialog.visible"
      :title="tagDialog.isEdit ? '编辑标签' : '添加标签'"
      width="30%"
    >
      <el-form
        ref="tagForm"
        :model="tagDialog.form"
        :rules="tagDialog.rules"
        label-width="80px"
      >
        <el-form-item label="名称" prop="name">
          <el-input
            v-model="tagDialog.form.name"
            placeholder="输入标签名称"
            autofocus
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="tagDialog.visible = false">取消</el-button>
          <el-button type="primary" @click="handleSaveTag" :loading="tagDialog.saving">
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 删除确认对话框 -->
    <el-dialog
      v-model="deleteDialog.visible"
      title="删除标签"
      width="30%"
    >
      <div class="delete-dialog-content">
        <p v-if="deleteDialog.tags.length === 1">
          确定要删除标签 <strong>{{ deleteDialog.tags[0] }}</strong> 吗？
        </p>
        <p v-else>确定要删除以下标签吗？</p>
        <ul v-if="deleteDialog.tags.length > 1">
          <li v-for="tag in deleteDialog.tags" :key="tag">
            {{ tag }}
          </li>
        </ul>
        <el-alert
          v-if="hasPromptsWithTags"
          type="warning"
          :closable="false"
          show-icon
        >
          <p>注意：删除标签不会删除关联的提示词，但会从这些提示词中移除该标签。</p>
        </el-alert>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="deleteDialog.visible = false">取消</el-button>
          <el-button type="danger" @click="confirmDeleteTags" :loading="deleteDialog.deleting">
            确定删除
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'TagList',
  data() {
    return {
      loading: false,
      selectedTags: [],
      tagDialog: {
        visible: false,
        isEdit: false,
        originalName: '',
        saving: false,
        form: {
          name: ''
        },
        rules: {
          name: [
            { required: true, message: '请输入标签名称', trigger: 'blur' },
            { min: 1, max: 50, message: '长度在 1 到 50 个字符', trigger: 'blur' }
          ]
        }
      },
      deleteDialog: {
        visible: false,
        tags: [],
        deleting: false
      }
    };
  },
  computed: {
    tags() {
      return this.$store.getters['tags/allTags'] || [];
    },
    prompts() {
      return this.$store.getters['prompts/allPrompts'] || [];
    },
    hasPromptsWithTags() {
      return this.deleteDialog.tags.some(tag => 
        this.prompts.some(prompt => 
          prompt.tags && prompt.tags.includes(tag)
        )
      );
    }
  },
  async created() {
    this.loading = true;
    try {
      // 加载标签和提示词数据
      await Promise.all([
        this.$store.dispatch('tags/getAllTags'),
        this.$store.dispatch('prompts/searchPrompts')
      ]);
    } catch (error) {
      console.error('Error loading tags:', error);
      this.$message.error('加载标签数据失败');
    } finally {
      this.loading = false;
    }
  },
  methods: {
    getTagUsageCount(tag) {
      return this.prompts.filter(prompt => 
        prompt.tags && prompt.tags.includes(tag)
      ).length;
    },
    handleSelectionChange(selection) {
      this.selectedTags = selection.map(item => item);
    },
    showAddDialog() {
      this.tagDialog.isEdit = false;
      this.tagDialog.originalName = '';
      this.tagDialog.form.name = '';
      this.tagDialog.visible = true;
      this.$nextTick(() => {
        this.$refs.tagForm && this.$refs.tagForm.resetFields();
      });
    },
    showEditDialog(tag) {
      this.tagDialog.isEdit = true;
      this.tagDialog.originalName = tag;
      this.tagDialog.form.name = tag;
      this.tagDialog.visible = true;
    },
    async handleSaveTag() {
      try {
        await this.$refs.tagForm.validate();
        
        this.tagDialog.saving = true;
        
        if (this.tagDialog.isEdit) {
          // 更新标签
          await this.$store.dispatch('tags/updateTag', {
            oldName: this.tagDialog.originalName,
            newName: this.tagDialog.form.name
          });
          this.$message.success('标签更新成功');
        } else {
          // 添加新标签
          await this.$store.dispatch('tags/addTag', this.tagDialog.form.name);
          this.$message.success('标签添加成功');
        }
        
        this.tagDialog.visible = false;
      } catch (error) {
        console.error('Error saving tag:', error);
        this.$message.error(this.tagDialog.isEdit ? '更新标签失败' : '添加标签失败');
      } finally {
        this.tagDialog.saving = false;
      }
    },
    showDeleteDialog(tag) {
      this.deleteDialog.tags = [tag];
      this.deleteDialog.visible = true;
    },
    showBatchDeleteDialog() {
      if (this.selectedTags.length === 0) {
        this.$message.warning('请先选择要删除的标签');
        return;
      }
      
      this.deleteDialog.tags = this.selectedTags;
      this.deleteDialog.visible = true;
    },
    async confirmDeleteTags() {
      this.deleteDialog.deleting = true;
      
      try {
        for (const tag of this.deleteDialog.tags) {
          await this.$store.dispatch('tags/deleteTag', tag);
        }
        
        this.$message.success(`成功删除 ${this.deleteDialog.tags.length} 个标签`);
        this.deleteDialog.visible = false;
        this.deleteDialog.tags = [];
        this.selectedTags = [];
      } catch (error) {
        console.error('Error deleting tags:', error);
        this.$message.error('删除标签失败');
      } finally {
        this.deleteDialog.deleting = false;
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.tag-list-container {
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
  
  .tag-table-card {
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
