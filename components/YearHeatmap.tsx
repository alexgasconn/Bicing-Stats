import React, { useMemo } from 'react';

interface YearHeatmapProps {
  data: { date: string; isoDate?: string; count: number }[]; // date is formatted, isoDate is YYYY-MM-DD
}

const MONTH_LABELS = ['Gen', 'Feb', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Des'];
const DAY_LABELS = ['', 'Dl', '', 'Dc', '', 'Dv', ''];

interface SingleYearGridProps {
  year: number;
  data: Map<string, number>;
}

const SingleYearGrid: React.FC<SingleYearGridProps> = ({ year, data }) => {
    // Determine bounds for this specific year
    // We strictly want Jan 1 to Dec 31 for the "Wrapped" feel, or at least the range of data present.
    // Let's do full year to look nice and consistent like GitHub.
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    // Find max for this year for local normalization or use global? Global is better for comparison.
    // We'll pass maxCount as a prop if needed, but for now local color scale is fine.
    let maxCount = 0;
    data.forEach(v => { if(v > maxCount) maxCount = v; });

    // Align start to the previous Monday
    const dayOfW = startDate.getDay(); // 0 (Sun) to 6 (Sat)
    const offset = dayOfW === 0 ? 6 : dayOfW - 1;
    const gridStart = new Date(startDate);
    gridStart.setDate(gridStart.getDate() - offset);

    const days = [];
    const current = new Date(gridStart);

    // Loop until we cover the end date AND finish the week
    while (current <= endDate || current.getDay() !== 1) {
        const dateStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
        const count = data.get(dateStr) || 0;
        
        // Only mark inRange if it is actually within the target year (visual cleanup)
        const inYear = current.getFullYear() === year;

        days.push({
            date: dateStr,
            obj: new Date(current),
            count,
            inRange: inYear
        });
        current.setDate(current.getDate() + 1);
    }

    const getColor = (count: number) => {
        if (count === 0) return 'bg-gray-100';
        // 4 levels
        const intensity = maxCount > 0 ? Math.ceil((count / maxCount) * 4) : 0;
        switch (intensity) {
            case 1: return 'bg-red-200';
            case 2: return 'bg-red-400';
            case 3: return 'bg-red-600';
            case 4: return 'bg-red-800';
            default: return 'bg-red-200';
        }
    };

    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
        weeks.push(days.slice(i, i + 7));
    }

    return (
        <div className="mb-8 last:mb-0">
             <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-2">{year}</h4>
             <div className="min-w-[800px] flex flex-col gap-2">
                {/* Months */}
                <div className="flex text-xs text-gray-400 mb-1 pl-8">
                    {weeks.map((week, idx) => {
                        const firstDay = week[0].obj;
                        const prevWeek = weeks[idx - 1];
                        const isNewMonth = !prevWeek || prevWeek[0].obj.getMonth() !== firstDay.getMonth();
                        
                        // Only show label if the month actually belongs to this year (edge case first week of jan might be prev year dec)
                        if (isNewMonth && idx < weeks.length - 2 && firstDay.getFullYear() === year) {
                             return <div key={idx} className="flex-1 text-left overflow-visible whitespace-nowrap">{MONTH_LABELS[firstDay.getMonth()]}</div>
                        }
                        return <div key={idx} className="flex-1"></div>;
                    })}
                </div>

                <div className="flex gap-2">
                    {/* Weekday Labels */}
                    <div className="flex flex-col gap-1 justify-between pt-1 pb-1 text-[10px] text-gray-400 font-bold w-6">
                        {DAY_LABELS.map((label, i) => (
                            <div key={i} className="h-3 leading-3">{label}</div>
                        ))}
                    </div>

                    {/* Grid */}
                    <div className="flex gap-1 flex-1">
                        {weeks.map((week, wIdx) => (
                            <div key={wIdx} className="flex flex-col gap-1 flex-1">
                                {week.map((day) => (
                                    <div 
                                        key={day.date}
                                        className={`h-3 w-3 rounded-sm ${day.inRange ? getColor(day.count) : 'opacity-0'} relative group transition-colors`}
                                    >
                                        {day.inRange && (
                                            <div className="opacity-0 group-hover:opacity-100 absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-gray-900 text-white text-xs py-1 px-2 rounded pointer-events-none whitespace-nowrap z-50 shadow-lg font-bold">
                                                {day.obj.toLocaleDateString('ca-ES')} <br/>
                                                <span className="text-red-300">{day.count} viatges</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
             </div>
        </div>
    )
}

export const YearHeatmap: React.FC<YearHeatmapProps> = ({ data }) => {
  // Group data by year
  const yearsData = useMemo(() => {
    const map = new Map<number, Map<string, number>>();
    
    data.forEach(d => {
        const key = d.isoDate || d.date; // YYYY-MM-DD
        const [yStr] = key.split('-');
        const year = parseInt(yStr);
        
        if (!map.has(year)) {
            map.set(year, new Map());
        }
        map.get(year)!.set(key, d.count);
    });

    // Sort years descending
    const sortedYears = Array.from(map.keys()).sort((a, b) => b - a);
    return sortedYears.map(year => ({ year, counts: map.get(year)! }));
  }, [data]);

  if (data.length === 0) return null;

  return (
    <div className="w-full overflow-x-auto bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <span>📅</span> Constància anual
      </h3>
      
      {yearsData.map(({ year, counts }) => (
          <SingleYearGrid key={year} year={year} data={counts} />
      ))}

      <div className="flex items-center justify-end gap-2 text-xs text-gray-400 mt-4">
        <span>Menys</span>
        <div className="w-3 h-3 bg-gray-100 rounded-sm"></div>
        <div className="w-3 h-3 bg-red-200 rounded-sm"></div>
        <div className="w-3 h-3 bg-red-400 rounded-sm"></div>
        <div className="w-3 h-3 bg-red-600 rounded-sm"></div>
        <div className="w-3 h-3 bg-red-800 rounded-sm"></div>
        <span>Més</span>
     </div>
    </div>
  );
};