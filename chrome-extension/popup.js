// 模拟收藏的提示词数据
const favoritePrompts = [
  {
    id: 1,
    title: '代码优化助手',
    description: '帮助你分析代码并提供优化建议，提高代码质量和性能。',
    content: '你是一个专业的代码审查专家，请帮我分析这段代码的问题并给出优化建议...',
    category: '编程',
    tags: ['代码审查', '性能优化', 'JavaScript'],
    stars: 234,
    views: 1250
  },
  {
    id: 3,
    title: '英语学习教练',
    description: '个性化英语学习指导，提升口语、写作和阅读能力。',
    content: '你是一位专业的英语教学专家，请根据学生的水平制定个性化学习计划...',
    category: '教育',
    tags: ['英语学习', '教育', '语言'],
    stars: 312,
    views: 1680
  },
  {
    id: 5,
    title: 'UI设计顾问',
    description: '提供专业的界面设计建议，改善用户体验和视觉效果。',
    content: '作为一位资深的UI/UX设计师，请为我的应用界面提供设计建议...',
    category: '设计',
    tags: ['UI设计', '用户体验', 'Figma'],
    stars: 278,
    views: 1156
  },
  {
    id: 7,
    title: '产品文档助手',
    description: '帮助撰写清晰、专业的产品文档和用户手册。',
    content: '作为一名专业的技术文档编写专家，请帮我创建一份...',
    category: '文档',
    tags: ['技术文档', '产品', '用户手册'],
    stars: 45,
    views: 234
  },
  {
    id: 8,
    title: '会议纪要生成器',
    description: '将会议录音或原始记录整理成结构化的会议纪要。',
    content: '请帮我将这段会议记录整理成专业的会议纪要格式...',
    category: '办公',
    tags: ['会议', '文档', '效率'],
    stars: 67,
    views: 289
  }
];

// DOM 元素
const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearch');
const promptsList = document.getElementById('promptsList');
const emptyState = document.getElementById('emptyState');
const noResults = document.getElementById('noResults');
const openWebsiteBtn = document.getElementById('openWebsite');
const refreshDataBtn = document.getElementById('refreshData');
const testCopyBtn = document.getElementById('testCopy');

// 当前显示的提示词列表
let currentPrompts = [...favoritePrompts];

// 初始化
document.addEventListener('DOMContentLoaded', function() {
  loadFavoritePrompts();
  bindEvents();
});

// 绑定事件
function bindEvents() {
  // 搜索功能
  searchInput.addEventListener('input', handleSearch);
  searchInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  });

  // 清空搜索
  clearSearchBtn.addEventListener('click', clearSearch);

  // 打开网站
  openWebsiteBtn.addEventListener('click', function() {
    chrome.tabs.create({ url: 'http://localhost:5174/' });
  });

  // 刷新数据
  refreshDataBtn.addEventListener('click', function() {
    refreshFavoritePrompts();
  });
}

// 加载收藏的提示词
function loadFavoritePrompts() {
  try {
    // 从Chrome存储中获取数据（如果有的话）
    chrome.storage.sync.get(['favoritePrompts'], function(result) {
      if (result.favoritePrompts && result.favoritePrompts.length > 0) {
        currentPrompts = result.favoritePrompts;
      } else {
        // 使用模拟数据
        currentPrompts = [...favoritePrompts];
        // 保存到存储中
        chrome.storage.sync.set({ favoritePrompts: currentPrompts });
      }
      renderPrompts(currentPrompts);
    });
  } catch (error) {
    // 如果Chrome API不可用（比如在开发环境中），使用模拟数据
    currentPrompts = [...favoritePrompts];
    renderPrompts(currentPrompts);
  }
}

// 渲染提示词列表
function renderPrompts(prompts) {
  if (!prompts || prompts.length === 0) {
    showEmptyState();
    return;
  }

  promptsList.innerHTML = '';
  emptyState.style.display = 'none';
  noResults.style.display = 'none';

  prompts.forEach(prompt => {
    const card = createPromptCard(prompt);
    promptsList.appendChild(card);
  });
}

