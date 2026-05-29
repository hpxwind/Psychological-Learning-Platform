<template>
  <div class="w-full">
    <div class="mb-8 text-center">
      <h1 class="font-black uppercase tracking-tight text-[40px] md:text-[56px] text-primary mb-2">后台管理</h1>
      <p class="text-gray-600 text-base font-mono">管理心理学效应与图书内容</p>
    </div>

    <div class="border-4 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
      <el-tabs type="border-card" class="admin-tabs">
        <el-tab-pane label="心理学效应管理">
          <div class="mb-4">
            <el-button type="primary" @click="openEffectDialog()">添加效应</el-button>
          </div>
          <el-table :data="effects" style="width: 100%" v-loading="loadingEffects">
            <el-table-column prop="id" label="ID" width="60" />
            <el-table-column prop="name" label="名称" min-width="180" />
            <el-table-column prop="proposer" label="提出者" min-width="150" />
            <el-table-column prop="description" label="简介" min-width="300" show-overflow-tooltip />
            <el-table-column label="操作" width="180" fixed="right">
              <template #default="scope">
                <el-button size="small" @click="openEffectDialog(scope.row)">编辑</el-button>
                <el-button size="small" type="danger" @click="handleDeleteEffect(scope.row.id)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-pagination
            background
            layout="prev, pager, next"
            :total="effectsTotal"
            :page-size="20"
            @current-change="handleEffectsPageChange"
            class="mt-4"
          />
        </el-tab-pane>

        <el-tab-pane label="图书管理">
          <div class="mb-4">
            <el-button type="primary" @click="openBookDialog()">添加图书</el-button>
          </div>
          <el-table :data="books" style="width: 100%" v-loading="loadingBooks">
            <el-table-column prop="id" label="ID" width="60" />
            <el-table-column prop="title" label="书名" min-width="200" show-overflow-tooltip />
            <el-table-column prop="author" label="作者" min-width="150" />
            <el-table-column prop="isbn" label="ISBN" min-width="150" />
            <el-table-column label="操作" width="180" fixed="right">
              <template #default="scope">
                <el-button size="small" @click="openBookDialog(scope.row)">编辑</el-button>
                <el-button size="small" type="danger" @click="handleDeleteBook(scope.row.id)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-pagination
            background
            layout="prev, pager, next"
            :total="booksTotal"
            :page-size="20"
            @current-change="handleBooksPageChange"
            class="mt-4"
          />
        </el-tab-pane>

        <el-tab-pane label="问卷管理">
          <div class="mb-4 flex gap-2">
            <el-button type="primary" @click="openScaleDialog()">添加问卷</el-button>
            <el-button @click="showUploadDialog = true">导入JSON文件</el-button>
            <el-button type="success" @click="syncFromLocal">同步本地数据</el-button>
          </div>
          <el-table :data="scales" style="width: 100%" v-loading="loadingScales">
            <el-table-column prop="id" label="ID" width="60" />
            <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
            <el-table-column prop="category" label="分类" width="120">
              <template #default="scope">
                {{ getCategoryLabel(scope.row.category) }}
              </template>
            </el-table-column>
            <el-table-column prop="tags" label="标签" width="150">
              <template #default="scope">
                <el-tag v-for="tag in (scope.row.tags || [])" :key="tag" size="small" class="mr-1">
                  {{ tag }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="question_count" label="题目数" width="80" />
            <el-table-column label="操作" width="280" fixed="right">
              <template #default="scope">
                <el-button size="small" @click="openScaleDialog(scope.row)">编辑</el-button>
                <el-button size="small" @click="manageQuestions(scope.row)">管理题目</el-button>
                <el-button size="small" type="danger" @click="handleDeleteScale(scope.row.id)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="名人管理">
          <div class="mb-4">
            <el-button type="primary" @click="openFamousDialog()">添加名人</el-button>
          </div>
          <el-table :data="famousPeople" style="width: 100%" v-loading="loadingFamous">
            <el-table-column prop="id" label="ID" width="60" />
            <el-table-column prop="name" label="姓名" min-width="120" />
            <el-table-column label="照片" width="80">
              <template #default="scope">
                <img v-if="scope.row.photo" :src="scope.row.photo" class="w-10 h-10 object-cover rounded border" />
                <span v-else class="text-gray-400">无</span>
              </template>
            </el-table-column>
            <el-table-column prop="introduction" label="简介" min-width="250" show-overflow-tooltip>
              <template #default="scope">
                <span v-html="truncateMd(scope.row.introduction, 50)"></span>
              </template>
            </el-table-column>
            <el-table-column label="状态照片" width="160">
              <template #default="scope">
                <div class="flex gap-1">
                  <img v-if="scope.row.status_idle" :src="scope.row.status_idle" class="w-8 h-8 object-cover rounded border" title="无动作" />
                  <img v-if="scope.row.status_listening" :src="scope.row.status_listening" class="w-8 h-8 object-cover rounded border" title="聆听" />
                  <img v-if="scope.row.status_thinking" :src="scope.row.status_thinking" class="w-8 h-8 object-cover rounded border" title="思考" />
                  <img v-if="scope.row.status_answered" :src="scope.row.status_answered" class="w-8 h-8 object-cover rounded border" title="思考出答案" />
                  <span v-if="!scope.row.status_idle && !scope.row.status_listening && !scope.row.status_thinking && !scope.row.status_answered" class="text-gray-400 text-xs">无</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="180" fixed="right">
              <template #default="scope">
                <el-button size="small" @click="openFamousDialog(scope.row)">编辑</el-button>
                <el-button size="small" type="danger" @click="handleDeleteFamous(scope.row.id)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-pagination
            background
            layout="prev, pager, next"
            :total="famousTotal"
            :page-size="20"
            @current-change="handleFamousPageChange"
            class="mt-4"
          />
        </el-tab-pane>

        <el-tab-pane label="视频管理">
          <div class="mb-4">
            <el-button type="primary" @click="openVideoSeriesDialog()">添加视频系列</el-button>
            <el-button @click="openVideoEpisodeDialog()">添加视频集数</el-button>
          </div>
          <el-table :data="videoSeriesList" style="width: 100%" v-loading="loadingVideos">
            <el-table-column prop="id" label="ID" width="60" />
            <el-table-column prop="title" label="系列标题" min-width="200" show-overflow-tooltip />
            <el-table-column prop="author" label="作者/UP主" min-width="120" />
            <el-table-column prop="category" label="分类" width="100">
              <template #default="scope">
                {{ scope.row.category === 'psychology' ? '心理学' : '哲学' }}
              </template>
            </el-table-column>
            <el-table-column label="集数" width="80">
              <template #default="scope">
                {{ scope.row.episode_count || 0 }}集
              </template>
            </el-table-column>
            <el-table-column prop="description" label="简介" min-width="300" show-overflow-tooltip />
            <el-table-column label="操作" width="220" fixed="right">
              <template #default="scope">
                <el-button size="small" @click="openVideoSeriesDialog(scope.row)">编辑</el-button>
                <el-button size="small" @click="openEpisodeManage(scope.row)">管理集数</el-button>
                <el-button size="small" type="danger" @click="handleDeleteVideoSeries(scope.row.id)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- Effect Dialog -->
    <el-dialog v-model="effectDialogVisible" :title="isEditEffect ? '编辑效应' : '添加效应'" fullscreen>
      <el-form :model="effectForm" label-width="100px">
        <el-form-item label="名称">
          <el-input v-model="effectForm.name" placeholder="效应名称" />
        </el-form-item>
        <el-form-item label="提出者">
          <el-input v-model="effectForm.proposer" placeholder="提出者" />
        </el-form-item>
        <el-form-item label="简介">
          <div class="mb-2">
            <el-button size="small" type="primary" plain @click="activeMdField = 'description'; mdImportDialogVisible = true">📄 导入MD文件</el-button>
          </div>
          <MdEditor v-model="effectForm.description" language="zh-CN" :toolbars="mdToolbars" style="height:200px" :onUploadImg="handleEditorImageUpload" />
        </el-form-item>
        <el-form-item label="实验内容">
          <div class="mb-2">
            <el-button size="small" type="primary" plain @click="activeMdField = 'experiment_content'; mdImportDialogVisible = true">📄 导入MD文件</el-button>
          </div>
          <MdEditor v-model="effectForm.experiment_content" language="zh-CN" :toolbars="mdToolbars" style="height:250px" :onUploadImg="handleEditorImageUpload" />
        </el-form-item>
        <el-form-item label="深度解析">
          <div class="mb-2">
            <el-button size="small" type="primary" plain @click="activeMdField = 'explanation'; mdImportDialogVisible = true">📄 导入MD文件</el-button>
          </div>
          <MdEditor v-model="effectForm.explanation" language="zh-CN" :toolbars="mdToolbars" style="height:250px" :onUploadImg="handleEditorImageUpload" />
        </el-form-item>
        <el-form-item label="背景图">
          <div class="space-y-3 w-full">
            <el-upload
              class="cover-upload"
              drag
              :action="uploadUrl"
              :headers="uploadHeaders"
              :before-upload="beforeUpload"
              :on-success="handleCoverUploadSuccess"
              :show-file-list="false"
              accept="image/*"
            >
              <el-icon class="el-icon--upload" :size="40"><upload-filled /></el-icon>
              <div class="el-upload__text mt-2">拖拽图片到此处或 <em>点击上传</em></div>
            </el-upload>
            <div v-if="effectForm.image_url" class="flex items-center gap-3">
              <img :src="effectForm.image_url" class="w-32 h-20 object-cover border-2 border-black rounded" />
              <el-input v-model="effectForm.image_url" placeholder="或手动输入背景图URL" />
            </div>
            <el-input v-else v-model="effectForm.image_url" placeholder="或手动输入背景图URL" />
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="effectDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveEffect">保存</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- MD Import Dialog -->
    <el-dialog v-model="mdImportDialogVisible" title="导入Markdown文件" width="500px">
      <el-upload
        ref="mdUploadRef"
        class="upload-md"
        drag
        :auto-upload="false"
        :limit="1"
        accept=".md,.txt,.markdown"
        :on-change="handleMdFileChange"
        :file-list="mdFileList"
      >
        <el-icon class="el-icon--upload" :size="40"><upload-filled /></el-icon>
        <div class="el-upload__text mt-2">
          拖拽MD文件到此处或 <em>点击上传</em>
        </div>
      </el-upload>
      <div v-if="mdPreview.length > 0" class="mt-3 text-sm text-green-600">
        ✓ 已加载 {{ mdPreview.length }} 字符，将写入 <b>{{ activeMdField === 'description' ? '简介' : activeMdField === 'experiment_content' ? '实验内容' : '深度解析' }}</b> 字段
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="mdImportDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmMdImport" :disabled="mdPreview.length === 0">确认导入</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- Book Dialog -->
    <el-dialog v-model="bookDialogVisible" :title="isEditBook ? '编辑图书' : '添加图书'" fullscreen>
      <el-form :model="bookForm" label-width="100px" class="max-w-3xl mx-auto">
        <el-form-item label="书名">
          <el-input v-model="bookForm.title" />
        </el-form-item>
        <el-form-item label="作者">
          <el-input v-model="bookForm.author" />
        </el-form-item>
        <el-form-item label="ISBN">
          <el-input v-model="bookForm.isbn" />
        </el-form-item>
        <el-form-item label="出版社">
          <el-input v-model="bookForm.publisher" />
        </el-form-item>
        <el-form-item label="出版日期">
          <el-date-picker v-model="bookForm.publish_date" type="date" placeholder="选择日期" style="width: 100%" />
        </el-form-item>
        <el-form-item label="封面">
          <div class="space-y-3 w-full">
            <el-upload
              class="cover-upload"
              drag
              :action="uploadUrl"
              :headers="uploadHeaders"
              :before-upload="beforeUpload"
              :on-success="handleBookCoverUploadSuccess"
              :show-file-list="false"
              accept="image/*"
            >
              <el-icon class="el-icon--upload" :size="40"><upload-filled /></el-icon>
              <div class="el-upload__text mt-2">拖拽图片到此处或 <em>点击上传</em></div>
            </el-upload>
            <div v-if="bookForm.cover_image" class="flex items-center gap-3">
              <img :src="bookForm.cover_image" class="w-24 h-32 object-cover border-2 border-black" />
              <el-input v-model="bookForm.cover_image" placeholder="或手动输入封面URL" />
            </div>
            <el-input v-else v-model="bookForm.cover_image" placeholder="或手动输入封面URL" />
          </div>
        </el-form-item>
        <el-form-item label="电子书URL">
          <el-input v-model="bookForm.ebook_url" />
        </el-form-item>
        <el-form-item label="简介">
          <el-input v-model="bookForm.summary_intro" type="textarea" :rows="4" />
        </el-form-item>
        <el-form-item label="关联名人">
          <el-select
            v-model="bookForm.famous_ids"
            multiple
            filterable
            placeholder="选择关联的名人"
            style="width: 100%"
          >
            <el-option
              v-for="f in allFamous"
              :key="f.id"
              :label="f.name"
              :value="f.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="bookDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveBook">保存</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- Upload JSON Dialog -->
    <el-dialog v-model="showUploadDialog" title="导入JSON文件" width="50%">
      <el-alert
        title="文件格式说明"
        type="info"
        :closable="false"
        class="mb-4"
      >
        <template #default>
          <p class="text-sm">请上传符合以下格式的JSON文件：</p>
          <pre class="text-xs bg-gray-100 p-2 mt-2 rounded overflow-x-auto">
{
  "title": "问卷标题",
  "brief": "问卷简介",
  "tags": ["标签1", "标签2"],
  "category": "mental_health",
  "cover_image": "https://example.com/image.jpg",
  "questions": [
    {
      "id": "q1",
      "title": "题目内容",
      "options": [
        {"label": "选项1", "value": 1},
        {"label": "选项2", "value": 2}
      ]
    }
  ],
  "report": "# 报告内容"
}</pre>
        </template>
      </el-alert>
      <el-upload
        ref="uploadRef"
        class="upload-demo"
        drag
        :auto-upload="false"
        :limit="1"
        accept=".json"
        :on-change="handleFileChange"
        :file-list="fileList"
      >
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">
          拖拽JSON文件到此处或 <em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">只能上传一个JSON文件</div>
        </template>
      </el-upload>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showUploadDialog = false">取消</el-button>
          <el-button type="primary" @click="uploadJsonFile" :loading="uploading">导入</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- Scale Dialog -->
    <el-dialog v-model="scaleDialogVisible" :title="isEditScale ? '编辑问卷' : '添加问卷'" width="70%">
      <el-form :model="scaleForm" label-width="100px">
        <el-form-item label="问卷标题" required>
          <el-input v-model="scaleForm.title" placeholder="请输入问卷标题" />
        </el-form-item>
        <el-form-item label="简介">
          <el-input v-model="scaleForm.brief" type="textarea" :rows="3" placeholder="请输入问卷简介" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="scaleForm.category" placeholder="请选择分类" style="width: 100%">
            <el-option label="心理健康" value="mental_health" />
            <el-option label="人格测评" value="personality" />
            <el-option label="情绪评估" value="emotion" />
            <el-option label="职业测评" value="career" />
            <el-option label="其他" value="general" />
          </el-select>
        </el-form-item>
        <el-form-item label="标签">
          <el-select v-model="scaleForm.tags" multiple placeholder="请选择标签" style="width: 100%">
            <el-option label="心理健康" value="心理健康" />
            <el-option label="症状评估" value="症状评估" />
            <el-option label="性格测试" value="性格测试" />
            <el-option label="个性测评" value="个性测评" />
            <el-option label="人格测试" value="人格测试" />
            <el-option label="心理学量表" value="心理学量表" />
            <el-option label="抑郁筛查" value="抑郁筛查" />
            <el-option label="情绪评估" value="情绪评估" />
            <el-option label="焦虑筛查" value="焦虑筛查" />
          </el-select>
        </el-form-item>
        <el-form-item label="封面图片">
          <el-input v-model="scaleForm.cover_image" placeholder="封面图片URL" />
        </el-form-item>
        
        <!-- 导入题目和报告 -->
        <el-divider content-position="left">导入问卷内容</el-divider>
        <el-form-item label="题目JSON">
          <el-upload
            ref="questionsUploadRef"
            class="upload-questions"
            drag
            :auto-upload="false"
            :limit="1"
            accept=".json"
            :on-change="handleQuestionsFileChange"
            :file-list="questionsFileList"
          >
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">拖拽或点击上传题目JSON文件</div>
            <template #tip>
              <div class="el-upload__tip text-xs text-gray-500">题目JSON格式: [{"id":"q1","title":"题目","options":[...]}]</div>
            </template>
          </el-upload>
          <div v-if="pendingQuestions.length > 0" class="mt-2 text-sm text-green-600">
            ✓ 已加载 {{ pendingQuestions.length }} 道题目
          </div>
        </el-form-item>
        <el-form-item label="报告MD">
          <el-upload
            ref="reportUploadRef"
            class="upload-report"
            drag
            :auto-upload="false"
            :limit="1"
            accept=".md,.txt"
            :on-change="handleReportFileChange"
            :file-list="reportFileList"
          >
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">拖拽或点击上传报告MD文件</div>
            <template #tip>
              <div class="el-upload__tip text-xs text-gray-500">Markdown格式的报告内容</div>
            </template>
          </el-upload>
          <div v-if="pendingReport" class="mt-2 text-sm text-green-600">
            ✓ 已加载报告内容 ({{ pendingReport.length }} 字符)
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="closeScaleDialog">取消</el-button>
          <el-button type="primary" @click="saveScale">保存</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- Questions Management Dialog -->
    <el-dialog v-model="questionsDialogVisible" :title="`管理题目 - ${currentScale?.title}`" width="80%" fullscreen>
      <div class="mb-4 flex justify-between items-center">
        <el-button type="primary" @click="addQuestion">添加题目</el-button>
        <el-button type="success" @click="saveQuestions">保存所有题目</el-button>
      </div>
      <div v-if="scaleQuestions.length === 0" class="text-center py-8 text-gray-500">
        暂无题目，请点击"添加题目"按钮添加
      </div>
      <div v-else class="space-y-4 max-h-[70vh] overflow-y-auto pr-4">
        <div v-for="(q, index) in scaleQuestions" :key="index" class="border p-4 rounded-lg bg-gray-50">
          <div class="flex justify-between items-start mb-3">
            <span class="font-bold">题目 {{ index + 1 }}</span>
            <el-button size="small" type="danger" @click="removeQuestion(index)">删除</el-button>
          </div>
          <el-form label-width="80px" class="text-left">
            <el-form-item label="题目内容">
              <el-input v-model="q.title" placeholder="请输入题目内容" />
            </el-form-item>
            <el-form-item label="选项">
              <div class="space-y-2 w-full">
                <div v-for="(opt, optIdx) in q.options" :key="optIdx" class="flex gap-2">
                  <el-input v-model="opt.label" placeholder="选项文字" class="flex-1" />
                  <el-input-number v-model="opt.value" :min="0" :max="100" class="w-24" />
                  <el-button @click="removeOption(q, optIdx)" type="danger" circle size="small">-</el-button>
                </div>
                <el-button size="small" @click="addOption(q)" plain>添加选项</el-button>
              </div>
            </el-form-item>
          </el-form>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="questionsDialogVisible = false">关闭</el-button>
          <el-button type="primary" @click="saveQuestions">保存</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- Video Series Dialog -->
    <el-dialog v-model="videoSeriesDialogVisible" :title="isEditVideoSeries ? '编辑视频系列' : '添加视频系列'" fullscreen>
      <el-form :model="videoSeriesForm" label-width="100px" class="max-w-3xl mx-auto">
        <el-form-item label="系列标题">
          <el-input v-model="videoSeriesForm.title" />
        </el-form-item>
        <el-form-item label="作者/UP主">
          <el-input v-model="videoSeriesForm.author" />
        </el-form-item>
        <el-form-item label="视频来源">
          <el-select v-model="videoSeriesForm.source" placeholder="请选择" style="width: 100%">
            <el-option label="B站" value="bilibili" />
            <el-option label="YouTube" value="youtube" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="分类标签">
          <el-select v-model="videoSeriesForm.category" placeholder="请选择" style="width: 100%">
            <el-option label="心理学" value="psychology" />
            <el-option label="哲学" value="philosophy" />
          </el-select>
        </el-form-item>
        <el-form-item label="封面图片">
          <div class="space-y-3 w-full">
            <el-upload
              class="cover-upload"
              drag
              :action="uploadUrl"
              :headers="uploadHeaders"
              :before-upload="beforeUpload"
              :on-success="handleVideoCoverUploadSuccess"
              :show-file-list="false"
              accept="image/*"
            >
              <el-icon class="el-icon--upload" :size="40"><upload-filled /></el-icon>
              <div class="el-upload__text mt-2">拖拽图片到此处或 <em>点击上传</em></div>
            </el-upload>
            <div v-if="videoSeriesForm.cover_image" class="flex items-center gap-3">
              <img :src="videoSeriesForm.cover_image" class="w-32 h-20 object-cover border-2 border-black rounded" />
              <el-input v-model="videoSeriesForm.cover_image" placeholder="或手动输入封面URL" />
            </div>
            <el-input v-else v-model="videoSeriesForm.cover_image" placeholder="或手动输入封面URL" />
          </div>
        </el-form-item>
        <el-form-item label="来源链接">
          <el-input v-model="videoSeriesForm.source_url" placeholder="B站空间链接等" />
        </el-form-item>
        <el-form-item label="系列简介">
          <el-input v-model="videoSeriesForm.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="AI介绍">
          <el-input v-model="videoSeriesForm.intro_text" type="textarea" :rows="4" placeholder="约300字的AI生成介绍" />
        </el-form-item>
        <el-form-item label="显示顺序">
          <el-input-number v-model="videoSeriesForm.display_order" :min="0" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="videoSeriesForm.status" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="videoSeriesDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveVideoSeries">保存</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- Video Episode Dialog -->
    <el-dialog v-model="videoEpisodeDialogVisible" :title="isEditVideoEpisode ? '编辑视频集数' : '添加视频集数'" fullscreen>
      <el-form :model="videoEpisodeForm" label-width="100px" class="max-w-3xl mx-auto">
        <el-form-item label="所属系列" v-if="!isEditVideoEpisode">
          <el-select v-model="videoEpisodeForm.series_id" placeholder="请选择系列" style="width: 100%">
            <el-option v-for="s in videoSeriesList" :key="s.id" :label="s.title" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="集数">
          <el-input-number v-model="videoEpisodeForm.episode_number" :min="1" />
        </el-form-item>
        <el-form-item label="集标题">
          <el-input v-model="videoEpisodeForm.title" />
        </el-form-item>
        <el-form-item label="视频链接">
          <el-input v-model="videoEpisodeForm.video_url" placeholder="粘贴B站视频链接，自动识别BV号" @blur="extractBvFromUrl" />
        </el-form-item>
        <el-form-item label="BV号">
          <el-input v-model="videoEpisodeForm.bv_number" placeholder="从视频链接自动识别" />
        </el-form-item>
        <el-form-item label="时长">
          <el-input v-model="videoEpisodeForm.duration" placeholder="粘贴B站链接后自动获取">
            <template #suffix>
              <el-button v-if="videoEpisodeForm.bv_number" size="small" @click="fetchBiliDuration" :loading="fetchingDuration" text>
                自动获取
              </el-button>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="单集简介">
          <el-input v-model="videoEpisodeForm.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="videoEpisodeForm.status" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="videoEpisodeDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveVideoEpisode">保存</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- Famous Person Dialog -->
    <el-dialog v-model="famousDialogVisible" :title="isEditFamous ? '编辑名人' : '添加名人'" fullscreen destroy-on-close :key="famousDialogKey">
      <el-form :model="famousForm" label-width="100px" class="max-w-4xl mx-auto">
        <el-form-item label="姓名" required>
          <el-input v-model="famousForm.name" placeholder="名人姓名" />
        </el-form-item>
        <el-form-item label="简介">
          <div class="mb-2">
            <el-button size="small" type="primary" plain @click="activeMdField = 'introduction'; mdImportDialogVisible = true">📄 导入MD文件</el-button>
          </div>
          <MdEditor v-model="famousForm.introduction" language="zh-CN" :toolbars="mdToolbars" style="height:200px" :onUploadImg="handleEditorImageUpload" />
        </el-form-item>
        <el-form-item label="生平">
          <div class="mb-2">
            <el-button size="small" type="primary" plain @click="activeMdField = 'life_story'; mdImportDialogVisible = true">📄 导入MD文件</el-button>
          </div>
          <MdEditor v-model="famousForm.life_story" language="zh-CN" :toolbars="mdToolbars" style="height:250px" :onUploadImg="handleEditorImageUpload" />
        </el-form-item>
        <el-form-item label="著作">
          <div class="mb-2">
            <el-button size="small" type="primary" plain @click="activeMdField = 'works'; mdImportDialogVisible = true">📄 导入MD文件</el-button>
          </div>
          <MdEditor v-model="famousForm.works" language="zh-CN" :toolbars="mdToolbars" style="height:200px" :onUploadImg="handleEditorImageUpload" />
        </el-form-item>
        <el-divider content-position="left">更多内容</el-divider>
        <el-form-item label="理论思想">
          <div class="mb-2">
            <el-button size="small" type="primary" plain @click="activeMdField = 'theory'; mdImportDialogVisible = true">📄 导入MD文件</el-button>
          </div>
          <MdEditor v-model="famousForm.theory" language="zh-CN" :toolbars="mdToolbars" style="height:200px" :onUploadImg="handleEditorImageUpload" />
        </el-form-item>
        <el-form-item label="人物影响">
          <div class="mb-2">
            <el-button size="small" type="primary" plain @click="activeMdField = 'influence'; mdImportDialogVisible = true">📄 导入MD文件</el-button>
          </div>
          <MdEditor v-model="famousForm.influence" language="zh-CN" :toolbars="mdToolbars" style="height:200px" :onUploadImg="handleEditorImageUpload" />
        </el-form-item>
        <el-form-item label="人物评价">
          <div class="mb-2">
            <el-button size="small" type="primary" plain @click="activeMdField = 'evaluation'; mdImportDialogVisible = true">📄 导入MD文件</el-button>
          </div>
          <MdEditor v-model="famousForm.evaluation" language="zh-CN" :toolbars="mdToolbars" style="height:200px" :onUploadImg="handleEditorImageUpload" />
        </el-form-item>
        <el-form-item label="出版图书">
          <el-select
            v-model="famousForm.published_books"
            multiple
            filterable
            placeholder="选择关联的图书（先到图书管理添加图书）"
            style="width: 100%"
          >
            <el-option
              v-for="b in allBooks"
              :key="b.id"
              :label="`${b.title}（${b.author}）`"
              :value="b.id"
            />
          </el-select>
        </el-form-item>
        <el-divider content-position="left">图片集（1-8张展示图片）</el-divider>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div v-for="(img, i) in galleryList" :key="i" class="border border-gray-300 rounded p-2">
            <div class="flex justify-between items-center mb-2">
              <span class="text-xs text-gray-500">图片 {{ i + 1 }}</span>
              <el-button size="small" type="danger" text @click="removeGalleryImage(i)">✕</el-button>
            </div>
            <el-upload
              class="cover-upload w-full"
              drag
              :action="uploadUrl"
              :headers="uploadHeaders"
              :before-upload="beforeUpload"
              :on-success="(res: any) => handleGallerySuccess(res, i)"
              :show-file-list="false"
              accept="image/*"
            >
              <el-icon v-if="!img" class="el-icon--upload" :size="24"><upload-filled /></el-icon>
              <img v-else :src="img" class="w-full h-20 object-cover rounded" />
              <div class="el-upload__text text-xs mt-1">{{ img ? '点击更换' : '上传图片' }}</div>
            </el-upload>
            <el-input v-model="galleryList[i]" size="small" placeholder="或输入URL" class="mt-1" />
          </div>
        </div>
        <el-button v-if="galleryList.length < 8" size="small" type="primary" plain @click="addGallerySlot" class="mt-3">+ 添加图片</el-button>
        <el-divider content-position="left">照片管理</el-divider>
        <el-form-item label="人物照片">
          <div class="space-y-3 w-full">
            <el-upload
              class="cover-upload"
              drag
              :action="uploadUrl"
              :headers="uploadHeaders"
              :before-upload="beforeUpload"
              :on-success="handleFamousPhotoSuccess"
              :show-file-list="false"
              accept="image/*"
            >
              <el-icon class="el-icon--upload" :size="40"><upload-filled /></el-icon>
              <div class="el-upload__text mt-2">拖拽图片到此处或 <em>点击上传</em></div>
            </el-upload>
            <div v-if="famousForm.photo" class="flex items-center gap-3">
              <img :src="famousForm.photo" class="w-24 h-28 object-cover border-2 border-black rounded" />
              <el-input v-model="famousForm.photo" placeholder="或手动输入照片URL" />
            </div>
            <el-input v-else v-model="famousForm.photo" placeholder="或手动输入照片URL" />
          </div>
        </el-form-item>
        <el-divider content-position="left">状态照片（四张）</el-divider>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <el-form-item label="无动作">
            <div class="space-y-2 w-full">
              <el-upload
                class="cover-upload"
                drag
                :action="uploadUrl"
                :headers="uploadHeaders"
                :before-upload="beforeUpload"
                :on-success="handleFamousIdleSuccess"
                :show-file-list="false"
                accept="image/*"
              >
                <el-icon class="el-icon--upload" :size="30"><upload-filled /></el-icon>
                <div class="el-upload__text text-xs mt-1">上传无动作照片</div>
              </el-upload>
              <div v-if="famousForm.status_idle" class="flex items-center gap-2">
                <img :src="famousForm.status_idle" class="w-16 h-20 object-cover border-2 border-black rounded" />
                <el-input v-model="famousForm.status_idle" size="small" placeholder="URL" />
              </div>
              <el-input v-else v-model="famousForm.status_idle" size="small" placeholder="或手动输入URL" />
            </div>
          </el-form-item>
          <el-form-item label="聆听">
            <div class="space-y-2 w-full">
              <el-upload
                class="cover-upload"
                drag
                :action="uploadUrl"
                :headers="uploadHeaders"
                :before-upload="beforeUpload"
                :on-success="handleFamousListeningSuccess"
                :show-file-list="false"
                accept="image/*"
              >
                <el-icon class="el-icon--upload" :size="30"><upload-filled /></el-icon>
                <div class="el-upload__text text-xs mt-1">上传聆听照片</div>
              </el-upload>
              <div v-if="famousForm.status_listening" class="flex items-center gap-2">
                <img :src="famousForm.status_listening" class="w-16 h-20 object-cover border-2 border-black rounded" />
                <el-input v-model="famousForm.status_listening" size="small" placeholder="URL" />
              </div>
              <el-input v-else v-model="famousForm.status_listening" size="small" placeholder="或手动输入URL" />
            </div>
          </el-form-item>
          <el-form-item label="思考">
            <div class="space-y-2 w-full">
              <el-upload
                class="cover-upload"
                drag
                :action="uploadUrl"
                :headers="uploadHeaders"
                :before-upload="beforeUpload"
                :on-success="handleFamousThinkingSuccess"
                :show-file-list="false"
                accept="image/*"
              >
                <el-icon class="el-icon--upload" :size="30"><upload-filled /></el-icon>
                <div class="el-upload__text text-xs mt-1">上传思考照片</div>
              </el-upload>
              <div v-if="famousForm.status_thinking" class="flex items-center gap-2">
                <img :src="famousForm.status_thinking" class="w-16 h-20 object-cover border-2 border-black rounded" />
                <el-input v-model="famousForm.status_thinking" size="small" placeholder="URL" />
              </div>
              <el-input v-else v-model="famousForm.status_thinking" size="small" placeholder="或手动输入URL" />
            </div>
          </el-form-item>
          <el-form-item label="思考出答案">
            <div class="space-y-2 w-full">
              <el-upload
                class="cover-upload"
                drag
                :action="uploadUrl"
                :headers="uploadHeaders"
                :before-upload="beforeUpload"
                :on-success="handleFamousAnsweredSuccess"
                :show-file-list="false"
                accept="image/*"
              >
                <el-icon class="el-icon--upload" :size="30"><upload-filled /></el-icon>
                <div class="el-upload__text text-xs mt-1">上传思考出答案照片</div>
              </el-upload>
              <div v-if="famousForm.status_answered" class="flex items-center gap-2">
                <img :src="famousForm.status_answered" class="w-16 h-20 object-cover border-2 border-black rounded" />
                <el-input v-model="famousForm.status_answered" size="small" placeholder="URL" />
              </div>
              <el-input v-else v-model="famousForm.status_answered" size="small" placeholder="或手动输入URL" />
            </div>
          </el-form-item>
        </div>

        <!-- 知识库上传 -->
        <div class="mt-6 pt-6 border-t border-gray-200">
          <h3 class="text-lg font-semibold text-gray-700 mb-3">📚 知识库</h3>
          <p class="text-xs text-gray-400 mb-4">上传知识库文件，AI 将基于这些文件回答用户问题。支持 .txt / .md / .pdf 格式。</p>

          <el-form-item label="角色约束">
            <p class="text-xs text-gray-400 mb-1">定义该名人的角色身份、说话风格和能力边界</p>
            <el-upload
              class="w-full"
              drag
              :auto-upload="false"
              :limit="1"
              accept=".txt,.md"
              :on-change="handleConstraintFileChange"
              :file-list="constraintFileList"
            >
              <el-icon class="el-icon--upload" :size="30"><upload-filled /></el-icon>
              <div class="el-upload__text mt-1">拖拽约束文件或 <em>点击上传</em></div>
              <template #tip>
                <div class="el-upload__tip text-xs">如已上传过，新上传会覆盖旧文件</div>
              </template>
            </el-upload>
            <div v-if="existingKnowledge.constraint" class="mt-1 text-xs text-green-600">
              已上传约束文件 ({{ existingKnowledge.constraintSize }})
            </div>
          </el-form-item>

          <el-form-item label="知识库文件">
            <p class="text-xs text-gray-400 mb-1">该名人的专业知识、理论体系、著作内容等参考资料</p>
            <el-upload
              class="w-full"
              drag
              :auto-upload="false"
              :limit="1"
              accept=".txt,.md,.pdf"
              :on-change="handleKnowledgeFileChange"
              :file-list="knowledgeFileList"
            >
              <el-icon class="el-icon--upload" :size="30"><upload-filled /></el-icon>
              <div class="el-upload__text mt-1">拖拽知识文件或 <em>点击上传</em></div>
              <template #tip>
                <div class="el-upload__tip text-xs">支持 PDF、TXT、MD 格式，最大 10MB</div>
              </template>
            </el-upload>
            <div v-if="existingKnowledge.knowledge" class="mt-1 text-xs text-green-600">
              已上传知识文件 ({{ existingKnowledge.knowledgeSize }})
            </div>
          </el-form-item>
        </div>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="famousDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveFamous">保存</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- Episode Management Dialog -->
    <el-dialog v-model="episodeManageVisible" :title="`管理集数 - ${currentSeries?.title}`" fullscreen>
      <div class="mb-4">
        <el-button type="primary" size="small" @click="openVideoEpisodeDialog()">添加集数</el-button>
      </div>
      <el-table :data="currentSeriesEpisodes" style="width: 100%">
        <el-table-column prop="episode_number" label="集数" width="80" />
        <el-table-column prop="title" label="标题" show-overflow-tooltip />
        <el-table-column prop="bv_number" label="BV号" width="150" />
        <el-table-column prop="duration" label="时长" width="100" />
        <el-table-column label="操作" width="180">
          <template #default="scope">
            <el-button size="small" @click="openVideoEpisodeDialog(scope.row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDeleteVideoEpisode(scope.row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, computed } from 'vue';
import api from '@/lib/axios';
import { ElMessage, ElMessageBox } from 'element-plus';
import { UploadFilled } from '@element-plus/icons-vue';
import { MdEditor } from 'md-editor-v3';
import 'md-editor-v3/lib/style.css';

// Effects Logic
const effects = ref([]);
const loadingEffects = ref(false);
const effectsTotal = ref(0);
const effectDialogVisible = ref(false);
const isEditEffect = ref(false);
const effectForm = reactive({
  id: null,
  name: '',
  proposer: '',
  description: '',
  experiment_content: '',
  explanation: '',
  image_url: ''
});

// Markdown tools config
const mdToolbars: any[] = [
  'bold', 'italic', 'strikethrough', 'title', '|',
  'unorderedList', 'orderedList', 'quote', 'code', 'codeRow', 'table', '|',
  'link', 'image', '|',
  'preview', 'fullscreen'
];

// Upload config
const uploadUrl = '/api/upload/media';
const uploadHeaders = computed(() => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
});

