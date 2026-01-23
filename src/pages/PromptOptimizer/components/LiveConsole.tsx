import { useEffect, useRef } from 'react';
import { Timeline } from 'antd';
import type { ConsoleLog } from '../types';

interface LiveConsoleProps {
  logs: ConsoleLog[];
}

export default function LiveConsole({ logs }: LiveConsoleProps) {
  const consoleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [logs]);

  const getTimelineColor = (type: ConsoleLog['type']) => {
    switch (type) {
      case 'success': return 'green';
      case 'warning': return 'yellow';
      case 'error': return 'red';
      default: return 'blue';
    }
  };

  const timelineItems = logs.map((log) => ({
    color: getTimelineColor(log.type),
    children: (
      <div className="pb-2">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
            {new Date(log.timestamp).toLocaleTimeString('zh-CN', { hour12: false })}
          </span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
            {log.agent}
          </span>
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          {log.message}
        </p>
      </div>
    ),
  }));

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
      <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
            <div className="w-3 h-3 rounded-full bg-green-400"></div>
          </div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-2">
            协作日志
          </h3>
        </div>
      </div>

      <div
        ref={consoleRef}
        className="flex-1 overflow-y-auto p-4 bg-gray-50/50 dark:bg-gray-900/50"
      >
        {logs.length > 0 ? (
          <Timeline items={timelineItems} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-400 dark:text-gray-600 text-sm">等待工作流启动...</p>
          </div>
        )}
      </div>
    </div>
  );
}
