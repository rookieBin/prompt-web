// Content Script
// 在网页中注入的脚本，可以与页面内容交互

console.log('PromptHub Assistant content script loaded');

// 检测是否在PromptHub网站
const isPromptHubSite = window.location.href.includes('localhost:5174') || 
                       window.location.href.includes('prompthub');

if (isPromptHubSite) {
  console.log('检测到PromptHub网站，启用同步功能');
  initializeWebsiteIntegration();
}

// 初始化网站集成功能
function initializeWebsiteIntegration() {
  // 监听页面上的提示词操作
  document.addEventListener('click', function(event) {
    const target = event.target;
    
    // 检测收藏按钮点击
    if (target.closest('.copy-btn') || 
        target.closest('[class*="star"]') || 
        target.closest('[class*="favorite"]')) {
      handleFavoriteAction(event);
    }
  });
  
  // 添加快捷键支持
  document.addEventListener('keydown', function(event) {
    // Ctrl+Shift+P 打开插件
    if (event.ctrlKey && event.shiftKey && event.key === 'P') {
      event.preventDefault();
      openExtensionPopup();
    }
  });
}

// 处理收藏操作
function handleFavoriteAction(event) {
  // 尝试从页面元素中提取提示词信息
  const promptCard = event.target.closest('.prompt-card') || 
                    event.target.closest('[class*="card"]');
  
  if (promptCard) {
    const promptData = extractPromptData(promptCard);
    if (promptData) {
      syncPromptToExtension(promptData);
    }
  }
}

// 从页面元素提取提示词数据
function extractPromptData(element) {
  try {
    const title = element.querySelector('[class*="title"]')?.textContent?.trim();
    const description = element.querySelector('[class*="description"]')?.textContent?.trim();
    const category = element.querySelector('[class*="category"]')?.textContent?.trim();
    
    if (!title) return null;
    
    return {
      id: Date.now(), // 使用时间戳作为临时ID
      title,
      description: description || '',
      category: category || '其他',
      content: `来自PromptHub的提示词: ${title}\n\n${description || ''}`,
      tags: extractTags(element),
      stars: extractNumber(element, 'star') || 0,
      views: extractNumber(element, 'view') || 0,
      source: 'website',
      addedAt: Date.now()
    };
  } catch (error) {
    console.error('提取提示词数据失败:', error);
    return null;
  }
}

// 提取标签
function extractTags(element) {
  const tags = [];
  const tagElements = element.querySelectorAll('[class*="tag"]');
  tagElements.forEach(tag => {
    const text = tag.textContent?.trim();
    if (text) tags.push(text);
  });
  return tags;
}

// 提取数字（收藏数、浏览数等）
function extractNumber(element, type) {
  const selector = `[class*="${type}"]`;
  const numberElement = element.querySelector(selector);
  if (numberElement) {
    const text = numberElement.textContent;
    const match = text.match(/\d+/);
    return match ? parseInt(match[0]) : 0;
  }
  return 0;
}

// 同步提示词到插件
function syncPromptToExtension(promptData) {
  chrome.runtime.sendMessage({
    action: 'addToFavorites',
    prompt: promptData
  }, function(response) {
    if (response.success) {
      showNotification('已添加到PromptHub Assistant收藏夹', 'success');
    } else {
      showNotification(response.error || '添加失败', 'error');
    }
  });
}

// 显示通知
function showNotification(message, type = 'info') {
  // 创建通知元素
  const notification = document.createElement('div');
  notification.className = `prompthub-notification prompthub-notification-${type}`;
  notification.innerHTML = `
    <div class="prompthub-notification-content">
      <span class="prompthub-notification-message">${message}</span>
      <button class="prompthub-notification-close">×</button>
    </div>
  `;
  
  // 添加样式
  if (!document.querySelector('#prompthub-notification-styles')) {
    const styles = document.createElement('style');
    styles.id = 'prompthub-notification-styles';
    styles.textContent = `
      .prompthub-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        background: #ffffff;
        border: 1px solid #ebeef5;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        padding: 12px 16px;
        min-width: 300px;
        animation: slideIn 0.3s ease-out;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
      }
      
      .prompthub-notification-success {
        border-left: 4px solid #67c23a;
      }
      
      .prompthub-notification-error {
        border-left: 4px solid #f56c6c;
      }
      
      .prompthub-notification-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      
      .prompthub-notification-message {
        color: #303133;
        flex: 1;
        margin-right: 12px;
      }
      
      .prompthub-notification-close {
        background: none;
        border: none;
        font-size: 18px;
        cursor: pointer;
        color: #909399;
        padding: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .prompthub-notification-close:hover {
        color: #606266;
      }
      
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      
      @keyframes slideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(styles);
  }
  
  // 添加到页面
  document.body.appendChild(notification);
  
  // 绑定关闭事件
  const closeBtn = notification.querySelector('.prompthub-notification-close');
  closeBtn.addEventListener('click', function() {
    hideNotification(notification);
  });
  
  // 自动隐藏
  setTimeout(() => {
    hideNotification(notification);
  }, 3000);
}

// 隐藏通知
function hideNotification(notification) {
  notification.style.animation = 'slideOut 0.3s ease-in';
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 300);
}

// 模拟打开插件弹窗（实际上Chrome扩展的popup只能通过点击图标打开）
function openExtensionPopup() {
  showNotification('请点击浏览器工具栏中的PromptHub图标打开助手', 'info');
}

// 监听来自background script的消息
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  switch(request.action) {
    case 'getPagePrompts':
      // 获取当前页面的提示词
      const prompts = extractPagePrompts();
      sendResponse({ success: true, data: prompts });
      break;
      
    case 'highlightPrompt':
      // 高亮显示特定提示词
      highlightPrompt(request.promptId);
      sendResponse({ success: true });
      break;
  }
});

// 提取页面上的所有提示词
function extractPagePrompts() {
  const prompts = [];
  const promptElements = document.querySelectorAll('.prompt-card, [class*="card"]');
  
  promptElements.forEach((element, index) => {
    const promptData = extractPromptData(element);
    if (promptData) {
      promptData.pageIndex = index;
      prompts.push(promptData);
    }
  });
  
  return prompts;
}

// 高亮显示提示词
function highlightPrompt(promptId) {
  // 实现高亮逻辑
  const elements = document.querySelectorAll('.prompt-card, [class*="card"]');
  elements.forEach(element => {
    element.style.outline = '';
  });
  
  // 这里可以添加具体的高亮逻辑
}

// 页面加载完成后的初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    if (isPromptHubSite) {
      console.log('PromptHub网站集成初始化完成');
    }
  });
} else {
  if (isPromptHubSite) {
    console.log('PromptHub网站集成初始化完成');
  }
}