// MD file import
const activeMdField = ref('description');
const mdImportDialogVisible = ref(false);
const mdFileList = ref<any[]>([]);
const mdPreview = ref('');
const mdUploadRef = ref<any>(null);

// Image upload handler for markdown editor
const handleEditorImageUpload = async (files: File[], callback: (urls: string[]) => void) => {
  const urls: string[] = [];
  for (const file of files) {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(uploadUrl, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.url) {
        urls.push(data.url);
      }
    } catch (e) {
      console.error('Upload failed:', e);
    }
  }
  callback(urls);
};

// Cover image upload
const handleCoverUploadSuccess = (response: any) => {
  if (response.success && response.url) {
    effectForm.image_url = response.url;
    ElMessage.success('图片上传成功');
  }
};

const beforeUpload = (file: File) => {
  const isImage = file.type.startsWith('image/');
  if (!isImage) {
    ElMessage.error('只能上传图片文件！');
    return false;
  }
  const isLt8M = file.size / 1024 / 1024 < 8;
  if (!isLt8M) {
    ElMessage.error('图片大小不能超过 8MB！');
    return false;
  }
  return true;
};

// MD file import handlers
const handleMdFileChange = (file: any) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    mdPreview.value = (e.target?.result as string) || '';
  };
  reader.readAsText(file.raw);
};

