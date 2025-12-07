import { getRatingLabel } from './prompts.js';
import * as store from './store.js';

// --- DOM Cache ---
const elements = {
  uploadArea: document.getElementById('upload-area'),
  previewContainer: document.getElementById('preview-container'),
  previewImage: document.getElementById('preview-image'),
  resultContainer: document.getElementById('result-container'),
  imagePreview: document.getElementById('image-preview'),
  loading: document.getElementById('loading'),
  result: document.getElementById('result'),
  verdict: document.getElementById('verdict'),
  verdictIcon: document.getElementById('verdict-icon'),
  explanation: document.getElementById('explanation'),
  resultActions: document.querySelector('.result-actions'),
  tryAgainBtn: document.getElementById('try-again'),
  imagePreviewContainerResult: document.getElementById('image-preview-container-result'),
};

// [FIX] 直接获取 HTML 中已经存在的 popup-overlay
let popupOverlay = document.getElementById('popup-overlay');

// 初始化弹窗逻辑（如果 HTML 里没写，这里作为后备创建；如果写了，就绑定事件）
function initPopup(){
  if (!popupOverlay) {
    // Fallback: 如果 HTML 里没有这个元素，我们才创建它
    popupOverlay = document.createElement('div');
    popupOverlay.id = 'popup-overlay';
    popupOverlay.innerHTML = `
      <div class="popup-card glass-component">
        <button class="close-popup">×</button>
        <img id="popup-image" src="" alt="预览图片">
        <h3 id="popup-verdict"></h3>
        <p id="popup-explanation"></p>
        <p id="popup-date" class="date"></p>
        <p id="popup-ai-type" class="ai-type"></p>
      </div>
    `;
    document.body.appendChild(popupOverlay);
  }
  
  // 绑定关闭事件 (兼容 HTML 中已有的 onclick)
  // 如果是动态创建的或者是 HTML 中没绑定的，这里统一绑定一次
  popupOverlay.addEventListener('click', e => { 
    if (e.target === popupOverlay) hidePopup(); 
  });
  
  const closeBtn = popupOverlay.querySelector('.close-popup');
  if (closeBtn) {
    closeBtn.addEventListener('click', hidePopup);
  }
}

// 执行初始化
initPopup();

// --- UI State ---
export function showPreview(imageDataUrl){
  elements.previewImage.src = imageDataUrl;
  elements.uploadArea.classList.add('hidden');
  elements.previewContainer.classList.remove('hidden');
  elements.resultContainer.classList.add('hidden');
}

export function showLoading(imageDataUrl){
  elements.imagePreview.src = imageDataUrl;
  elements.uploadArea.classList.add('hidden');
  elements.previewContainer.classList.add('hidden');
  elements.resultContainer.classList.remove('hidden');
  elements.loading.classList.remove('hidden');
  elements.result.classList.add('hidden');
  // Clear old action buttons
  const btns = elements.resultActions.querySelectorAll('.save-btn, .share-btn');
  btns.forEach(b => b.remove());
}

export function displayResult({ rating, verdict: vText, explanation: exp }){
  elements.loading.classList.add('hidden');
  elements.result.classList.remove('hidden');
  const isSmash = vText === 'SMASH';
  const isPass  = vText === 'PASS';
  elements.verdict.textContent = `${getRatingLabel(rating)} (${rating}/10)`;
  elements.verdictIcon.textContent = isSmash ? 'SMASH!!' : isPass ? 'PASS' : '...';
  elements.explanation.textContent = exp;

  elements.result.classList.remove('smash', 'pass');
  if (isSmash) {
    elements.result.classList.add('smash');
  } else if (isPass) {
    elements.result.classList.add('pass');
  }
}

export function displayError(msg){
  elements.loading.classList.add('hidden');
  elements.result.classList.remove('hidden');
  elements.verdict.textContent = '错误!';
  elements.verdictIcon.textContent = 'ERROR';
  elements.explanation.textContent = msg;
  elements.result.classList.remove('smash', 'pass');
}

export function resetToUpload(){
  elements.previewContainer.classList.add('hidden');
  elements.resultContainer.classList.add('hidden');
  elements.uploadArea.classList.remove('hidden');
  document.getElementById('file-input').value = '';
  const btns = elements.resultActions.querySelectorAll('.save-btn, .share-btn');
  btns.forEach(b => b.remove());
}

export function createSaveButton(onClick){
  const btn = document.createElement('button');
  btn.className = 'btn glass-button save-btn';
  btn.textContent = '💾 保存结果';
  btn.addEventListener('click', () => {
    onClick(); btn.textContent = '✓ 已保存'; btn.disabled = true;
  });
  elements.resultActions.appendChild(btn);
}

export function createShareButton(onClick){
  const btn = document.createElement('button');
  btn.className = 'btn glass-button share-btn';
  btn.textContent = '🔗 分享评分';
  btn.addEventListener('click', () => {
    onClick(); btn.textContent = '✓ 已复制!'; setTimeout(()=>{ btn.textContent='🔗 分享评分' }, 2000);
  });
  elements.resultActions.appendChild(btn);
}