// 创建提示词卡片
function createPromptCard(prompt) {
  const card = document.createElement('div');
  card.className = 'prompt-card';
  card.dataset.promptId = prompt.id;

  card.innerHTML = `
    <div class="prompt-header">
      <div class="prompt-title">${prompt.title}</div>
      <div class="prompt-category">${prompt.category}</div>
    </div>
    <div class="prompt-description">${prompt.description}</div>
    <div class="prompt-tags">
      ${prompt.tags.map(tag => `<span class="prompt-tag">${tag}</span>`).join('')}
    </div>
    <div class="prompt-stats">
      <div class="stats-left">
        <div class="stat-item">
          <svg viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
          <span>${prompt.stars}</span>
        </div>
        <div class="stat-item">
          <svg viewBox="0 0 24 24">
            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
          </svg>
          <span>${prompt.views}</span>
        </div>
      </div>
      <button class="copy-btn" data-prompt-id="${prompt.id}">
        <svg viewBox="0 0 24 24">
          <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
        </svg>
        复制
      </button>
    </div>
  `;

  // 添加点击复制功能
  card.addEventListener('click', function(e) {
    e.stopPropagation();
    copyPrompt(prompt.id);
  });

  // 为复制按钮添加单独的事件监听
  const copyBtn = card.querySelector('.copy-btn');
  copyBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    copyPrompt(prompt.id);
  });

  return card;
}

// 复制提示词内容
function copyPrompt(promptId) {
  console.log('开始复制，promptId:', promptId);
  
  const prompt = currentPrompts.find(p => p.id == promptId);
  if (!prompt) {
    console.error('未找到提示词:', promptId);
    return;
  }

  console.log('找到提示词:', prompt.title);
  const card = document.querySelector(`[data-prompt-id="${promptId}"]`);
  const copyBtn = card.querySelector('.copy-btn');
  
  // 立即显示复制状态
  card.classList.add('copying');
  copyBtn.classList.add('copied');
  copyBtn.innerHTML = `
    <svg viewBox="0 0 24 24">
      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
    </svg>
    复制中...
  `;
  
  // 尝试多种复制方法
  copyTextToClipboard(prompt.content)
    .then(() => {
      console.log('复制成功');
      copyBtn.innerHTML = `
        <svg viewBox="0 0 24 24">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
        </svg>
        已复制
      `;
      showCopyFeedback(card, '复制成功！');
    })
    .catch((err) => {
      console.error('复制失败:', err);
      copyBtn.innerHTML = `
        <svg viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
        </svg>
        失败
      `;
      showCopyFeedback(card, '复制失败，请重试');
    })
    .finally(() => {
      // 恢复按钮状态
      setTimeout(() => {
        card.classList.remove('copying');
        copyBtn.classList.remove('copied');
        copyBtn.innerHTML = `
          <svg viewBox="0 0 24 24">
            <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
          </svg>
          复制
        `;
      }, 2000);
    });
}

// 复制到剪贴板的主函数
async function copyTextToClipboard(text) {
  console.log('准备复制文本:', text.substring(0, 50) + '...');
  
  // 方法1: 现代 Clipboard API
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      console.log('使用 Clipboard API 复制成功');
      return;
    } catch (err) {
      console.log('Clipboard API 失败，尝试其他方法:', err);
    }
  }
  
  // 方法2: Chrome Extension API
  if (chrome && chrome.extension) {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      console.log('使用 execCommand 复制成功');
      return;
    } catch (err) {
      console.log('execCommand 失败:', err);
    }
  }
  
  // 方法3: 创建临时文本区域
  try {
    await fallbackCopyMethod(text);
    console.log('使用 fallback 方法复制成功');
  } catch (err) {
    console.error('所有复制方法都失败了:', err);
    throw err;
  }
}

// 显示复制反馈
function showCopyFeedback(card, message = '已复制到剪贴板') {
  // 移除旧的反馈
  const oldFeedback = card.querySelector('.copy-feedback');
  if (oldFeedback) {
    oldFeedback.remove();
  }
  
  const feedback = document.createElement('div');
  feedback.className = 'copy-feedback';
  feedback.textContent = message;
  
  card.style.position = 'relative';
  card.appendChild(feedback);
  
  setTimeout(() => {
    if (feedback.parentNode) {
      feedback.parentNode.removeChild(feedback);
    }
  }, 1000);
}