const confirmMdImport = () => {
  if (mdPreview.value.length === 0) return;
  const fieldMap: Record<string, string> = {
    'description': '简介',
    'experiment_content': '实验内容',
    'explanation': '深度解析',
    'introduction': '简介',
    'life_story': '生平',
    'works': '著作',
  };
  // 尝试写入 famousForm 或 effectForm
  if (activeMdField.value in famousForm) {
    (famousForm as any)[activeMdField.value] = mdPreview.value;
  } else if (activeMdField.value in effectForm) {
    (effectForm as any)[activeMdField.value] = mdPreview.value;
  }
  ElMessage.success(`已导入到${fieldMap[activeMdField.value] || activeMdField.value}字段`);
  mdImportDialogVisible.value = false;
  mdPreview.value = '';
  mdFileList.value = [];
};

const fetchEffects = async (page = 1) => {
  loadingEffects.value = true;
  try {
    const res = await api.get('/effects', { params: { page, limit: 20 } });
    if (res.data.success) {
      effects.value = res.data.effects;
      effectsTotal.value = res.data.pagination.total;
    }
  } catch (error) {
    console.error(error);
  } finally {
    loadingEffects.value = false;
  }
};

const openEffectDialog = async (row: any = null) => {
  isEditEffect.value = !!row;
  effectDialogVisible.value = true;
  mdPreview.value = '';
  mdFileList.value = [];
  if (row) {
    try {
      const res = await api.get(`/effects/${row.id}`);
      if (res.data.success) {
        const detail = res.data.effect;
        Object.assign(effectForm, detail);
        try {
          const exp = typeof detail.experiment_detail === 'string' ? JSON.parse(detail.experiment_detail) : detail.experiment_detail;
          effectForm.experiment_content = exp?.content || '';
        } catch (e) {
          effectForm.experiment_title = '';
          effectForm.experiment_content = '';
        }
        if (detail.media && detail.media.length > 0) {
          const img = detail.media.find((m: any) => m.media_type === 'image');
          effectForm.image_url = img ? img.file_url : '';
        } else {
          effectForm.image_url = '';
        }
      }
    } catch (error) {
      ElMessage.error('获取详情失败');
    }
  } else {
    Object.assign(effectForm, { id: null, name: '', proposer: '', description: '', experiment_content: '', explanation: '', image_url: '' });
  }
};