export function createSavedResultsContainer(results, handlers){
  const container = document.createElement('div');
  container.className = 'saved-results';
  if (results.length === 0){
    container.innerHTML = `<h2>保存的结果</h2><p style="text-align:center;opacity:.8">暂无保存的结果</p>`;
  }else{
    // [FIX] 增加 style="cursor: pointer;" 让用户知道可以点击
    const grid = results.map((r,i)=>`
      <div class="saved-result-card" data-index="${i}" style="cursor: pointer;">
        <img src="${r.image}" alt="Saved result ${i+1}">
        <div class="saved-result-info">
          <p class="date">${new Date(r.timestamp).toLocaleDateString()}</p>
          <p class="ai-type">模式: ${r.aiType==='brief'?'简短':r.aiType==='descriptive'?'详细':'小说'}</p>
          <div class="saved-result-actions">
            <button class="delete-btn" data-index="${i}">🗑️ 删除</button>
          </div>
        </div>
      </div>
    `).join('');
    container.innerHTML = `<h2>保存的结果</h2><div class="saved-results-grid">${grid}</div>`;
    
    // 绑定删除事件
    container.querySelectorAll('.delete-btn').forEach(btn=>{
      btn.addEventListener('click', e => { 
        e.stopPropagation(); 
        handlers.onDelete(parseInt(e.target.dataset.index));
      });
    });

    // 绑定卡片点击事件 (打开弹窗)
    container.querySelectorAll('.saved-result-card').forEach(card=>{
      card.addEventListener('click', e => { 
        // [FIX] 更安全的检查：如果点击的是删除按钮内部（例如图标），也不触发弹窗
        if(e.target.closest('.delete-btn')) return; 
        
        handlers.onView(parseInt(card.dataset.index));
      });
    });
  }
  return container;
}

export function showPopup(result){
  // 现在 popupOverlay 一定有值了
  if (!popupOverlay) return; 

  // 填充数据 (注意 ID 要和 HTML 对应)
  const imgEl = document.getElementById('popup-image') || document.getElementById('popup-img'); // 兼容
  if(imgEl) imgEl.src = result.image;
  
  const verdictEl = document.getElementById('popup-verdict');
  if(verdictEl) verdictEl.textContent = `${getRatingLabel(result.rating)} (${result.rating}/10)`;
  
  const explanationEl = document.getElementById('popup-explanation');
  if(explanationEl) {
    explanationEl.textContent = result.explanation; 
    explanationEl.style.whiteSpace = 'pre-wrap';
  }

  const dateEl = document.getElementById('popup-date');
  if(dateEl) dateEl.textContent = new Date(result.timestamp).toLocaleString();

  const typeEl = document.getElementById('popup-ai-type');
  if(typeEl) typeEl.textContent = '模式: ' + (result.aiType==='brief'?'简短':result.aiType==='descriptive'?'详细':'小说');

  // 显示弹窗
  popupOverlay.classList.add('visible');
}

export function hidePopup(){ 
  if (popupOverlay) popupOverlay.classList.remove('visible');
}

/* ===== 图片压缩部分保持不变 ===== */
function dataUrlSizeBytes(dataUrl){
  const base64 = dataUrl.split(',')[1] || '';
  const padding = (base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0);
  return Math.floor(base64.length * 3 / 4) - padding;
}

function drawToJpegDataUrl(img, width, height, quality){
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL('image/jpeg', quality);
}

export async function ensureUnderMaxBytes(dataUrl, maxBytes = 10 * 1024 * 1024){
  if (dataUrlSizeBytes(dataUrl) <= maxBytes) return dataUrl;

  const img = new Image();
  await new Promise((res, rej) => { img.onload=res; img.onerror=rej; img.src=dataUrl; });

  let w = img.width, h = img.height;
  const bytes = dataUrlSizeBytes(dataUrl);
  const ratio = Math.min(1, Math.sqrt(maxBytes / bytes));
  w = Math.max(1, Math.round(w * ratio));
  h = Math.max(1, Math.round(h * ratio));
  let out = drawToJpegDataUrl(img, w, h, 0.9);

  const qualities = [0.9,0.85,0.8,0.75,0.7,0.65,0.6,0.55,0.5,0.45,0.4];
  let qIndex = 0;
  while (dataUrlSizeBytes(out) > maxBytes && qIndex < qualities.length){
    out = drawToJpegDataUrl(img, w, h, qualities[qIndex++]);
  }

  while (dataUrlSizeBytes(out) > maxBytes && (w > 512 || h > 512)){
    w = Math.round(w * 0.9); h = Math.round(h * 0.9);
    out = drawToJpegDataUrl(img, w, h, Math.max(0.4, qualities[Math.min(qIndex, qualities.length-1)]));
  }

  return out;
}

export function resizeImage(dataUrl, maxWidth=1024, maxHeight=1024){
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = ()=>{
      let w = img.width, h = img.height;
      if (w > h && w > maxWidth){ h = Math.round(h * maxWidth / w); w = maxWidth; }
      else if (h >= w && h > maxHeight){ w = Math.round(w * maxHeight / h); h = maxHeight; }
      resolve(drawToJpegDataUrl(img, w, h, 0.9));
    };
    img.onerror = (e)=>reject(new Error('Failed to load image for resizing.'));
    img.src = dataUrl;
  });
}
