// 用于开发环境初始化 mock 数据的工具函数
export function initMockData() {
  if (typeof window !== 'undefined' && import.meta.env.DEV) {
    // 清除旧数据，强制重新初始化
    localStorage.removeItem('prompts');
    console.log('✅ Mock 数据已清除，将在下次 API 调用时重新初始化');
  }
}

// 在开发环境下，可以在控制台调用 window.initMockData() 来重置数据
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (window as any).initMockData = initMockData;
  console.log('💡 提示：在控制台输入 initMockData() 可以重置 mock 数据');
}