const saveEffect = async () => {
  try {
    const payload = {
      name: effectForm.name,
      proposer: effectForm.proposer,
      description: effectForm.description,
      experiment_detail: { title: '', content: effectForm.experiment_content },
      explanation: effectForm.explanation,
      images: effectForm.image_url ? [effectForm.image_url] : []
    };
    if (isEditEffect.value && effectForm.id) {
      await api.put(`/effects/${effectForm.id}`, payload);
      ElMessage.success('更新成功');
    } else {
      await api.post('/effects', payload);
      ElMessage.success('创建成功');
    }
    effectDialogVisible.value = false;
    fetchEffects();
  } catch (error: any) {
    const msg = error?.response?.data?.message || error?.message || '未知错误';
    ElMessage.error('保存失败：' + msg);
  }
};

const handleDeleteEffect = async (id: number) => {
  try {
    await ElMessageBox.confirm('确定删除吗?', '提示', { type: 'warning' });
    await api.delete(`/effects/${id}`);
    ElMessage.success('删除成功');
    fetchEffects();
  } catch (error) {
    if (error !== 'cancel') ElMessage.error('删除失败');
  }
};

const handleEffectsPageChange = (page: number) => fetchEffects(page);

// Books Logic
const books = ref([]);
const loadingBooks = ref(false);
const booksTotal = ref(0);
const bookDialogVisible = ref(false);
const isEditBook = ref(false);
const bookForm = reactive({
  id: null as number | null, title: '', author: '', isbn: '', publisher: '', publish_date: '', cover_image: '', ebook_url: '', summary_intro: '',
  famous_ids: [] as number[]
});

