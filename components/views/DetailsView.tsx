import React from 'react';
import { BicingStats } from '../../types';
import { Heatmap } from '../Heatmap';

interface DetailsViewProps {
  stats: BicingStats;
}

const formatShortDate = (date: Date) => {
  return date.toLocaleDateString('ca-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const formatDateFull = (date: Date) => {
    // Added 'year: numeric' to the options
    return date.toLocaleDateString('ca-ES', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric', 
        hour: '2-digit', 
        minute:'2-digit' 
    });
};

export const DetailsView: React.FC<DetailsViewProps> = ({ stats }) => {
  return (
    <div className="animate-in slide-in-from-bottom-4 fade-in duration-500">
      
      <div className="mb-8">
        <Heatmap data={stats.heatmap} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm mb-8">
         <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-gray-800 text-center">
            <div className="text-gray-500 mb-1 font-bold uppercase">Dia preferit</div>
            <div className="text-3xl font-black text-gray-900">{stats.busiestWeekday}</div>
         </div>
         <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-gray-800 text-center">
            <div className="text-gray-500 mb-1 font-bold uppercase">Hora punta</div>
            <div className="text-3xl font-black text-gray-900">{stats.busiestHour}</div>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {/* Podium - TOP BIKES WITH TOOLTIP */}
         <div className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-bicing max-h-[400px] flex flex-col">
           <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2 flex-shrink-0">
              <span>🏆</span> Top Bicis
          </div>
          <div className="space-y-4 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent pb-12">
              {stats.topBikes.map((bike, index) => {
                // Smart Positioning: If it's one of the first 3 items, show tooltip BELOW to avoid overlap with title.
                // Otherwise show ABOVE.
                const isTopItem = index < 3;

                return (
                <div key={bike.id} className="flex items-center justify-between group relative">
                  
                  {/* Tooltip Popup (Light Theme) */}
                  <div className={`absolute left-1/2 -translate-x-1/2 w-56 bg-white text-gray-600 text-xs rounded-xl p-4 shadow-2xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none ${isTopItem ? 'top-full mt-3' : 'bottom-full mb-3'}`}>
                     
                     {/* Header */}
                     <div className="flex justify-between items-center border-b border-gray-100 pb-2 mb-2">
                        <span className="font-bold text-gray-900">Historial Bici #{bike.id}</span>
                        <span className="bg-gray-100 text-gray-500 px-1.5 rounded text-[10px] font-mono">{bike.count}v</span>
                     </div>

                     {/* List */}
                     <div className="max-h-32 overflow-hidden flex flex-col gap-1.5 text-center">
                         {bike.usageDates.slice(0, 8).map((d, i) => (
                             <div key={i} className="font-mono text-[10px] text-gray-500 bg-gray-50 rounded py-0.5">
                                {formatDateFull(d)}
                             </div>
                         ))}
                         {bike.usageDates.length > 8 && (
                             <div className="text-gray-400 italic text-[10px] mt-1">...i {bike.usageDates.length - 8} viatges més</div>
                         )}
                     </div>

                     {/* Arrow (Dynamic direction) */}
                     <div className={`absolute left-1/2 -translate-x-1/2 w-3 h-3 bg-white transform rotate-45 border-l border-t border-gray-100 ${isTopItem ? '-top-1.5 border-b-0 border-r-0' : '-bottom-1.5 border-l-0 border-t-0 border-b border-r'}`}></div>
                  </div>

                  <div className="flex items-center gap-4 cursor-help">
                       <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold text-white shadow-sm ${index === 0 ? 'bg-yellow-400' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-400' : 'bg-gray-100 text-gray-400'}`}>
                         {index+1}
                       </div>
                       <span className="font-mono font-bold text-gray-800 text-lg border-b border-dashed border-gray-300 group-hover:border-bicing transition-colors">#{bike.id}</span>
                  </div>
                  <div className="font-black text-bicing text-xl whitespace-nowrap">{bike.count} <span className="text-sm font-normal text-gray-400">v.</span></div>
                </div>
              )})}
          </div>
        </div>

        {/* Top Days */}
        <div className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-gray-800 max-h-[400px] flex flex-col">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2 flex-shrink-0">
              <span>📅</span> Dies més actius
          </div>
          <div className="space-y-4 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
            {stats.topDays.map((day, idx) => (
              <div key={day.date} className="flex items-center justify-between">
                 <div className="flex items-center gap-4">
                   <span className={`w-6 text-right font-mono font-bold text-sm ${idx < 3 ? 'text-gray-800' : 'text-gray-300'}`}>#{idx+1}</span>
                   <span className="font-bold text-gray-800">{day.formattedDate}</span>
                 </div>
                 <div className="font-bold text-bicing text-lg whitespace-nowrap">{day.count} <span className="text-sm font-normal text-gray-400">v.</span></div>
              </div>
            ))}
          </div>
        </div>

        {/* Longest Trips */}
        <div className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-gray-800 max-h-[400px] flex flex-col">
           <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2 flex-shrink-0">
              <span>⏱️</span> Viatges més llargs
          </div>
          <div className="space-y-4 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
            {stats.longestTrips.map((trip, idx) => (
               <div key={trip.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                      <span className={`w-6 text-right font-mono font-bold text-sm ${idx < 3 ? 'text-gray-800' : 'text-gray-300'}`}>#{idx+1}</span>
                      <span className="font-bold text-gray-800">{formatShortDate(trip.startDate)}</span>
                  </div>
                  <div className="font-bold text-bicing text-lg whitespace-nowrap">{trip.durationMinutes} <span className="text-sm font-normal text-gray-400">min</span></div>
               </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};