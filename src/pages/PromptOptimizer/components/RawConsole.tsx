import { useEffect, useMemo, useRef } from 'react';
import type { ConsoleLog } from '../types';

interface RawConsoleProps {
  logs: ConsoleLog[];
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString('zh-CN', { hour12: false });
}

export default function RawConsole({ logs }: RawConsoleProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.scrollTop = ref.current.scrollHeight;
  }, [logs]);

  const lines = useMemo(() => {
    return logs.map((l) => ({
      id: l.id,
      text: `[${formatTime(l.timestamp)}]: ${l.message}`,
      type: l.type,
    }));
  }, [logs]);

  return (
    <div className="raw-console">
      <div className="raw-console-header">控制台</div>
      <div ref={ref} className="raw-console-body">
        {lines.length === 0 ? (
          <div className="raw-console-empty">等待输出...</div>
        ) : (
          lines.map((l) => (
            <div key={l.id} className={`raw-console-line raw-console-line--${l.type}`}> 
              {l.text}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