// 所有名人列表（供图书编辑时选择）
const allFamous = ref<any[]>([]);
const fetchAllFamous = async () => {
  try {
    const res = await api.get('/famous', { params: { page: 1, limit: 200 } });
    if (res.data.success) allFamous.value = res.data.data || [];
  } catch { /* ignore */ }
};

const fetchBooks = async (page = 1) => {
  loadingBooks.value = true;
  try {
    const res = await api.get('/books', { params: { page, limit: 20 } });
    if (res.data.success) {
      books.value = res.data.books;
      booksTotal.value = res.data.pagination.total;
    }
  } catch (error) {
    console.error(error);
  } finally {
    loadingBooks.value = false;
  }
};

const openBookDialog = async (row: any = null) => {
  isEditBook.value = !!row;
  bookDialogVisible.value = true;
  if (row) {
    try {
      const res = await api.get(`/books/${row.id}`);
      if (res.data.success) {
        const detail = res.data.book;
        Object.assign(bookForm, detail);
        bookForm.famous_ids = detail.famous_ids || [];
        if (detail.summary) {
          try {
            const summary = typeof detail.summary === 'string' ? JSON.parse(detail.summary) : detail.summary;
            bookForm.summary_intro = summary.intro || '';
          } catch (e) {
            bookForm.summary_intro = '';
          }
        }
      }
    } catch (error) {
      ElMessage.error('获取详情失败');
    }
  } else {
    Object.assign(bookForm, { id: null, title: '', author: '', isbn: '', publisher: '', publish_date: '', cover_image: '', ebook_url: '', summary_intro: '', famous_ids: [] });
  }
};

const saveBook = async () => {
  try {
    const payload: any = {
      title: bookForm.title, author: bookForm.author, isbn: bookForm.isbn, publisher: bookForm.publisher,
      publish_date: bookForm.publish_date, cover_image: bookForm.cover_image, ebook_url: bookForm.ebook_url,
      summary: { intro: bookForm.summary_intro }
    };
    if (bookForm.famous_ids && bookForm.famous_ids.length > 0) {
      payload.famous_ids = bookForm.famous_ids;
    }
    if (isEditBook.value && bookForm.id) {
      await api.put(`/books/${bookForm.id}`, payload);
      ElMessage.success('更新成功');
    } else {
      await api.post('/books', payload);
      ElMessage.success('创建成功');
    }
    bookDialogVisible.value = false;
    fetchBooks();
  } catch (error: any) {
    const msg = error?.response?.data?.message || error?.message || '未知错误';
    ElMessage.error('保存失败：' + msg);
  }
};

const handleDeleteBook = async (id: number) => {
  try {
    await ElMessageBox.confirm('确定删除吗?', '提示', { type: 'warning' });
    await api.delete(`/books/${id}`);
    ElMessage.success('删除成功');
    fetchBooks();
  } catch (error) {
    if (error !== 'cancel') ElMessage.error('删除失败');
  }
};

const handleBookCoverUploadSuccess = (response: any) => {
  if (response.success && response.url) {
    bookForm.cover_image = response.url;
    ElMessage.success('封面上传成功');
  }
};

const handleBooksPageChange = (page: number) => fetchBooks(page);

// Videos Logic
const videoSeriesList = ref([]);
const loadingVideos = ref(false);
const videoSeriesDialogVisible = ref(false);
const videoEpisodeDialogVisible = ref(false);
const episodeManageVisible = ref(false);
const isEditVideoSeries = ref(false);
const isEditVideoEpisode = ref(false);
const currentSeries = ref<any>(null);
const currentSeriesEpisodes = ref([]);

const videoSeriesForm = reactive({
  id: null, title: '', author: '', source: 'bilibili', category: 'psychology', cover_image: '',
  source_url: '', description: '', intro_text: '', display_order: 0, status: 1
});

const videoEpisodeForm = reactive({
  id: null, series_id: null as number | null, episode_number: 1, title: '', bv_number: '',
  video_url: '', duration: '', description: '', intro_text: '', status: 1
});

// Scales Logic
const scales = ref([]);
const loadingScales = ref(false);
const scaleDialogVisible = ref(false);
const questionsDialogVisible = ref(false);
const isEditScale = ref(false);
const currentScale = ref<any>(null);
const scaleQuestions = ref<any[]>([]);

// Upload Logic
const showUploadDialog = ref(false);
const uploadRef = ref<any>(null);
const uploading = ref(false);
const fileList = ref<any[]>([]);
const pendingJsonData = ref<any>(null);

// Scale dialog upload refs
const questionsUploadRef = ref<any>(null);
const reportUploadRef = ref<any>(null);
const questionsFileList = ref<any[]>([]);
const reportFileList = ref<any[]>([]);
const pendingQuestions = ref<any[]>([]);
const pendingReport = ref<string>('');

const scaleForm = reactive({
  id: null as number | null,
  title: '',
  brief: '',
  category: 'general',
  tags: [] as string[],
  cover_image: ''
});

const fetchScales = async () => {
  loadingScales.value = true;
  try {
    const res = await api.get('/scales');
    if (res.data.success) {
      scales.value = res.data.scales;
    }
  } catch (error) {
    console.error(error);
  } finally {
    loadingScales.value = false;
  }
};

