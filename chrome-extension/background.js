// Background Service Worker
// 处理插件的后台逻辑

// 安装时的初始化
chrome.runtime.onInstalled.addListener(function(details) {
  console.log('PromptHub Assistant 插件已安装');
  
  // 初始化存储数据
  initializeStorage();
});

// 初始化存储数据
function initializeStorage() {
  // 检查是否已有收藏数据
  chrome.storage.sync.get(['favoritePrompts'], function(result) {
    if (!result.favoritePrompts) {
      // 设置默认的收藏提示词
      const defaultFavorites = [
        {
          id: 1,
          title: '代码优化助手',
          description: '帮助你分析代码并提供优化建议，提高代码质量和性能。',
          content: '你是一个专业的代码审查专家，请帮我分析这段代码的问题并给出优化建议:\n\n[请在这里粘贴你的代码]\n\n请从以下方面进行分析：\n1. 代码逻辑和算法效率\n2. 代码结构和可读性\n3. 潜在的安全问题\n4. 性能优化建议\n5. 最佳实践建议',
          category: '编程',
          tags: ['代码审查', '性能优化', 'JavaScript'],
          stars: 234,
          views: 1250,
          addedAt: Date.now()
        },
        {
          id: 3,
          title: '英语学习教练',
          description: '个性化英语学习指导，提升口语、写作和阅读能力。',
          content: '你是一位专业的英语教学专家，具有丰富的教学经验。请根据我的英语水平和学习需求，为我制定一个个性化的学习计划。\n\n我的情况：\n[请描述你的英语水平、学习目标、可用时间等]\n\n请提供：\n1. 学习计划和时间安排\n2. 推荐的学习资源和方法\n3. 每日/每周的学习任务\n4. 进度评估和调整建议',
          category: '教育',
          tags: ['英语学习', '教育', '语言'],
          stars: 312,
          views: 1680,
          addedAt: Date.now()
        },
        {
          id: 5,
          title: 'UI设计顾问',
          description: '提供专业的界面设计建议，改善用户体验和视觉效果。',
          content: '作为一位资深的UI/UX设计师，请为我的应用界面提供专业的设计建议和改进方案。\n\n项目信息：\n[请描述你的应用类型、目标用户、当前界面情况等]\n\n请从以下方面提供建议：\n1. 整体视觉设计和品牌一致性\n2. 用户体验流程优化\n3. 界面布局和信息架构\n4. 交互设计和可用性\n5. 响应式设计建议\n6. 无障碍设计考虑',
          category: '设计',
          tags: ['UI设计', '用户体验', 'Figma'],
          stars: 278,
          views: 1156,
          addedAt: Date.now()
        }
      ];
      
      chrome.storage.sync.set({ 
        favoritePrompts: defaultFavorites,
        lastSync: Date.now()
      });
    }
  });
}

// 监听来自content script的消息
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  switch(request.action) {
    case 'getFavoritePrompts':
      getFavoritePrompts(sendResponse);
      return true; // 保持消息通道开放
      
    case 'addToFavorites':
      addToFavorites(request.prompt, sendResponse);
      return true;
      
    case 'removeFromFavorites':
      removeFromFavorites(request.promptId, sendResponse);
      return true;
      
    case 'syncWithWebsite':
      syncWithWebsite(sendResponse);
      return true;
  }
});

// 获取收藏的提示词
function getFavoritePrompts(sendResponse) {
  chrome.storage.sync.get(['favoritePrompts'], function(result) {
    sendResponse({
      success: true,
      data: result.favoritePrompts || []
    });
  });
}

// 添加到收藏
function addToFavorites(prompt, sendResponse) {
  chrome.storage.sync.get(['favoritePrompts'], function(result) {
    const favorites = result.favoritePrompts || [];
    
    // 检查是否已经收藏
    if (favorites.some(p => p.id === prompt.id)) {
      sendResponse({
        success: false,
        error: '该提示词已经在收藏夹中'
      });
      return;
    }
    
    // 添加时间戳
    prompt.addedAt = Date.now();
    favorites.push(prompt);
    
    chrome.storage.sync.set({ favoritePrompts: favorites }, function() {
      sendResponse({
        success: true,
        message: '添加到收藏夹成功'
      });
    });
  });
}

// 从收藏中移除
function removeFromFavorites(promptId, sendResponse) {
  chrome.storage.sync.get(['favoritePrompts'], function(result) {
    const favorites = result.favoritePrompts || [];
    const filteredFavorites = favorites.filter(p => p.id !== promptId);
    
    chrome.storage.sync.set({ favoritePrompts: filteredFavorites }, function() {
      sendResponse({
        success: true,
        message: '从收藏夹移除成功'
      });
    });
  });
}

// 与网站同步数据
function syncWithWebsite(sendResponse) {
  // 这里可以实现与主网站的数据同步逻辑
  // 比如通过API获取用户的最新收藏数据
  
  // 模拟同步过程
  setTimeout(() => {
    chrome.storage.sync.set({ lastSync: Date.now() }, function() {
      sendResponse({
        success: true,
        message: '同步完成',
        timestamp: Date.now()
      });
    });
  }, 1000);
}

// 监听标签页更新，可以用于检测是否在PromptHub网站
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (changeInfo.status === 'complete' && tab.url) {
    // 检查是否在PromptHub网站上
    if (tab.url.includes('localhost:5174') || tab.url.includes('prompthub')) {
      // 可以在这里注入特定的content script或发送消息
      console.log('用户访问了PromptHub网站');
    }
  }
});

// 定期同步数据（每小时一次）
chrome.alarms.create('syncData', { periodInMinutes: 60 });
chrome.alarms.onAlarm.addListener(function(alarm) {
  if (alarm.name === 'syncData') {
    // 执行数据同步
    console.log('执行定期数据同步');
  }
});