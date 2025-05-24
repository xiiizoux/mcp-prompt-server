<template>
  <div class="prompt-edit-container">
    <el-row :gutter="20">
      <el-col :span="24">
        <div class="page-header">
          <div class="header-left">
            <el-button @click="handleBack" icon="el-icon-back">
              返回
            </el-button>
            <h1 class="page-title">{{ isEdit ? '编辑提示词' : '创建提示词' }}</h1>
          </div>
          <div class="header-actions">
            <el-button @click="handleBack">取消</el-button>
            <el-button type="primary" @click="handleSave" :loading="saving">
              保存
            </el-button>
          </div>
        </div>
      </el-col>
    </el-row>
    
    <el-form
      ref="promptForm"
      :model="promptForm"
      :rules="rules"
      label-width="100px"
      class="prompt-form"
    >
      <!-- 基本信息 -->
      <el-card class="form-card">
        <template #header>
          <div class="card-header">
            <span>基本信息</span>
          </div>
        </template>
        
        <el-form-item label="名称" prop="name">
          <el-input
            v-model="promptForm.name"
            placeholder="输入提示词名称"
            :disabled="isEdit"
          />
        </el-form-item>
        
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="promptForm.description"
            type="textarea"
            :rows="3"
            placeholder="输入提示词描述"
          />
        </el-form-item>
        
        <el-form-item label="类别" prop="category">
          <el-select
            v-model="promptForm.category"
            placeholder="选择类别"
            filterable
            allow-create
            default-first-option
            clearable
            style="width: 100%"
          >
            <el-option
              v-for="category in categories"
              :key="category"
              :label="category"
              :value="category"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="标签" prop="tags">
          <el-select
            v-model="promptForm.tags"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="选择或创建标签"
            style="width: 100%"
          >
            <el-option
              v-for="tag in tags"
              :key="tag"
              :label="tag"
              :value="tag"
            />
          </el-select>
        </el-form-item>
      </el-card>
      
      <!-- 参数 -->
      <el-card class="form-card">
        <template #header>
          <div class="card-header">
            <span>参数</span>
            <el-button type="primary" size="small" @click="addParameter">
              添加参数
            </el-button>
          </div>
        </template>
        
        <div v-if="promptForm.parameters.length === 0" class="empty-parameters">
          <p>暂无参数，点击"添加参数"按钮添加</p>
        </div>
        
        <div v-for="(param, index) in promptForm.parameters" :key="index" class="parameter-item">
          <div class="parameter-header">
            <h3>参数 #{{ index + 1 }}</h3>
            <el-button
              type="danger"
              size="small"
              icon="el-icon-delete"
              @click="removeParameter(index)"
            >
              删除
            </el-button>
          </div>
          
          <el-form-item
            :label="'名称'"
            :prop="`parameters.${index}.name`"
            :rules="[{ required: true, message: '请输入参数名称', trigger: 'blur' }]"
          >
            <el-input v-model="param.name" placeholder="输入参数名称" />
          </el-form-item>
          
          <el-form-item
            :label="'类型'"
            :prop="`parameters.${index}.type`"
            :rules="[{ required: true, message: '请选择参数类型', trigger: 'change' }]"
          >
            <el-select v-model="param.type" placeholder="选择参数类型">
              <el-option label="string" value="string" />
              <el-option label="number" value="number" />
              <el-option label="boolean" value="boolean" />
              <el-option label="array" value="array" />
              <el-option label="object" value="object" />
            </el-select>
          </el-form-item>
          
          <el-form-item :label="'描述'" :prop="`parameters.${index}.description`">
            <el-input
              v-model="param.description"
              placeholder="输入参数描述"
              type="textarea"
              :rows="2"
            />
          </el-form-item>
          
          <el-form-item :label="'必填'" :prop="`parameters.${index}.required`">
            <el-switch v-model="param.required" />
          </el-form-item>
          
          <el-form-item :label="'默认值'" :prop="`parameters.${index}.default`">
            <el-input
              v-model="param.default"
              placeholder="输入默认值"
              :disabled="param.required"
            />
          </el-form-item>
        </div>
      </el-card>
      
      <!-- 消息 -->
      <el-card class="form-card">
        <template #header>
          <div class="card-header">
            <span>提示词消息</span>
            <el-button type="primary" size="small" @click="addMessage">
              添加消息
            </el-button>
          </div>
        </template>
        
        <div v-if="promptForm.messages.length === 0" class="empty-messages">
          <p>暂无消息，点击"添加消息"按钮添加</p>
        </div>
        
        <draggable
          v-model="promptForm.messages"
          handle=".message-drag-handle"
          item-key="id"
          animation="300"
          @start="drag=true"
          @end="drag=false"
        >
          <template #item="{ element, index }">
            <div class="message-item" :class="element.role">
              <div class="message-header">
                <div class="message-drag-handle">
                  <el-icon><el-icon-rank /></el-icon>
                </div>
                <h3>消息 #{{ index + 1 }}</h3>
                <el-button
                  type="danger"
                  size="small"
                  icon="el-icon-delete"
                  @click="removeMessage(index)"
                >
                  删除
                </el-button>
              </div>
              
              <el-form-item
                :label="'角色'"
                :prop="`messages.${index}.role`"
                :rules="[{ required: true, message: '请选择消息角色', trigger: 'change' }]"
              >
                <el-select v-model="element.role" placeholder="选择角色">
                  <el-option label="系统" value="system" />
                  <el-option label="用户" value="user" />
                  <el-option label="助手" value="assistant" />
                  <el-option label="函数" value="function" />
                </el-select>
              </el-form-item>
              
              <el-form-item
                :label="'内容'"
                :prop="`messages.${index}.content`"
                :rules="[{ required: true, message: '请输入消息内容', trigger: 'blur' }]"
              >
                <el-input
                  v-model="element.content"
                  type="textarea"
                  :rows="5"
                  placeholder="输入消息内容"
                />
              </el-form-item>
              
              <el-form-item
                v-if="element.role === 'function'"
                :label="'函数名'"
                :prop="`messages.${index}.name`"
                :rules="[{ required: element.role === 'function', message: '请输入函数名', trigger: 'blur' }]"
              >
                <el-input v-model="element.name" placeholder="输入函数名" />
              </el-form-item>
            </div>
          </template>
        </draggable>
      </el-card>
    </el-form>
    
    <!-- 未保存提示 -->
    <el-dialog
      v-model="unsavedDialog.visible"
      title="未保存的更改"
      width="30%"
    >
      <div class="unsaved-dialog-content">
        <p>您有未保存的更改，确定要离开吗？</p>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="unsavedDialog.visible = false">取消</el-button>
          <el-button type="primary" @click="confirmLeave">确定离开</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { v4 as uuidv4 } from 'uuid';
