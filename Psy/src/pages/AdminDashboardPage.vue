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
  const isLt5M = file.size / 1024 / 1024 < 5;
  if (!isLt5M) {
    ElMessage.error('图片大小不能超过 5MB！');
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
  (effectForm as any)[activeMdField.value] = mdPreview.value;
  ElMessage.success(`已导入到${activeMdField.value === 'description' ? '简介' : activeMdField.value === 'experiment_content' ? '实验内容' : '深度解析'}字段`);
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
  } catch (error) {
    ElMessage.error('保存失败');
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
  id: null, title: '', author: '', isbn: '', publisher: '', publish_date: '', cover_image: '', ebook_url: '', summary_intro: ''
});

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
    Object.assign(bookForm, { id: null, title: '', author: '', isbn: '', publisher: '', publish_date: '', cover_image: '', ebook_url: '', summary_intro: '' });
  }
};

const saveBook = async () => {
  try {
    const payload = {
      title: bookForm.title, author: bookForm.author, isbn: bookForm.isbn, publisher: bookForm.publisher,
      publish_date: bookForm.publish_date, cover_image: bookForm.cover_image, ebook_url: bookForm.ebook_url,
      summary: { intro: bookForm.summary_intro }
    };
    if (isEditBook.value && bookForm.id) {
      await api.put(`/books/${bookForm.id}`, payload);
      ElMessage.success('更新成功');
    } else {
      await api.post('/books', payload);
      ElMessage.success('创建成功');
    }
    bookDialogVisible.value = false;
    fetchBooks();
  } catch (error) {
    ElMessage.error('保存失败');
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
  } catch (error) {
    ElMessage.error('保存失败');
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
  } catch (error) {
    ElMessage.error('保存失败');
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
  } catch (error) {
    ElMessage.error('保存失败');
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
  } catch (error) {
    ElMessage.error('保存失败');
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

onMounted(() => {
  fetchEffects();
  fetchBooks();
  fetchVideoSeries();
  fetchScales();
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
