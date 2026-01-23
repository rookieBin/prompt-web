import type { JudgeScore } from '../types';

interface ScoreRadarProps {
  score?: JudgeScore;
}

export default function ScoreRadar({ score }: ScoreRadarProps) {
  if (!score) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <div className="flex flex-col items-center justify-center text-center py-12">
          <p className="text-gray-400 dark:text-gray-600 text-sm">等待评分结果...</p>
        </div>
      </div>
    );
  }

  const dimensions = score.dimensions;
  const centerX = 150;
  const centerY = 150;
  const radius = 100;
  const angleStep = (2 * Math.PI) / dimensions.length;

  const getPoint = (index: number, value: number) => {
    const angle = angleStep * index - Math.PI / 2;
    const r = (value / 100) * radius;
    return {
      x: centerX + r * Math.cos(angle),
      y: centerY + r * Math.sin(angle),
    };
  };

  const polygonPoints = dimensions
    .map((dim, i) => {
      const point = getPoint(i, dim.score);
      return `${point.x},${point.y}`;
    })
    .join(' ');

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
      <div className="px-4 py-3 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          多维度评分
        </h3>
      </div>

      <div className="p-6 flex items-center justify-center bg-gradient-to-br from-gray-50/50 to-white dark:from-gray-900/50 dark:to-gray-800">
        <svg width="300" height="300" viewBox="0 0 300 300">
          {[20, 40, 60, 80, 100].map((percent) => {
            const points = dimensions
              .map((_, i) => {
                const point = getPoint(i, percent);
                return `${point.x},${point.y}`;
              })
              .join(' ');

            return (
              <polygon
                key={percent}
                points={points}
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                className="text-gray-200 dark:text-gray-700"
                opacity="0.3"
              />
            );
          })}

          {dimensions.map((_, index) => {
            const point = getPoint(index, 100);
            return (
              <line
                key={index}
                x1={centerX}
                y1={centerY}
                x2={point.x}
                y2={point.y}
                stroke="currentColor"
                strokeWidth="1"
                className="text-gray-300 dark:text-gray-600"
              />
            );
          })}

          <polygon
            points={polygonPoints}
            fill="url(#radarGradient)"
            stroke="#6366f1"
            strokeWidth="2.5"
          />

          <defs>
            <linearGradient id="radarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#a855f7" stopOpacity="0.4" />
            </linearGradient>
          </defs>

          {dimensions.map((dim, index) => {
            const point = getPoint(index, dim.score);
            return (
              <g key={index}>
                <circle cx={point.x} cy={point.y} r="5" fill="#6366f1" />
                <circle cx={point.x} cy={point.y} r="8" fill="none" stroke="#6366f1" strokeWidth="2" opacity="0.3" />
              </g>
            );
          })}

          {dimensions.map((dim, index) => {
            const labelPoint = getPoint(index, 120);
            return (
              <g key={index}>
                <text
                  x={labelPoint.x}
                  y={labelPoint.y}
                  textAnchor="middle"
                  className="text-xs font-semibold fill-gray-700 dark:fill-gray-300"
                >
                  {dim.name}
                </text>
                <text
                  x={labelPoint.x}
                  y={labelPoint.y + 14}
                  textAnchor="middle"
                  className="text-xs font-bold fill-indigo-600 dark:fill-indigo-400"
                >
                  {Math.round(dim.score)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {score.feedback && (
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-start gap-2">
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              {score.feedback}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
