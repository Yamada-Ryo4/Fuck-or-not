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

let popupOverlay = null;

// --- Popup (kept) ---
function createPopup(){
  if (document.getElementById('popup-overlay')) return;
  popupOverlay = document.createElement('div');
  popupOverlay.id = 'popup-overlay';
  popupOverlay.innerHTML = `
    <div class="popup-card">
      <button class="close-popup">×</button>
      <img id="popup-img" src="" alt="预览图片">
      <h3 id="popup-verdict"></h3>
      <p id="popup-explanation"></p>
    </div>
  `;
  popupOverlay.style.display = '';
  document.body.appendChild(popupOverlay);
  popupOverlay.addEventListener('click', e => { if (e.target === popupOverlay) hidePopup() });
  popupOverlay.querySelector('.close-popup').addEventListener('click', hidePopup);
}
createPopup();

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

/**
 * ✅ [已修复]
 * 使用 classList.add/remove 来修改类，
 * 避免 elements.result.className 覆盖掉 'glass-component' 等基础类
 */
export function displayResult({ rating, verdict: vText, explanation: exp }){
  elements.loading.classList.add('hidden');
  elements.result.classList.remove('hidden');
  const isSmash = vText === 'SMASH';
  const isPass  = vText === 'PASS';
  elements.verdict.textContent = `${getRatingLabel(rating)} (${rating}/10)`;
  elements.verdictIcon.textContent = isSmash ? 'SMASH!!' : isPass ? 'PASS' : '...';
  elements.explanation.textContent = exp;

  // --- 修复BUG ---
  // 使用 classList.remove 和 classList.add 代替 className 覆盖
  elements.result.classList.remove('smash', 'pass'); // 先移除旧的状态
  if (isSmash) {
    elements.result.classList.add('smash');
  } else if (isPass) {
    elements.result.classList.add('pass');
  }
  // 这样 'result', 'glass-component', 'nested-glass' 类就会被保留
  // --- 修复结束 ---
}

/**
 * ✅ [已修复]
 * 使用 classList.remove 来修改类，
 * 避免 elements.result.className 覆盖掉 'glass-component' 等基础类
 */
export function displayError(msg){
  elements.loading.classList.add('hidden');
  elements.result.classList.remove('hidden');
  elements.verdict.textContent = '错误!';
  elements.verdictIcon.textContent = 'ERROR';
  elements.explanation.textContent = msg;
  
  // --- 修复BUG ---
  // 确保 'smash' 或 'pass' 类被移除，但保留基础类
  elements.result.classList.remove('smash', 'pass');
  // --- 修复结束 ---
}

export function resetToUpload(){
  elements.previewContainer.classList.add('hidden');
  elements.resultContainer.classList.add('hidden');
  elements.uploadArea.classList.remove('hidden');
  document.getElementById('file-input').value = '';
  const btns = elements.resultActions.querySelectorAll('.save-btn, .share-btn');
  btns.forEach(b => b.remove());
}

/**
 * ✅ [已修复]
 * 添加了 'glass-button' 类，使其具有玻璃效果
 */
export function createSaveButton(onClick){
  const btn = document.createElement('button');
  btn.className = 'btn glass-button save-btn'; // <--- 已添加 'glass-button'
  btn.textContent = '💾 保存结果';
  btn.addEventListener('click', () => {
    onClick(); btn.textContent = '✓ 已保存'; btn.disabled = true;
  });
  elements.resultActions.appendChild(btn);
}

/**
 * ✅ [已修复]
 * 添加了 'glass-button' 类，使其具有玻璃效果
 */
export function createShareButton(onClick){
  const btn = document.createElement('button');
  btn.className = 'btn glass-button share-btn'; // <--- 已添加 'glass-button'
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
    const grid = results.map((r,i)=>`
      <div class="saved-result-card" data-index="${i}">
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
    container.querySelectorAll('.delete-btn').forEach(btn=>{
      btn.addEventListener('click', e => { e.stopPropagation(); handlers.onDelete(parseInt(e.target.dataset.index)) });
    });
    container.querySelectorAll('.saved-result-card').forEach(card=>{
      card.addEventListener('click', e => { if(e.target.classList.contains('delete-btn')) return; handlers.onView(parseInt(card.dataset.index)) });
    });
  }
  return container;
}

export function showPopup(result){
  if (!popupOverlay) return;
  document.getElementById('popup-img').src = result.image;
  document.getElementById('popup-verdict').textContent = `${getRatingLabel(result.rating)} (${result.rating}/10)`;
  const p = document.getElementById('popup-explanation');
  p.textContent = result.explanation; p.style.whiteSpace = 'pre-wrap';
  popupOverlay.classList.add('visible');
}
export function hidePopup(){ if (popupOverlay) popupOverlay.classList.remove('visible') }

/* ===== 图片压缩：仅当 >10MB 时压到 10MB 内 ===== */

/** 从 dataURL 得到字节大小 */
function dataUrlSizeBytes(dataUrl){
  const base64 = dataUrl.split(',')[1] || '';
  // 4/3 * n - padding
  const padding = (base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0);
  return Math.floor(base64.length * 3 / 4) - padding;
}

/** 以给定质量导出 JPEG dataURL */
function drawToJpegDataUrl(img, width, height, quality){
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL('image/jpeg', quality);
}

/**
 * 保证图片 <= maxBytes（默认 10MB）。策略：
 * 1) 先按面积比例缩放（开平方）逼近大小目标；
 * 2) 若仍超标，逐步降低 JPEG 质量（0.9 -> 0.8 -> ... -> 0.5）；
 * 3) 若还超标，再次小幅缩放并尝试更低质量直到达标或质量到 0.4。
 */
export async function ensureUnderMaxBytes(dataUrl, maxBytes = 10 * 1024 * 1024){
  if (dataUrlSizeBytes(dataUrl) <= maxBytes) return dataUrl;

  const img = new Image();
  await new Promise((res, rej) => { img.onload=res; img.onerror=rej; img.src=dataUrl; });

  let w = img.width, h = img.height;
  // 先按面积比缩放到大致目标
  const bytes = dataUrlSizeBytes(dataUrl);
  const ratio = Math.min(1, Math.sqrt(maxBytes / bytes));
  w = Math.max(1, Math.round(w * ratio));
  h = Math.max(1, Math.round(h * ratio));
  let out = drawToJpegDataUrl(img, w, h, 0.9);

  // 质量阶梯
  const qualities = [0.9,0.85,0.8,0.75,0.7,0.65,0.6,0.55,0.5,0.45,0.4];
  let qIndex = 0;
  while (dataUrlSizeBytes(out) > maxBytes && qIndex < qualities.length){
    out = drawToJpegDataUrl(img, w, h, qualities[qIndex++]);
  }

  // 如仍超标，再做一次微缩
  while (dataUrlSizeBytes(out) > maxBytes && (w > 512 || h > 512)){
    w = Math.round(w * 0.9); h = Math.round(h * 0.9);
    out = drawToJpegDataUrl(img, w, h, Math.max(0.4, qualities[Math.min(qIndex, qualities.length-1)]));
  }

  return out;
}

/* 兼容旧接口：仅按边长限制（保留以防其他地方引用） */
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