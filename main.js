import * as store from './store.js';
import * as ui from './ui.js';
import { analyzeImage, testServiceAvailability } from './api.js';
import { getRatingLabel } from './prompts.js';
import { getSettings, updateSettings } from './settings.js';

document.addEventListener('DOMContentLoaded', () => {
  const el = {
    uploadArea: document.getElementById('upload-area'),
    fileInput: document.getElementById('file-input'),
    previewContainer: document.getElementById('preview-container'),
    startAnalysisBtn: document.getElementById('start-analysis-btn'),
    changeImageBtn: document.getElementById('change-image-btn'),
    tryAgainBtn: document.getElementById('try-again'),
    viewSavedBtn: document.getElementById('view-saved'),
    container: document.querySelector('.container'),
    resultContainer: document.getElementById('result-container'),
    imagePreviewContainerResult: document.getElementById('image-preview-container-result'),
    imagePreviewContainer: document.querySelector('.image-preview-container'),
    modelSelector: document.getElementById('model-selector'),
    
    statusBar: document.getElementById('status-bar'),
    statusText: document.getElementById('status-text'),
    statusPing: document.getElementById('status-ping'),
    
    // 高级设置元素
    advancedToggle: document.getElementById('advanced-toggle'),
    advancedContent: document.getElementById('advanced-content'),
    customApiKeyInput: document.getElementById('custom-api-key'),
  };

  let currentAnalysisResult = null;
  let isSavedResultsVisible = false;
  let selectedImageDataUrl = null;

  function initialize(){
    setupEventListeners();
    loadSettings();
    runAutoConnectivityTest();
  }

  function loadSettings(){
    const s = getSettings();
    el.modelSelector.value = s.selectedModel || 'gemini-2.5-flash';
    el.customApiKeyInput.value = s.customApiKey || ''; // 回填 Key
  }

  function handleModelChange() {
    updateSettings({ selectedModel: el.modelSelector.value });
  }

  // 处理 Key 变更：保存并重新测试
  function handleApiKeyChange() {
    const key = el.customApiKeyInput.value.trim();
    updateSettings({ customApiKey: key });
    
    // 重置状态为 Loading 并重新测试
    el.statusBar.className = 'status-bar loading';
    el.statusText.textContent = '配置更新，正在重新检测...';
    el.statusPing.textContent = '--ms';
    
    runAutoConnectivityTest();
  }

  async function runAutoConnectivityTest() {
    const startTime = Date.now();
    const result = await testServiceAvailability();
    const pingTime = Date.now() - startTime;

    el.statusBar.classList.remove('loading');

    if (result.success) {
        el.statusBar.classList.add('success');
        el.statusBar.classList.remove('error');
        el.statusText.textContent = '云端服务正常 (Ready)';
        el.statusPing.textContent = `${pingTime}ms`;
    } else {
        el.statusBar.classList.add('error');
        el.statusBar.classList.remove('success');
        el.statusPing.textContent = 'ERR';
        
        if (result.message.includes('Quota') || result.message.includes('额度')) {
             el.statusText.textContent = '额度耗尽 (Quota Exceeded)';
        } else if (result.message.includes('未配置') && !el.customApiKeyInput.value) {
             el.statusText.textContent = '未配置 API Key';
        } else {
             el.statusText.textContent = '连接异常: ' + result.message;
        }
    }
  }

  // --- Upload & Analysis Logic ---
  async function handleFileSelect(){
    if (!el.fileInput.files.length) return;
    const file = el.fileInput.files[0];
    if (file.type === 'image/heic' || file.name.toLowerCase().endsWith('.heic')) {
      try {
        const blob = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.9 });
        const convertedFile = new File([blob], file.name.replace(/\.heic$/i, ".jpg"), { type: "image/jpeg" });
        return processFile(convertedFile);
      } catch (err) {
        alert("HEIC 转换失败"); return;
      }
    }
    if (!file.type.startsWith('image/')) { alert('请选择图片文件'); return; }
    processFile(file);
  }

  function processFile(file){
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const processed = await ui.ensureUnderMaxBytes(e.target.result, 10 * 1024 * 1024);
        selectedImageDataUrl = processed;
        ui.showPreview(selectedImageDataUrl);
      } catch (err) { alert('无法加载图片'); }
    };
    reader.readAsDataURL(file);
  }

  async function handleStartAnalysis(){
    if (!selectedImageDataUrl) return;
    ui.showLoading(selectedImageDataUrl);
    try{
      const aiType = document.querySelector('input[name="ai-type"]:checked').value;
      const modelName = el.modelSelector.value;
      const response = await analyzeImage(selectedImageDataUrl, aiType, modelName);
      currentAnalysisResult = { ...response, image:selectedImageDataUrl, aiType, model:modelName };
      setTimeout(()=>{
        ui.displayResult(currentAnalysisResult);
        ui.createSaveButton(handleSaveResult);
        ui.createShareButton(handleShareResult);
      }, 300);
    }catch(error){
      ui.displayError(`分析失败: ${error.message}`);
    }
  }

  function handleSaveResult(){
    if (!currentAnalysisResult) return;
    store.addSavedResult({ ...currentAnalysisResult, timestamp:new Date().toISOString() });
    if (isSavedResultsVisible) renderSaved();
  }
  function handleShareResult(){
    if (!currentAnalysisResult) return;
    const txt = `我的图片AI评分结果:\n\nVerdict: ${currentAnalysisResult.verdict}\nRating: ${currentAnalysisResult.rating}/10\nExplanation: "${currentAnalysisResult.explanation}"`;
    navigator.clipboard.writeText(txt).then(()=> alert('已复制 ✅'));
  }
  function handleDeleteResult(index){ store.deleteSavedResult(index); renderSaved(); }
  function handleViewSavedResult(index){ ui.showPopup(store.getSavedResults()[index]); }
  async function handleTryAgain(){ if (selectedImageDataUrl) await handleStartAnalysis(); else ui.resetToUpload(); }
  function handleChangeImage(){ el.fileInput.removeAttribute('hidden'); el.fileInput.click(); }
  function toggleSavedResults(){
    if (document.querySelector('.saved-results')) { document.querySelector('.saved-results').remove(); el.viewSavedBtn.textContent = '📁 查看保存的结果'; isSavedResultsVisible = false; }
    else { renderSaved(); el.viewSavedBtn.textContent = '📁 隐藏保存的结果'; isSavedResultsVisible = true; }
  }
  function renderSaved(){
    const container = ui.createSavedResultsContainer(store.getSavedResults(), { onDelete: handleDeleteResult, onView: handleViewSavedResult });
    if(document.querySelector('.saved-results')) document.querySelector('.saved-results').remove();
    el.container.appendChild(container);
  }

  function setupEventListeners(){
    const zones = [el.uploadArea, el.imagePreviewContainer, el.imagePreviewContainerResult];
    zones.forEach(zone=>{
      if(!zone)return;
      zone.addEventListener('click', ()=>el.fileInput.click());
      zone.addEventListener('dragover', e=>{e.preventDefault();zone.classList.add('drag-over')});
      zone.addEventListener('dragleave', e=>{e.preventDefault();zone.classList.remove('drag-over')});
      zone.addEventListener('drop', e=>{e.preventDefault();zone.classList.remove('drag-over');if(e.dataTransfer.files.length){el.fileInput.files=e.dataTransfer.files;handleFileSelect()}});
    });

    el.fileInput.addEventListener('change', handleFileSelect);
    el.startAnalysisBtn.addEventListener('click', handleStartAnalysis);
    el.changeImageBtn.addEventListener('click', handleChangeImage);
    el.tryAgainBtn.addEventListener('click', handleTryAgain);
    el.viewSavedBtn.addEventListener('click', toggleSavedResults);
    
    el.modelSelector.addEventListener('change', handleModelChange);
    
    // 高级设置事件
    el.advancedToggle.addEventListener('click', () => {
        el.advancedContent.classList.toggle('hidden');
        el.advancedToggle.classList.toggle('active');
    });
    el.customApiKeyInput.addEventListener('change', handleApiKeyChange);
    el.customApiKeyInput.addEventListener('blur', handleApiKeyChange);
  }

  initialize();
});