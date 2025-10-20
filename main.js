import * as store from './store.js';
import * as ui from './ui.js';
import { analyzeImage } from './api.js';
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
    googleApiKeyInput: document.getElementById('google-api-key'),
    modelSelector: document.getElementById('model-selector'),
    saveSettingsBtn: document.getElementById('save-settings'),
  };

  let currentAnalysisResult = null;
  let isSavedResultsVisible = false;
  let selectedImageDataUrl = null;

  function initialize(){
    setupEventListeners();
    loadSettings();
  }

  // Settings
  function loadSettings(){
    const s = getSettings();
    el.googleApiKeyInput.value = s.googleApiKey || '';
    el.modelSelector.value = s.selectedModel || 'gemini-2.5-flash';
  }
  function saveSettings(){
    const key = el.googleApiKeyInput.value.trim();
    const model = el.modelSelector.value;
    if (!key){ alert('请输入 Google API Key'); return; }
    updateSettings({ googleApiKey:key, selectedModel:model });
    el.saveSettingsBtn.textContent = '✅ 已保存';
    setTimeout(()=> el.saveSettingsBtn.textContent='💾 保存设置', 2000);
  }

  // Upload
  function handleFileSelect(){
    if (!el.fileInput.files.length) return;
    const file = el.fileInput.files[0];
    if (!file.type.startsWith('image/')){ alert('请选择图片文件'); return; }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try{
        // ✅ 仅当 >10MB 时压缩到 10MB 以内
        const dataUrl = e.target.result;
        const processed = await ui.ensureUnderMaxBytes(dataUrl, 10 * 1024 * 1024);
        selectedImageDataUrl = processed;
        ui.showPreview(selectedImageDataUrl);
      }catch(err){
        console.error('图片处理失败:', err);
        alert('无法加载图片，请尝试其他文件。');
      }
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
      console.error('分析图片时出错:', error);
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
    const { rating, verdict, explanation } = currentAnalysisResult;
    const label = getRatingLabel(rating);
    const txt = `我的图片AI评分结果:\n\nVerdict: ${verdict}\nRating: ${label} (${rating}/10)\nExplanation: "${explanation}"\n\n你也来试试吧！`;
    navigator.clipboard.writeText(txt)
      .then(()=> alert('结果已复制到剪贴板 ✅'))
      .catch(err=> alert('复制失败: '+err.message));
  }

  function handleDeleteResult(index){
    store.deleteSavedResult(index);
    renderSaved();
  }

  function handleViewSavedResult(index){
    const result = store.getSavedResults()[index];
    ui.showPopup(result);
  }

  async function handleTryAgain(){
    if (selectedImageDataUrl) await handleStartAnalysis();
    else ui.resetToUpload();
  }

  function handleChangeImage(){
    el.fileInput.removeAttribute('hidden');
    el.fileInput.click();
  }

  function toggleSavedResults(){
    const exist = document.querySelector('.saved-results');
    if (exist){
      exist.remove();
      el.viewSavedBtn.textContent = '📁 查看保存的结果';
      isSavedResultsVisible = false;
    }else{
      renderSaved();
      el.viewSavedBtn.textContent = '📁 隐藏保存的结果';
      isSavedResultsVisible = true;
    }
  }

  function renderSaved(){
    const results = store.getSavedResults();
    const container = ui.createSavedResultsContainer(results, {
      onDelete: handleDeleteResult,
      onView: handleViewSavedResult,
    });
    const exist = document.querySelector('.saved-results');
    if (exist) exist.remove();
    el.container.appendChild(container);
  }

  // Events
  function setupEventListeners(){
    const zones = [el.uploadArea, el.imagePreviewContainer, el.imagePreviewContainerResult];
    zones.forEach(zone=>{
      if (!zone) return;
      zone.addEventListener('click', ()=>{
        el.fileInput.removeAttribute('hidden');
        el.fileInput.click();
      });
      zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over') });
      zone.addEventListener('dragleave', e => { e.preventDefault(); zone.classList.remove('drag-over') });
      zone.addEventListener('drop', e => {
        e.preventDefault(); zone.classList.remove('drag-over');
        if (e.dataTransfer.files.length){
          el.fileInput.files = e.dataTransfer.files;
          handleFileSelect();
        }
      });
    });

    el.fileInput.addEventListener('change', handleFileSelect);
    el.startAnalysisBtn.addEventListener('click', handleStartAnalysis);
    el.changeImageBtn.addEventListener('click', handleChangeImage);
    el.tryAgainBtn.addEventListener('click', handleTryAgain);
    el.viewSavedBtn.addEventListener('click', toggleSavedResults);
    el.saveSettingsBtn.addEventListener('click', saveSettings);
  }

  initialize();
});