const openScaleDialog = async (row: any = null) => {
  isEditScale.value = !!row;
  scaleDialogVisible.value = true;
  // 清空上传文件状态
  questionsFileList.value = [];
  reportFileList.value = [];
  pendingQuestions.value = [];
  pendingReport.value = '';
  
  if (row) {
    try {
      const res = await api.get(`/scales/${row.id}`);
      if (res.data.success) {
        const detail = res.data.scale;
        scaleForm.id = detail.id;
        scaleForm.title = detail.title;
        scaleForm.brief = detail.brief || '';
        scaleForm.category = detail.category || 'general';
        scaleForm.tags = detail.tags || [];
        scaleForm.cover_image = detail.cover_image || '';
        // 编辑模式下也显示已有的题目和报告
        pendingQuestions.value = detail.questions || [];
        pendingReport.value = detail.report || '';
      }
    } catch (error) {
      ElMessage.error('获取详情失败');
    }
  } else {
    scaleForm.id = null;
    scaleForm.title = '';
    scaleForm.brief = '';
    scaleForm.category = 'general';
    scaleForm.tags = [];
    scaleForm.cover_image = '';
  }
};

// 关闭对话框时清空上传状态
const closeScaleDialog = () => {
  questionsFileList.value = [];
  reportFileList.value = [];
  pendingQuestions.value = [];
  pendingReport.value = '';
  scaleDialogVisible.value = false;
};

// 处理题目JSON文件
const handleQuestionsFileChange = (file: any) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const content = e.target?.result;
      const json = JSON.parse(content as string);
      
      // 支持两种格式：
      // 1. 直接数组: [{ "id": "q1", "title": "...", "options": [...] }]
      // 2. 对象格式: { "scale_id": 1, "scale_title": "...", "questions": [...] }
      let questions = [];
      if (Array.isArray(json)) {
        questions = json;
      } else if (json.questions && Array.isArray(json.questions)) {
        // 如果有scale_title但问卷标题为空，使用它
        if (!scaleForm.title && json.scale_title) {
          scaleForm.title = json.scale_title;
        }
        questions = json.questions;
      } else {
        ElMessage.error('题目JSON格式错误');
        questionsFileList.value = [];
        return;
      }
      
      pendingQuestions.value = questions;
      ElMessage.success(`成功加载 ${questions.length} 道题目`);
    } catch (error) {
      ElMessage.error('JSON格式错误，请检查文件内容');
      questionsFileList.value = [];
    }
  };
  reader.readAsText(file.raw);
};

// 处理报告MD文件
const handleReportFileChange = (file: any) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const content = e.target?.result;
      pendingReport.value = content as string;
      ElMessage.success(`成功加载报告内容 (${(content as string).length} 字符)`);
    } catch (error) {
      ElMessage.error('读取报告文件失败');
      reportFileList.value = [];
    }
  };
  reader.readAsText(file.raw);
};

const saveScale = async () => {
  if (!scaleForm.title.trim()) {
    ElMessage.warning('请输入问卷标题');
    return;
  }
  try {
    const payload = {
      title: scaleForm.title,
      brief: scaleForm.brief,
      category: scaleForm.category,
      tags: scaleForm.tags,
      cover_image: scaleForm.cover_image,
      questions: pendingQuestions.value,
      report: pendingReport.value
    };
    if (isEditScale.value && scaleForm.id) {
      await api.put(`/scales/${scaleForm.id}`, payload);
      ElMessage.success('更新成功');
    } else {
      await api.post('/scales', payload);
      ElMessage.success('创建成功');
    }
    closeScaleDialog();
    fetchScales();
  } catch (error: any) {
    const msg = error?.response?.data?.message || error?.message || '未知错误';
    ElMessage.error('保存失败：' + msg);
  }
};

const handleDeleteScale = async (id: number) => {
  try {
    await ElMessageBox.confirm('确定删除吗？该操作会同时删除关联的题目和报告文件！', '提示', { type: 'warning' });
    await api.delete(`/scales/${id}`);
    ElMessage.success('删除成功');
    fetchScales();
  } catch (error) {
    if (error !== 'cancel') ElMessage.error('删除失败');
  }
};

const manageQuestions = async (row: any) => {
  currentScale.value = row;
  questionsDialogVisible.value = true;
  try {
    const res = await api.get(`/scales/${row.id}`);
    if (res.data.success) {
      scaleQuestions.value = res.data.scale.questions || [];
    }
  } catch (error) {
    ElMessage.error('获取题目失败');
    scaleQuestions.value = [];
  }
};

const addQuestion = () => {
  scaleQuestions.value.push({
    id: `q_${Date.now()}`,
    title: '',
    options: [
      { label: '非常符合', value: 5 },
      { label: '比较符合', value: 4 },
      { label: '一般', value: 3 },
      { label: '不太符合', value: 2 },
      { label: '很不符合', value: 1 }
    ]
  });
};

const removeQuestion = (index: number) => {
  scaleQuestions.value.splice(index, 1);
};

const addOption = (question: any) => {
  const nextValue = question.options.length > 0 
    ? Math.max(...question.options.map((o: any) => o.value)) + 1 
    : 1;
  question.options.push({ label: '', value: nextValue });
};

const removeOption = (question: any, index: number) => {
  question.options.splice(index, 1);
};

const saveQuestions = async () => {
  if (!currentScale.value) return;
  try {
    // 过滤掉没有标题的题目
    const validQuestions = scaleQuestions.value.filter(q => q.title.trim());
    await api.put(`/scales/${currentScale.value.id}`, {
      questions: validQuestions
    });
    ElMessage.success('题目保存成功');
    questionsDialogVisible.value = false;
    fetchScales();
  } catch (error: any) {
    const msg = error?.response?.data?.message || error?.message || '未知错误';
    ElMessage.error('保存失败：' + msg);
  }
};

const getCategoryLabel = (category: string) => {
  const labels: Record<string, string> = {
    'mental_health': '心理健康',
    'personality': '人格测评',
    'emotion': '情绪评估',
    'career': '职业测评',
    'general': '其他'
  };
  return labels[category] || category;
};

// 上传JSON文件处理
const handleFileChange = (file: any) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const content = e.target?.result;
      const json = JSON.parse(content as string);
      pendingJsonData.value = json;
    } catch (error) {
      ElMessage.error('JSON格式错误，请检查文件内容');
      fileList.value = [];
    }
  };
  reader.readAsText(file.raw);
};

// 上传JSON文件到后端
const uploadJsonFile = async () => {
  if (!pendingJsonData.value) {
    ElMessage.warning('请先选择JSON文件');
    return;
  }
  uploading.value = true;
  try {
    const data = pendingJsonData.value;
    if (!data.title) {
      ElMessage.error('JSON中缺少title字段');
      return;
    }
    await api.post('/scales', {
      title: data.title,
      brief: data.brief || '',
      tags: data.tags || [],
      category: data.category || 'general',
      cover_image: data.cover_image || '',
      questions: data.questions || [],
      report: data.report || ''
    });
    ElMessage.success('导入成功');
    showUploadDialog.value = false;
    fileList.value = [];
    pendingJsonData.value = null;
    fetchScales();
  } catch (error) {
    ElMessage.error('导入失败');
  } finally {
    uploading.value = false;
  }
};

// 同步本地JSON数据
const syncFromLocal = async () => {
  try {
    // 读取本地的 scales.json
    const response = await fetch('/data/scales.json');
    const data = await response.json();
    
    if (!data.scales || !Array.isArray(data.scales)) {
      ElMessage.warning('本地数据格式错误');
      return;
    }

    // 同步每个问卷
    let successCount = 0;
    for (const scale of data.scales) {
      try {
        // 检查是否已存在
        const existing = scales.value.find((s: any) => s.id === scale.id);
        if (!existing) {
          // 读取题目文件
          let questions = [];
          if (scale.questions_path) {
            try {
              const qRes = await fetch(scale.questions_path);
              questions = await qRes.json();
            } catch (e) {
              questions = [];
            }
          }
          // 读取报告文件
          let report = '';
          if (scale.report_path) {
            try {
              const rRes = await fetch(scale.report_path);
              report = await rRes.text();
            } catch (e) {
              report = '';
            }
          }
          // 创建问卷
          await api.post('/scales', {
            title: scale.title,
            brief: scale.brief || '',
            tags: scale.tags || [],
            category: scale.category || 'general',
            cover_image: scale.cover_image || '',
            questions: questions,
            report: report
          });
          successCount++;
        }
      } catch (e) {
        console.error(`同步问卷 ${scale.title} 失败:`, e);
      }
    }
    
    if (successCount > 0) {
      ElMessage.success(`成功同步 ${successCount} 个问卷`);
      fetchScales();
    } else {
      ElMessage.info('所有问卷已存在，无需同步');
    }
  } catch (error) {
    ElMessage.error('同步失败：' + error);
  }
};

const fetchVideoSeries = async () => {
  loadingVideos.value = true;
  try {
    const res = await api.get('/videos/series');
    if (res.data.success) videoSeriesList.value = res.data.data;
  } catch (error) {
    console.error(error);
  } finally {
    loadingVideos.value = false;
  }
};

const openVideoSeriesDialog = async (row: any = null) => {
  isEditVideoSeries.value = !!row;
  videoSeriesDialogVisible.value = true;
  if (row) {
    try {
      const res = await api.get(`/videos/series/${row.id}`);
      if (res.data.success) {
        const detail = res.data.data;
        Object.assign(videoSeriesForm, detail);
        try {
          const intro = typeof detail.intro === 'string' ? JSON.parse(detail.intro) : detail.intro;
          videoSeriesForm.intro_text = intro?.content || intro?.intro || '';
        } catch (e) {
          videoSeriesForm.intro_text = '';
        }
      }
    } catch (error) {
      ElMessage.error('获取详情失败');
    }
  } else {
    Object.assign(videoSeriesForm, { id: null, title: '', author: '', source: 'bilibili', category: 'psychology', cover_image: '', source_url: '', description: '', intro_text: '', display_order: 0, status: 1 });
  }
};

