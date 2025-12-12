import React from 'react';

interface HeatmapProps {
  data: number[][]; // 7 rows (days) x 24 cols (hours)
}

const DAYS = ['Dl', 'Dt', 'Dc', 'Dj', 'Dv', 'Ds', 'Dg'];
const HOURS = [0, 6, 12, 18, 23]; // Labels for axis

export const Heatmap: React.FC<HeatmapProps> = ({ data }) => {
  // Find max value to normalize colors
  let max = 0;
  data.forEach(row => row.forEach(val => max = Math.max(max, val)));

  const getOpacity = (value: number) => {
    if (value === 0) return 0.05;
    return Math.max(0.15, value / max);
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 w-full overflow-x-auto">
      <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
        <span className="text-2xl">🔥</span> Mapa de Calor Setmanal
      </h3>
      
      <div className="min-w-[600px]">
        {/* Hour Labels */}
        <div className="flex mb-2 pl-8">
          {Array.from({ length: 24 }).map((_, h) => (
            <div key={h} className="flex-1 text-[10px] text-gray-400 text-center">
              {HOURS.includes(h) ? `${h}h` : ''}
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-1">
          {data.map((row, dayIndex) => (
            <div key={dayIndex} className="flex items-center gap-2">
              <div className="w-6 text-xs font-bold text-gray-500 text-right">
                {DAYS[dayIndex]}
              </div>
              {/* Fix: Use inline gridTemplateColumns because grid-cols-24 doesn't exist in Tailwind default */}
              <div 
                className="flex-1 grid gap-1 h-8"
                style={{ gridTemplateColumns: 'repeat(24, minmax(0, 1fr))' }}
              >
                {row.map((count, hourIndex) => (
                  <div
                    key={hourIndex}
                    className="rounded-sm transition-all hover:scale-125 hover:z-10 relative group"
                    style={{
                      backgroundColor: `rgba(214, 0, 28, ${getOpacity(count)})` // Bicing Red with opacity
                    }}
                  >
                    {/* Tooltip */}
                    {count > 0 && (
                      <div className="opacity-0 group-hover:opacity-100 absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 bg-black text-white text-xs py-1 px-2 rounded pointer-events-none whitespace-nowrap z-20">
                        {count} viatges
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex justify-end items-center mt-4 text-xs text-gray-400 gap-2">
          <span>Menys</span>
          <div className="w-3 h-3 bg-red-100 rounded"></div>
          <div className="w-3 h-3 bg-red-300 rounded"></div>
          <div className="w-3 h-3 bg-red-600 rounded"></div>
          <span>Més activitat</span>
        </div>
      </div>
    </div>
  );
};