// Fallback 复制方法
function fallbackCopyMethod(text) {
  return new Promise((resolve, reject) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    
    // 设置样式使其不可见
    textArea.style.position = "fixed";
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.width = "2em";
    textArea.style.height = "2em";
    textArea.style.padding = "0";
    textArea.style.border = "none";
    textArea.style.outline = "none";
    textArea.style.boxShadow = "none";
    textArea.style.background = "transparent";
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        resolve();
      } else {
        reject(new Error('execCommand 返回 false'));
      }
    } catch (err) {
      document.body.removeChild(textArea);
      reject(err);
    }
  });
}

// 搜索功能
function handleSearch(e) {
  const keyword = e.target.value.toLowerCase().trim();
  
  // 显示/隐藏清空按钮
  clearSearchBtn.style.display = keyword ? 'flex' : 'none';
  
  if (!keyword) {
    // 显示所有收藏的提示词
    renderPrompts(favoritePrompts);
    return;
  }
  
  // 过滤提示词
  const filtered = favoritePrompts.filter(prompt => {
    return prompt.title.toLowerCase().includes(keyword) ||
           prompt.description.toLowerCase().includes(keyword) ||
           prompt.category.toLowerCase().includes(keyword) ||
           prompt.tags.some(tag => tag.toLowerCase().includes(keyword));
  });
  
  if (filtered.length === 0) {
    showNoResults();
  } else {
    renderPrompts(filtered);
  }
}

// 清空搜索
function clearSearch() {
  searchInput.value = '';
  clearSearchBtn.style.display = 'none';
  renderPrompts(favoritePrompts);
  searchInput.focus();
}

// 显示空状态
function showEmptyState() {
  promptsList.innerHTML = '';
  emptyState.style.display = 'flex';
  noResults.style.display = 'none';
}

// 显示无搜索结果
function showNoResults() {
  promptsList.innerHTML = '';
  emptyState.style.display = 'none';
  noResults.style.display = 'flex';
}

// 刷新收藏的提示词数据
function refreshFavoritePrompts() {
  const btn = refreshDataBtn;
  const originalText = btn.innerHTML;
  
  // 显示加载状态
  btn.innerHTML = `
    <svg viewBox="0 0 24 24" style="animation: spin 1s linear infinite;">
      <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
    </svg>
    刷新中...
  `;
  btn.disabled = true;
  
  // 模拟刷新
  setTimeout(() => {
    loadFavoritePrompts();
    btn.innerHTML = originalText;
    btn.disabled = false;
    
    // 清空搜索
    if (searchInput.value) {
      clearSearch();
    }
  }, 1000);
}

// 添加旋转动画的CSS
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);

// 显示测试反馈
function showTestFeedback(message, type) {
  const feedback = document.createElement('div');
  feedback.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: ${type === 'success' ? '#f0fdf4' : '#fef2f2'};
    color: ${type === 'success' ? '#15803d' : '#dc2626'};
    border: 1px solid ${type === 'success' ? '#bbf7d0' : '#fecaca'};
    border-radius: 8px;
    padding: 12px 16px;
    max-width: 280px;
    text-align: center;
    font-size: 12px;
    z-index: 10000;
    animation: fadeInOut 4s ease-in-out;
  `;
  feedback.textContent = message;
  
  document.body.appendChild(feedback);
  
  setTimeout(() => {
    if (feedback.parentNode) {
      feedback.parentNode.removeChild(feedback);
    }
  }, 4000);
}

// 确保函数在全局作用域可用
window.copyPrompt = copyPrompt;
window.testCopyFunction = testCopyFunction;

// 添加调试信息
console.log('Popup script loaded');
console.log('copyPrompt function available:', typeof window.copyPrompt);
console.log('Chrome APIs available:', {
  clipboard: !!navigator.clipboard,
  isSecureContext: window.isSecureContext,
  chrome: !!chrome,
  extension: !!(chrome && chrome.extension)
});

// 添加CSS动画
const additionalStyle = document.createElement('style');
additionalStyle.textContent = `
  @keyframes fadeInOut {
    0% { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
    20% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
    80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
    100% { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
  }
`;
document.head.appendChild(additionalStyle);