const saveVideoSeries = async () => {
  try {
    const payload = {
      title: videoSeriesForm.title, author: videoSeriesForm.author, source: videoSeriesForm.source,
      category: videoSeriesForm.category, cover_image: videoSeriesForm.cover_image, source_url: videoSeriesForm.source_url,
      description: videoSeriesForm.description, intro: videoSeriesForm.intro_text ? JSON.stringify({ content: videoSeriesForm.intro_text }) : null,
      display_order: videoSeriesForm.display_order, status: videoSeriesForm.status
    };
    if (isEditVideoSeries.value && videoSeriesForm.id) {
      await api.put(`/videos/series/${videoSeriesForm.id}`, payload);
      ElMessage.success('更新成功');
    } else {
      await api.post('/videos/series', payload);
      ElMessage.success('创建成功');
    }
    videoSeriesDialogVisible.value = false;
    fetchVideoSeries();
  } catch (error: any) {
    const msg = error?.response?.data?.message || error?.message || '未知错误';
    ElMessage.error('保存失败：' + msg);
  }
};

const handleVideoCoverUploadSuccess = (response: any) => {
  if (response.success && response.url) {
    videoSeriesForm.cover_image = response.url;
    ElMessage.success('封面上传成功');
  }
};

// 从视频链接中自动提取B站BV号
const extractBvFromUrl = () => {
  const url = videoEpisodeForm.video_url;
  if (!url) return;
  const match = url.match(/BV[a-zA-Z0-9]{10}/);
  if (match) {
    videoEpisodeForm.bv_number = match[0];
    ElMessage.success('已自动识别 BV 号');
    // 自动获取时长
    fetchBiliDuration();
  }
};

// 通过B站API自动获取视频时长
const fetchingDuration = ref(false);
const fetchBiliDuration = async () => {
  const bvid = videoEpisodeForm.bv_number;
  if (!bvid) return;
  fetchingDuration.value = true;
  try {
    const res = await fetch(`https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`);
    const data = await res.json();
    if (data.code === 0 && data.data) {
      const durationSec = data.data.duration; // 秒
      const min = Math.floor(durationSec / 60);
      const sec = durationSec % 60;
      videoEpisodeForm.duration = `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
      ElMessage.success('已自动获取视频时长');
    }
  } catch {
    ElMessage.warning('获取时长失败，请手动填写');
  } finally {
    fetchingDuration.value = false;
  }
};

const handleDeleteVideoSeries = async (id: number) => {
  try {
    await ElMessageBox.confirm('确定删除吗？该操作会同时删除所有集数！', '提示', { type: 'warning' });
    await api.delete(`/videos/series/${id}`);
    ElMessage.success('删除成功');
    fetchVideoSeries();
  } catch (error) {
    if (error !== 'cancel') ElMessage.error('删除失败');
  }
};

const openEpisodeManage = async (row: any) => {
  currentSeries.value = row;
  episodeManageVisible.value = true;
  try {
    const res = await api.get(`/videos/series/${row.id}`);
    if (res.data.success) currentSeriesEpisodes.value = res.data.data.episodes || [];
  } catch (error) {
    ElMessage.error('获取集数失败');
  }
};

const openVideoEpisodeDialog = async (row: any = null) => {
  isEditVideoEpisode.value = !!row;
  videoEpisodeDialogVisible.value = true;
  if (row) {
    try {
      const res = await api.get(`/videos/episodes/${row.id}`);
      if (res.data.success) {
        const detail = res.data.data;
        Object.assign(videoEpisodeForm, detail);
        videoEpisodeForm.series_id = detail.series_id;
        try {
          const intro = typeof detail.intro === 'string' ? JSON.parse(detail.intro) : detail.intro;
          videoEpisodeForm.intro_text = intro?.content || intro?.intro || '';
        } catch (e) {
          videoEpisodeForm.intro_text = '';
        }
      }
    } catch (error) {
      ElMessage.error('获取详情失败');
    }
  } else {
    Object.assign(videoEpisodeForm, { id: null, series_id: currentSeries.value?.id || null, episode_number: 1, title: '', bv_number: '', video_url: '', duration: '', description: '', intro_text: '', status: 1 });
  }
};

const saveVideoEpisode = async () => {
  try {
    const payload = {
      series_id: videoEpisodeForm.series_id, episode_number: videoEpisodeForm.episode_number, title: videoEpisodeForm.title,
      bv_number: videoEpisodeForm.bv_number, video_url: videoEpisodeForm.video_url, duration: videoEpisodeForm.duration,
      description: videoEpisodeForm.description, intro: videoEpisodeForm.intro_text ? JSON.stringify({ content: videoEpisodeForm.intro_text }) : null,
      status: videoEpisodeForm.status
    };
    if (isEditVideoEpisode.value && videoEpisodeForm.id) {
      await api.put(`/videos/episodes/${videoEpisodeForm.id}`, payload);
      ElMessage.success('更新成功');
    } else {
      await api.post('/videos/episodes', payload);
      ElMessage.success('创建成功');
    }
    videoEpisodeDialogVisible.value = false;
    if (currentSeries.value) openEpisodeManage(currentSeries.value);
    fetchVideoSeries();
  } catch (error: any) {
    const msg = error?.response?.data?.message || error?.message || '未知错误';
    ElMessage.error('保存失败：' + msg);
  }
};

const handleDeleteVideoEpisode = async (id: number) => {
  try {
    await ElMessageBox.confirm('确定删除吗?', '提示', { type: 'warning' });
    await api.delete(`/videos/episodes/${id}`);
    ElMessage.success('删除成功');
    if (currentSeries.value) openEpisodeManage(currentSeries.value);
    fetchVideoSeries();
  } catch (error) {
    if (error !== 'cancel') ElMessage.error('删除失败');
  }
};

// Famous People Logic
const famousPeople = ref([]);
const loadingFamous = ref(false);
const famousTotal = ref(0);
const famousDialogVisible = ref(false);
const famousDialogKey = ref(0);
const isEditFamous = ref(false);
const famousForm = reactive({
  id: null as number | null,
  name: '',
  introduction: '',
  life_story: '',
  works: '',
  theory: '',
  influence: '',
  evaluation: '',
  published_books: [] as number[],
  gallery: '',
  photo: '',
  status_idle: '',
  status_listening: '',
  status_thinking: '',
  status_answered: ''
});

// 所有图书列表（供名人编辑时选择）
const allBooks = ref<any[]>([]);
const fetchAllBooks = async () => {
  try {
    const res = await api.get('/books', { params: { page: 1, limit: 200 } });
    if (res.data.success) allBooks.value = res.data.books;
  } catch { /* ignore */ }
};

// 知识库管理
const constraintFileList = ref<any[]>([]);
const knowledgeFileList = ref<any[]>([]);
const pendingConstraintFile = ref<File | null>(null);
const pendingKnowledgeFile = ref<File | null>(null);
const existingKnowledge = ref<{ constraint?: string; constraintSize?: string; knowledge?: string; knowledgeSize?: string }>({});

const handleConstraintFileChange = (file: any) => {
  const raw = file.raw as File;
  if (raw) {
    pendingConstraintFile.value = raw;
    constraintFileList.value = [file];
  }
};

const handleKnowledgeFileChange = (file: any) => {
  const raw = file.raw as File;
  if (raw) {
    pendingKnowledgeFile.value = raw;
    knowledgeFileList.value = [file];
  }
};

// 检查已有知识库
const checkExistingKnowledge = async (famousId: number) => {
  try {
    const res = await api.get(`/famous/${famousId}/knowledge`);
    if (res.data.success && res.data.data?.files?.length > 0) {
      const files = res.data.data.files;
      const cFile = files.find((f: any) => f.name === '约束');
      const kFile = files.find((f: any) => f.name === '知识');
      existingKnowledge.value = {
        constraint: cFile?.path,
        constraintSize: cFile ? formatFileSize(cFile.size) : '',
        knowledge: kFile?.path,
        knowledgeSize: kFile ? formatFileSize(kFile.size) : ''
      };
    }
  } catch {
    existingKnowledge.value = {};
  }
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

// 图片集管理
const galleryList = ref<string[]>(['']);

const addGallerySlot = () => {
  if (galleryList.value.length < 8) {
    galleryList.value.push('');
  }
};

const removeGalleryImage = (i: number) => {
  galleryList.value.splice(i, 1);
  if (galleryList.value.length === 0) galleryList.value.push('');
};

const handleGallerySuccess = (response: any, i: number) => {
  if (response.success && response.url) {
    galleryList.value[i] = response.url;
    ElMessage.success('图片上传成功');
  }
};

// 同步 galleryList 到 famousForm.gallery
const syncGalleryToForm = () => {
  const urls = galleryList.value.filter(u => u.trim());
  famousForm.gallery = urls.length > 0 ? JSON.stringify(urls) : '';
};

// 截取MD格式文本用于表格预览
const truncateMd = (md: string, maxLen: number) => {
  if (!md) return '';
  const text = md.replace(/[#*`>\-\[\]()!]/g, '').replace(/\n/g, ' ');
  return text.length > maxLen ? text.slice(0, maxLen) + '...' : text;
};

const fetchFamousPeople = async (page = 1) => {
  loadingFamous.value = true;
  try {
    const res = await api.get('/famous', { params: { page, limit: 20 } });
    if (res.data.success) {
      famousPeople.value = res.data.data;
      famousTotal.value = res.data.pagination.total;
    }
  } catch (error) {
    console.error(error);
  } finally {
    loadingFamous.value = false;
  }
};

