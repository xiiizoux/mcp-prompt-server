<template>
  <div class="prompt-detail-container">
    <el-row :gutter="20">
      <el-col :span="24">
        <div class="page-header">
          <div class="header-left">
            <el-button @click="$router.push('/prompts')" icon="el-icon-back">
              返回列表
            </el-button>
            <h1 class="page-title">{{ prompt ? prompt.name : '加载中...' }}</h1>
          </div>
          <div class="header-actions">
            <el-button type="primary" @click="$router.push(`/prompts/${promptName}/edit`)">
              编辑
            </el-button>
            <el-dropdown @command="handleCommand">
              <el-button>
                更多操作 <el-icon><el-icon-arrow-down /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="export">导出</el-dropdown-item>
                  <el-dropdown-item command="duplicate">复制</el-dropdown-item>
                  <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </el-col>
    </el-row>
    
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="10" animated />
    </div>
    
    <template v-else-if="prompt">
      <!-- 基本信息 -->
      <el-card class="info-card">
        <template #header>
          <div class="card-header">
            <span>基本信息</span>
          </div>
        </template>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="名称">{{ prompt.name }}</el-descriptions-item>
          <el-descriptions-item label="类别">
            <el-tag type="success" effect="plain" v-if="prompt.category">
              {{ prompt.category }}
            </el-tag>
            <span v-else>-</span>
          </el-descriptions-item>
          <el-descriptions-item label="标签" :span="2">
            <el-tag
              v-for="tag in prompt.tags"
              :key="tag"
              size="small"
              class="tag-item"
            >
              {{ tag }}
            </el-tag>
            <span v-if="!prompt.tags || prompt.tags.length === 0">-</span>
          </el-descriptions-item>
          <el-descriptions-item label="描述" :span="2">
            {{ prompt.description || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="创建时间" v-if="prompt.createdAt">
            {{ formatDate(prompt.createdAt) }}
          </el-descriptions-item>
          <el-descriptions-item label="更新时间" v-if="prompt.updatedAt">
            {{ formatDate(prompt.updatedAt) }}
          </el-descriptions-item>
        </el-descriptions>
      </el-card>
      
      <!-- 参数 -->
      <el-card class="parameters-card" v-if="prompt.parameters && prompt.parameters.length > 0">
        <template #header>
          <div class="card-header">
            <span>参数</span>
          </div>
        </template>
        <el-table :data="prompt.parameters" style="width: 100%">
          <el-table-column prop="name" label="名称" width="180" />
          <el-table-column prop="type" label="类型" width="120" />
          <el-table-column prop="description" label="描述" />
          <el-table-column prop="required" label="必填" width="80">
            <template #default="scope">
              <el-tag :type="scope.row.required ? 'danger' : 'info'" effect="plain">
                {{ scope.row.required ? '是' : '否' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="default" label="默认值" width="120">
            <template #default="scope">
              <span v-if="scope.row.default !== undefined">{{ scope.row.default }}</span>
              <span v-else>-</span>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
      
      <!-- 消息 -->
      <el-card class="messages-card">
        <template #header>
          <div class="card-header">
            <span>提示词消息</span>
          </div>
        </template>
        <div class="messages-container">
          <div
            v-for="(message, index) in prompt.messages"
            :key="index"
            class="message-item"
            :class="message.role"
          >
            <div class="message-header">
              <span class="message-role">{{ roleMap[message.role] || message.role }}</span>
            </div>
            <div class="message-content">
              <pre>{{ getMessageContent(message) }}</pre>
            </div>
          </div>
          <div v-if="!prompt.messages || prompt.messages.length === 0" class="empty-message">
            没有消息内容
          </div>
        </div>
      </el-card>
    </template>
    
    <div v-else class="error-container">
      <el-empty description="未找到提示词" />
      <el-button @click="$router.push('/prompts')">返回列表</el-button>
    </div>
    
    <!-- 删除确认对话框 -->
    <el-dialog
      v-model="deleteDialog.visible"
      title="删除提示词"
      width="30%"
    >
      <div class="delete-dialog-content">
        <p>确定要删除提示词 <strong>{{ promptName }}</strong> 吗？此操作不可恢复。</p>
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
export default {
  name: 'PromptDetail',
  data() {
    return {
      loading: true,
      promptName: this.$route.params.id,
      roleMap: {
        'system': '系统',
        'user': '用户',
        'assistant': '助手',
        'function': '函数'
      },
      deleteDialog: {
        visible: false
      }
    };
  },
  computed: {
    prompt() {
      return this.$store.getters['prompts/currentPrompt'];
    }
  },
  async created() {
    this.loading = true;
    try {
      await this.$store.dispatch('prompts/getPromptDetails', this.promptName);
    } catch (error) {
      console.error('Error loading prompt details:', error);
      this.$message.error('加载提示词详情失败');
    } finally {
      this.loading = false;
    }
  },
  methods: {
    formatDate(dateString) {
      if (!dateString) return '-';
      const date = new Date(dateString);
      return date.toLocaleString();
    },
    getMessageContent(message) {
      if (typeof message.content === 'string') {
        return message.content;
      } else if (message.content && message.content.text) {
        return message.content.text;
      } else if (Array.isArray(message.content)) {
        return message.content.map(part => {
          if (typeof part === 'string') {
            return part;
          } else if (part.text) {
            return part.text;
          } else if (part.type === 'image' && part.image_url) {
            return `[图片: ${part.image_url.url || part.image_url}]`;
          }
          return JSON.stringify(part);
        }).join('\n');
      }
      return JSON.stringify(message.content);
    },
    handleCommand(command) {
      if (command === 'export') {
        this.handleExport();
      } else if (command === 'duplicate') {
        this.handleDuplicate();
      } else if (command === 'delete') {
        this.deleteDialog.visible = true;
      }
    },
    async handleExport() {
      try {
        const exportData = await this.$store.dispatch('prompts/exportPrompts', [this.promptName]);
        
        // 创建下载链接
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        
        const exportFileName = `mcp-prompt-${this.promptName}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileName);
        linkElement.click();
        
        this.$message.success('成功导出提示词');
      } catch (error) {
        console.error('Error exporting prompt:', error);
        this.$message.error('导出提示词失败');
      }
    },
    handleDuplicate() {
      // 复制当前提示词并跳转到创建页面
      const duplicatedPrompt = JSON.parse(JSON.stringify(this.prompt));
      duplicatedPrompt.name = `${duplicatedPrompt.name}_copy`;
      
      this.$store.commit('prompts/SET_CURRENT_PROMPT', duplicatedPrompt);
      this.$router.push('/prompts/new');
    },
    async confirmDelete() {
      try {
        await this.$store.dispatch('prompts/deletePrompt', this.promptName);
        this.$message.success('成功删除提示词');
        this.deleteDialog.visible = false;
        this.$router.push('/prompts');
      } catch (error) {
        console.error('Error deleting prompt:', error);
        this.$message.error('删除提示词失败');
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.prompt-detail-container {
  padding: 20px;
  
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    
    .header-left {
      display: flex;
      align-items: center;
      
      .page-title {
        margin: 0 0 0 15px;
        font-size: 24px;
        font-weight: 500;
      }
    }
  }
  
  .info-card,
  .parameters-card,
  .messages-card {
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
  
  .messages-container {
    .message-item {
      margin-bottom: 15px;
      border-radius: 8px;
      overflow: hidden;
      
      .message-header {
        padding: 8px 15px;
        background-color: #f5f7fa;
        border-bottom: 1px solid #e6e6e6;
        
        .message-role {
          font-weight: 500;
        }
      }
      
      .message-content {
        padding: 15px;
        background-color: #fff;
        
        pre {
          margin: 0;
          white-space: pre-wrap;
          word-break: break-word;
          font-family: inherit;
        }
      }
      
      &.system {
        border: 1px solid #909399;
        
        .message-header {
          background-color: #909399;
          color: #fff;
        }
      }
      
      &.user {
        border: 1px solid #67c23a;
        
        .message-header {
          background-color: #67c23a;
          color: #fff;
        }
      }
      
      &.assistant {
        border: 1px solid #409eff;
        
        .message-header {
          background-color: #409eff;
          color: #fff;
        }
      }
      
      &.function {
        border: 1px solid #e6a23c;
        
        .message-header {
          background-color: #e6a23c;
          color: #fff;
        }
      }
    }
    
    .empty-message {
      text-align: center;
      padding: 20px;
      color: #909399;
    }
  }
  
  .loading-container,
  .error-container {
    margin-top: 40px;
    text-align: center;
  }
}
</style>
