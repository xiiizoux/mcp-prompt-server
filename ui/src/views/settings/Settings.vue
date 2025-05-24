<template>
  <div class="settings-container">
    <el-row :gutter="20">
      <el-col :span="24">
        <div class="page-header">
          <h1 class="page-title">系统设置</h1>
          <el-button type="primary" @click="saveSettings" :loading="saving">
            保存设置
          </el-button>
        </div>
      </el-col>
    </el-row>
    
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="10" animated />
    </div>
    
    <template v-else>
      <el-form
        ref="settingsForm"
        :model="settingsForm"
        :rules="rules"
        label-width="180px"
        class="settings-form"
      >
        <!-- 基本设置 -->
        <el-card class="settings-card">
          <template #header>
            <div class="card-header">
              <span>基本设置</span>
            </div>
          </template>
          
          <el-form-item label="服务器名称" prop="serverName">
            <el-input v-model="settingsForm.serverName" placeholder="输入服务器名称" />
          </el-form-item>
          
          <el-form-item label="默认分页大小" prop="defaultPageSize">
            <el-input-number
              v-model="settingsForm.defaultPageSize"
              :min="5"
              :max="100"
              :step="5"
            />
          </el-form-item>
          
          <el-form-item label="启用缓存" prop="enableCache">
            <el-switch v-model="settingsForm.enableCache" />
            <span class="form-item-help">启用后可提高查询性能，但可能导致数据不是最新</span>
          </el-form-item>
          
          <el-form-item label="缓存过期时间(秒)" prop="cacheExpiration" v-if="settingsForm.enableCache">
            <el-input-number
              v-model="settingsForm.cacheExpiration"
              :min="60"
              :max="86400"
              :step="60"
            />
          </el-form-item>
        </el-card>
        
        <!-- 存储设置 -->
        <el-card class="settings-card">
          <template #header>
            <div class="card-header">
              <span>存储设置</span>
            </div>
          </template>
          
          <el-form-item label="存储类型" prop="storageType">
            <el-radio-group v-model="settingsForm.storageType">
              <el-radio label="file">文件存储</el-radio>
              <el-radio label="cloudflare">Cloudflare KV</el-radio>
            </el-radio-group>
          </el-form-item>
          
          <template v-if="settingsForm.storageType === 'file'">
            <el-form-item label="存储路径" prop="filePath">
              <el-input v-model="settingsForm.filePath" placeholder="输入文件存储路径" />
            </el-form-item>
          </template>
          
          <template v-if="settingsForm.storageType === 'cloudflare'">
            <el-form-item label="KV 命名空间" prop="kvNamespace">
              <el-input v-model="settingsForm.kvNamespace" placeholder="输入 KV 命名空间" />
            </el-form-item>
          </template>
        </el-card>
        
        <!-- 日志设置 -->
        <el-card class="settings-card">
          <template #header>
            <div class="card-header">
              <span>日志设置</span>
            </div>
          </template>
          
          <el-form-item label="日志级别" prop="logLevel">
            <el-select v-model="settingsForm.logLevel" placeholder="选择日志级别">
              <el-option label="错误" value="error" />
              <el-option label="警告" value="warn" />
              <el-option label="信息" value="info" />
              <el-option label="调试" value="debug" />
            </el-select>
          </el-form-item>
          
          <el-form-item label="启用请求日志" prop="enableRequestLogging">
            <el-switch v-model="settingsForm.enableRequestLogging" />
          </el-form-item>
          
          <el-form-item label="保存日志到文件" prop="saveLogsToFile">
            <el-switch v-model="settingsForm.saveLogsToFile" />
          </el-form-item>
          
          <el-form-item label="日志文件路径" prop="logFilePath" v-if="settingsForm.saveLogsToFile">
            <el-input v-model="settingsForm.logFilePath" placeholder="输入日志文件路径" />
          </el-form-item>
        </el-card>
        
        <!-- 高级设置 -->
        <el-card class="settings-card">
          <template #header>
            <div class="card-header">
              <span>高级设置</span>
            </div>
          </template>
          
          <el-form-item label="允许导入导出" prop="allowImportExport">
            <el-switch v-model="settingsForm.allowImportExport" />
          </el-form-item>
          
          <el-form-item label="启用版本控制" prop="enableVersioning">
            <el-switch v-model="settingsForm.enableVersioning" />
            <span class="form-item-help">启用后会保存提示词的历史版本</span>
          </el-form-item>
          
          <el-form-item label="最大版本数" prop="maxVersions" v-if="settingsForm.enableVersioning">
            <el-input-number
              v-model="settingsForm.maxVersions"
              :min="1"
              :max="100"
              :step="1"
            />
          </el-form-item>
          
          <el-form-item label="允许批量操作" prop="allowBatchOperations">
            <el-switch v-model="settingsForm.allowBatchOperations" />
          </el-form-item>
        </el-card>
      </el-form>
    </template>
    
    <!-- 重置确认对话框 -->
    <el-dialog
      v-model="resetDialog.visible"
      title="重置设置"
      width="30%"
    >
      <div class="reset-dialog-content">
        <p>确定要将所有设置重置为默认值吗？此操作不可恢复。</p>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="resetDialog.visible = false">取消</el-button>
          <el-button type="danger" @click="confirmReset">确定重置</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'Settings',
  data() {
    return {
      loading: false,
      saving: false,
      settingsForm: {
        // 基本设置
        serverName: 'MCP Prompt Server',
        defaultPageSize: 10,
        enableCache: true,
        cacheExpiration: 300,
        
        // 存储设置
        storageType: 'file',
        filePath: './data',
        kvNamespace: 'PROMPTS_KV',
        
        // 日志设置
        logLevel: 'info',
        enableRequestLogging: true,
        saveLogsToFile: false,
        logFilePath: './logs',
        
        // 高级设置
        allowImportExport: true,
        enableVersioning: false,
        maxVersions: 5,
        allowBatchOperations: true
      },
      rules: {
        serverName: [
          { required: true, message: '请输入服务器名称', trigger: 'blur' }
        ],
        defaultPageSize: [
          { required: true, message: '请输入默认分页大小', trigger: 'blur' },
          { type: 'number', min: 5, max: 100, message: '分页大小必须在 5 到 100 之间', trigger: 'blur' }
        ],
        filePath: [
          { required: true, message: '请输入文件存储路径', trigger: 'blur' }
        ],
        kvNamespace: [
          { required: true, message: '请输入 KV 命名空间', trigger: 'blur' }
        ],
        logFilePath: [
          { required: true, message: '请输入日志文件路径', trigger: 'blur' }
        ],
        maxVersions: [
          { required: true, message: '请输入最大版本数', trigger: 'blur' },
          { type: 'number', min: 1, max: 100, message: '最大版本数必须在 1 到 100 之间', trigger: 'blur' }
        ]
      },
      resetDialog: {
        visible: false
      }
    };
  },
  async created() {
    this.loading = true;
    try {
      await this.loadSettings();
    } catch (error) {
      console.error('Error loading settings:', error);
      this.$message.error('加载设置失败');
    } finally {
      this.loading = false;
    }
  },
  methods: {
    async loadSettings() {
      try {
        const settings = await this.$store.dispatch('settings/getSettings');
        if (settings) {
          // 合并设置，保留默认值
          this.settingsForm = { ...this.settingsForm, ...settings };
        }
      } catch (error) {
        console.error('Error loading settings:', error);
        throw error;
      }
    },
    async saveSettings() {
      try {
        await this.$refs.settingsForm.validate();
        
        this.saving = true;
        
        await this.$store.dispatch('settings/updateSettings', this.settingsForm);
        
        this.$message.success('设置保存成功');
      } catch (error) {
        console.error('Error saving settings:', error);
        this.$message.error('保存设置失败');
      } finally {
        this.saving = false;
      }
    },
    showResetDialog() {
      this.resetDialog.visible = true;
    },
    async confirmReset() {
      this.loading = true;
      try {
        // 重置为默认设置
        await this.$store.dispatch('settings/resetSettings');
        
        // 重新加载设置
        await this.loadSettings();
        
        this.$message.success('设置已重置为默认值');
        this.resetDialog.visible = false;
      } catch (error) {
        console.error('Error resetting settings:', error);
        this.$message.error('重置设置失败');
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.settings-container {
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
  
  .settings-card {
    margin-bottom: 20px;
  }
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .form-item-help {
    margin-left: 10px;
    color: #909399;
    font-size: 12px;
  }
  
  .loading-container {
    margin-top: 40px;
  }
}
</style>