// 重置名人表单为初始值
const resetFamousForm = () => {
  famousForm.id = null;
  famousForm.name = '';
  famousForm.introduction = '';
  famousForm.life_story = '';
  famousForm.works = '';
  famousForm.theory = '';
  famousForm.influence = '';
  famousForm.evaluation = '';
  famousForm.published_books = [];
  famousForm.gallery = '';
  famousForm.photo = '';
  famousForm.status_idle = '';
  famousForm.status_listening = '';
  famousForm.status_thinking = '';
  famousForm.status_answered = '';
  galleryList.value = [''];
  // 重置知识库
  constraintFileList.value = [];
  knowledgeFileList.value = [];
  pendingConstraintFile.value = null;
  pendingKnowledgeFile.value = null;
  existingKnowledge.value = {};
};

// 用 API 返回的 detail 填充名人表单（逐字段赋值，避免 Object.assign 副作用）
const fillFamousForm = (detail: any) => {
  famousForm.id = detail.id;
  famousForm.name = detail.name || '';
  famousForm.introduction = detail.introduction || '';
  famousForm.life_story = detail.life_story || '';
  famousForm.works = detail.works || '';
  famousForm.theory = detail.theory || '';
  famousForm.influence = detail.influence || '';
  famousForm.evaluation = detail.evaluation || '';
  famousForm.photo = detail.photo || '';
  famousForm.status_idle = detail.status_idle || '';
  famousForm.status_listening = detail.status_listening || '';
  famousForm.status_thinking = detail.status_thinking || '';
  famousForm.status_answered = detail.status_answered || '';

  // 解析 published_books：JSON 字符串 → 数字数组
  if (detail.published_books) {
    try {
      const arr = JSON.parse(detail.published_books);
      famousForm.published_books = Array.isArray(arr) ? arr : [];
    } catch {
      famousForm.published_books = [];
    }
  } else {
    famousForm.published_books = [];
  }

  // 解析 gallery：JSON 字符串 → 字符串数组
  if (detail.gallery) {
    try {
      const urls = JSON.parse(detail.gallery);
      galleryList.value = Array.isArray(urls) && urls.length > 0 ? urls : [''];
      famousForm.gallery = detail.gallery;
    } catch {
      galleryList.value = [''];
      famousForm.gallery = '';
    }
  } else {
    galleryList.value = [''];
    famousForm.gallery = '';
  }
};

const openFamousDialog = async (row: any = null) => {
  isEditFamous.value = !!row;
  mdPreview.value = '';
  mdFileList.value = [];

  if (!row) {
    // 新建：先清空再打开对话框（新建设有任何异步数据）
    resetFamousForm();
    famousDialogKey.value++;
    famousDialogVisible.value = true;
  } else {
    // 编辑：先加载数据，再打开对话框，确保 MdEditor 挂载时已有正确初始值
    resetFamousForm();
    try {
      const res = await api.get(`/famous/${row.id}`);
      if (res.data.success) {
        fillFamousForm(res.data.data);
        // 检查已有知识库
        await checkExistingKnowledge(row.id);
        famousDialogKey.value++;       // 强制全新挂载
        famousDialogVisible.value = true; // 数据就绪后才打开
      } else {
        ElMessage.error('获取详情失败');
      }
    } catch (error) {
      console.error('获取名人详情失败:', error);
      ElMessage.error('获取详情失败');
    }
  }
};

// 名人照片上传回调
const handleFamousPhotoSuccess = (response: any) => {
  if (response.success && response.url) {
    famousForm.photo = response.url;
    ElMessage.success('人物照片上传成功');
  }
};

const handleFamousIdleSuccess = (response: any) => {
  if (response.success && response.url) {
    famousForm.status_idle = response.url;
    ElMessage.success('无动作照片上传成功');
  }
};

const handleFamousListeningSuccess = (response: any) => {
  if (response.success && response.url) {
    famousForm.status_listening = response.url;
    ElMessage.success('聆听照片上传成功');
  }
};

const handleFamousThinkingSuccess = (response: any) => {
  if (response.success && response.url) {
    famousForm.status_thinking = response.url;
    ElMessage.success('思考照片上传成功');
  }
};

const handleFamousAnsweredSuccess = (response: any) => {
  if (response.success && response.url) {
    famousForm.status_answered = response.url;
    ElMessage.success('思考出答案照片上传成功');
  }
};

const saveFamous = async () => {
  if (!famousForm.name.trim()) {
    ElMessage.warning('请输入姓名');
    return;
  }
  syncGalleryToForm();

  // 🔍 调试：打印即将发送的"更多内容"字段
  console.log('[saveFamous] 更多内容:', JSON.stringify({
    id: famousForm.id,
    theory_len: famousForm.theory?.length || 0,
    influence_len: famousForm.influence?.length || 0,
    evaluation_len: famousForm.evaluation?.length || 0,
    published_books: famousForm.published_books,
    gallery_len: famousForm.gallery?.length || 0,
  }));

  try {
    const payload = {
      name: famousForm.name,
      introduction: famousForm.introduction,
      life_story: famousForm.life_story,
      works: famousForm.works,
      theory: famousForm.theory,
      influence: famousForm.influence,
      evaluation: famousForm.evaluation,
      published_books: famousForm.published_books,
      gallery: famousForm.gallery,
      photo: famousForm.photo,
      status_idle: famousForm.status_idle,
      status_listening: famousForm.status_listening,
      status_thinking: famousForm.status_thinking,
      status_answered: famousForm.status_answered
    };
    if (isEditFamous.value && famousForm.id) {
      const res = await api.put(`/famous/${famousForm.id}`, payload);
      console.log('[saveFamous] update response:', res.data);
      ElMessage.success('更新成功');
      // 上传知识库文件
      await uploadKnowledgeFiles(famousForm.id!);
    } else {
      const res = await api.post('/famous', payload);
      console.log('[saveFamous] create response:', res.data);
      ElMessage.success('创建成功');
      // 上传知识库文件（新建时使用返回的ID）
      if (res.data.id) {
        await uploadKnowledgeFiles(res.data.id);
      }
    }
    famousDialogVisible.value = false;
    fetchFamousPeople();
  } catch (error: any) {
    console.error('保存名人失败:', error);
    const msg = error?.response?.data?.message || error?.message || '未知错误';
    ElMessage.error('保存失败：' + msg);
  }
};

// 上传知识库文件
const uploadKnowledgeFiles = async (famousId: number) => {
  if (!pendingConstraintFile.value && !pendingKnowledgeFile.value) return;

  const formData = new FormData();
  if (pendingConstraintFile.value) {
    formData.append('constraint', pendingConstraintFile.value);
  }
  if (pendingKnowledgeFile.value) {
    formData.append('knowledge', pendingKnowledgeFile.value);
  }

  try {
    await api.post(`/famous/${famousId}/knowledge`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    ElMessage.success('知识库上传成功');
    // 清除待上传状态
    constraintFileList.value = [];
    knowledgeFileList.value = [];
    pendingConstraintFile.value = null;
    pendingKnowledgeFile.value = null;
  } catch (error: any) {
    console.error('知识库上传失败:', error);
    ElMessage.warning('名人保存成功，但知识库上传失败');
  }
};

const handleDeleteFamous = async (id: number) => {
  try {
    await ElMessageBox.confirm('确定删除吗?', '提示', { type: 'warning' });
    await api.delete(`/famous/${id}`);
    ElMessage.success('删除成功');
    fetchFamousPeople();
  } catch (error) {
    if (error !== 'cancel') ElMessage.error('删除失败');
  }
};

const handleFamousPageChange = (page: number) => fetchFamousPeople(page);

onMounted(() => {
  fetchEffects();
  fetchBooks();
  fetchVideoSeries();
  fetchScales();
  fetchFamousPeople();
  fetchAllBooks();
  fetchAllFamous();
});
</script>

<style scoped>
.admin-tabs :deep(.el-tabs__header) {
  background: #f5f0e8;
  border-bottom: 4px solid #2d2d2d;
}

.admin-tabs :deep(.el-tabs__item) {
  color: #666;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border: 4px solid transparent;
  border-bottom: none;
}

.admin-tabs :deep(.el-tabs__item.is-active) {
  color: #2d2d2d;
  background: white;
  border: 4px solid #2d2d2d;
  border-bottom: none;
}

.admin-tabs :deep(.el-tabs__nav-wrap::after) {
  background-color: #2d2d2d;
  height: 4px;
}

.admin-tabs :deep(.el-table) {
  background: white;
  color: #2d2d2d;
  border: 4px solid #2d2d2d;
}

.admin-tabs :deep(.el-table th.el-table__cell) {
  background: #f5f0e8;
  color: #2d2d2d;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 4px solid #2d2d2d;
}

.admin-tabs :deep(.el-table__row:hover > td) {
  background: #faf8f5 !important;
}

.admin-tabs :deep(.el-button--primary) {
  --el-button-bg-color: #2d2d2d;
  --el-button-border-color: #2d2d2d;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.admin-tabs :deep(.el-button--danger) {
  --el-button-bg-color: #e74c3c;
  --el-button-border-color: #e74c3c;
  font-weight: 700;
}

.admin-tabs :deep(.el-dialog) {
  border: 4px solid #2d2d2d;
}

.admin-tabs :deep(.el-input__wrapper) {
  background: white;
  border: 2px solid #2d2d2d;
}

.admin-tabs :deep(.el-textarea__inner) {
  background: white;
  color: #2d2d2d;
  border: 2px solid #2d2d2d;
}
</style>