import draggable from 'vuedraggable';

export default {
  name: 'PromptEdit',
  components: {
    draggable
  },
  data() {
    return {
      saving: false,
      isEdit: this.$route.params.id && this.$route.path.includes('/edit'),
      promptForm: {
        name: '',
        description: '',
        category: '',
        tags: [],
        parameters: [],
        messages: []
      },
      rules: {
        name: [
          { required: true, message: '请输入提示词名称', trigger: 'blur' },
          { pattern: /^[a-z0-9_]+$/, message: '名称只能包含小写字母、数字和下划线', trigger: 'blur' }
        ],
        description: [
          { required: true, message: '请输入提示词描述', trigger: 'blur' }
        ]
      },
      drag: false,
      formChanged: false,
      unsavedDialog: {
        visible: false,
        callback: null
      }
    };
  },
  computed: {
    categories() {
      return this.$store.getters['categories/allCategories'];
    },
    tags() {
      return this.$store.getters['tags/allTags'];
    },
    currentPrompt() {
      return this.$store.getters['prompts/currentPrompt'];
    }
  },
  watch: {
    promptForm: {
      handler() {
        this.formChanged = true;
      },
      deep: true
    }
  },
  async created() {
    try {
      // 加载类别和标签数据
      await Promise.all([
        this.$store.dispatch('categories/getAllCategories'),
        this.$store.dispatch('tags/getAllTags')
      ]);
      
      // 如果是编辑模式，加载提示词数据
      if (this.isEdit) {
        await this.loadPromptData();
      } else if (this.currentPrompt) {
        // 如果是从详情页复制过来的
        this.initFormFromPrompt(this.currentPrompt);
      } else {
        // 新建模式，添加一个默认的系统消息
        this.addMessage();
      }
    } catch (error) {
      console.error('Error initializing prompt edit form:', error);
      this.$message.error('初始化表单失败');
    }
    
    // 添加路由离开守卫
    this.$router.beforeEach((to, from, next) => {
      if (from.path === this.$route.path && this.formChanged) {
        this.unsavedDialog.visible = true;
        this.unsavedDialog.callback = () => next();
        next(false);
      } else {
        next();
      }
    });
  },
  methods: {
    async loadPromptData() {
      try {
        await this.$store.dispatch('prompts/getPromptDetails', this.$route.params.id);
        if (this.currentPrompt) {
          this.initFormFromPrompt(this.currentPrompt);
        } else {
          this.$message.error('未找到提示词');
          this.$router.push('/prompts');
        }
      } catch (error) {
        console.error('Error loading prompt data:', error);
        this.$message.error('加载提示词数据失败');
        this.$router.push('/prompts');
      }
    },
    initFormFromPrompt(prompt) {
      // 深拷贝防止直接修改 store 中的数据
      const promptCopy = JSON.parse(JSON.stringify(prompt));
      
      // 处理消息内容，确保每个消息都有 id
      if (promptCopy.messages) {
        promptCopy.messages = promptCopy.messages.map(msg => {
          // 如果消息内容不是字符串，转换为字符串
          if (typeof msg.content !== 'string') {
            if (msg.content && msg.content.text) {
              msg.content = msg.content.text;
            } else {
              msg.content = JSON.stringify(msg.content);
            }
          }
          return { ...msg, id: uuidv4() };
        });
      } else {
        promptCopy.messages = [];
      }
      
      // 确保参数数组存在
      if (!promptCopy.parameters) {
        promptCopy.parameters = [];
      }
      
      // 确保标签是数组
      if (!Array.isArray(promptCopy.tags)) {
        promptCopy.tags = promptCopy.tags ? [promptCopy.tags] : [];
      }
      
      this.promptForm = promptCopy;
      this.formChanged = false;
    },
    addParameter() {
      this.promptForm.parameters.push({
        name: '',
        type: 'string',
        description: '',
        required: false,
        default: ''
      });
    },
    removeParameter(index) {
      this.promptForm.parameters.splice(index, 1);
    },
    addMessage() {
      this.promptForm.messages.push({
        id: uuidv4(),
        role: 'system',
        content: ''
      });
    },
    removeMessage(index) {
      this.promptForm.messages.splice(index, 1);
    },
    handleBack() {
      if (this.formChanged) {
        this.unsavedDialog.visible = true;
        this.unsavedDialog.callback = () => {
          if (this.isEdit) {
            this.$router.push(`/prompts/${this.$route.params.id}`);
          } else {
            this.$router.push('/prompts');
          }
        };
      } else {
        if (this.isEdit) {
          this.$router.push(`/prompts/${this.$route.params.id}`);
        } else {
          this.$router.push('/prompts');
        }
      }
    },
    async handleSave() {
      try {
        await this.$refs.promptForm.validate();
        
        this.saving = true;
        
        // 准备保存的数据
        const promptData = JSON.parse(JSON.stringify(this.promptForm));
        
        // 移除消息中的 id 字段
        promptData.messages = promptData.messages.map(({ id, ...rest }) => rest);
        
        if (this.isEdit) {
          // 更新提示词
          await this.$store.dispatch('prompts/updatePrompt', {
            name: this.$route.params.id,
            updatedPrompt: promptData
          });
          this.$message.success('提示词更新成功');
          this.formChanged = false;
          this.$router.push(`/prompts/${this.$route.params.id}`);
        } else {
          // 添加新提示词
          await this.$store.dispatch('prompts/addPrompt', promptData);
          this.$message.success('提示词创建成功');
          this.formChanged = false;
          this.$router.push('/prompts');
        }
      } catch (error) {
        console.error('Error saving prompt:', error);
        this.$message.error(this.isEdit ? '更新提示词失败' : '创建提示词失败');
      } finally {
        this.saving = false;
      }
    },
    confirmLeave() {
      this.formChanged = false;
      this.unsavedDialog.visible = false;
      if (this.unsavedDialog.callback) {
        this.unsavedDialog.callback();
        this.unsavedDialog.callback = null;
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.prompt-edit-container {
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
  
  .form-card {
    margin-bottom: 20px;
  }
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .empty-parameters,
  .empty-messages {
    text-align: center;
    padding: 20px;
    color: #909399;
    background-color: #f5f7fa;
    border-radius: 4px;
  }
  
  .parameter-item {
    margin-bottom: 20px;
    padding: 15px;
    border: 1px solid #e6e6e6;
    border-radius: 4px;
    
    .parameter-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
      
      h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 500;
      }
    }
    
    &:last-child {
      margin-bottom: 0;
    }
  }
  
  .message-item {
    margin-bottom: 20px;
    padding: 15px;
    border: 1px solid #e6e6e6;
    border-radius: 4px;
    
    .message-header {
      display: flex;
      align-items: center;
      margin-bottom: 15px;
      
      .message-drag-handle {
        cursor: move;
        margin-right: 10px;
        color: #909399;
      }
      
      h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 500;
        flex-grow: 1;
      }
    }
    
    &.system {
      border-left: 4px solid #909399;
    }
    
    &.user {
      border-left: 4px solid #67c23a;
    }
    
    &.assistant {
      border-left: 4px solid #409eff;
    }
    
    &.function {
      border-left: 4px solid #e6a23c;
    }
    
    &:last-child {
      margin-bottom: 0;
    }
  }
}
</style>
