import React from 'react';

interface FilterBarProps {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  minDate: string;
  maxDate: string;
  availableYears?: number[];
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  className?: string;
}

// Helper to format YYYY-MM-DD to DD/MM/YYYY
const formatDisplay = (isoDate: string) => {
  if (!isoDate) return '-';
  const [y, m, d] = isoDate.split('-');
  return `${d}/${m}/${y}`;
};

export const FilterBar: React.FC<FilterBarProps> = ({
  startDate,
  endDate,
  minDate,
  maxDate,
  availableYears = [],
  onStartDateChange,
  onEndDateChange,
  className = ''
}) => {

  const handleYearClick = (year: number) => {
    onStartDateChange(`${year}-01-01`);
    onEndDateChange(`${year}-12-31`);
  };

  const handleAllClick = () => {
    onStartDateChange(minDate);
    onEndDateChange(maxDate);
  };
  
  // Helpers for styling active state
  const isYearSelected = (year: number) => {
    return startDate === `${year}-01-01` && endDate === `${year}-12-31`;
  };

  const isAllSelected = () => {
    // Basic check: starts with min and ends with max
    return startDate === minDate && endDate === maxDate;
  };

  return (
    <div className={`bg-white p-2 md:p-3 rounded-xl shadow-sm border border-gray-200 flex flex-col xl:flex-row items-center gap-3 ${className}`}>
      <div className="flex items-center gap-2 text-gray-500 font-bold text-xs uppercase tracking-wide px-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-bicing" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span>Filtres</span>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
        
        {/* Year Buttons if more than 1 year available */}
        {availableYears.length > 1 && (
            <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 max-w-full no-scrollbar">
                <button 
                    onClick={handleAllClick}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${isAllSelected() ? 'bg-bicing border-bicing text-white shadow-sm' : 'bg-gray-50 border-gray-100 text-gray-600 hover:bg-gray-100'}`}
                >
                    Tot
                </button>
                {availableYears.map(year => (
                    <button
                        key={year}
                        onClick={() => handleYearClick(year)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${isYearSelected(year) ? 'bg-bicing border-bicing text-white shadow-sm' : 'bg-gray-50 border-gray-100 text-gray-600 hover:bg-gray-100'}`}
                    >
                        {year}
                    </button>
                ))}
            </div>
        )}
      
        <div className="flex items-center gap-2 justify-center md:justify-end bg-gray-50 p-1 rounded-lg border border-gray-100">
            {/* Start Date Custom Input */}
            <div className="relative group">
            <div className="px-3 py-1 text-xs font-mono font-bold text-gray-700 bg-white rounded border border-gray-200 group-hover:border-bicing transition-colors min-w-[90px] text-center shadow-sm">
                {formatDisplay(startDate)}
            </div>
            <input
                type="date"
                value={startDate}
                min={minDate}
                max={endDate}
                onChange={(e) => onStartDateChange(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            </div>

            <span className="text-gray-300 font-bold text-[10px] uppercase">➜</span>

            {/* End Date Custom Input */}
            <div className="relative group">
            <div className="px-3 py-1 text-xs font-mono font-bold text-gray-700 bg-white rounded border border-gray-200 group-hover:border-bicing transition-colors min-w-[90px] text-center shadow-sm">
                {formatDisplay(endDate)}
            </div>
            <input
                type="date"
                value={endDate}
                min={startDate}
                max={maxDate}
                onChange={(e) => onEndDateChange(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            </div>
        </div>
      </div>
    </div>
  );
};