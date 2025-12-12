import React, { useState } from 'react';
import { BicingTrip } from '../../types';
import { Charts } from '../Charts';
import { Heatmap } from '../Heatmap';
import { useBicingStats } from '../../hooks/useBicingStats';

interface EvolutionViewProps {
  trips: BicingTrip[];
  startDate: string;
  endDate: string;
}

export const EvolutionView: React.FC<EvolutionViewProps> = ({ trips, startDate, endDate }) => {
  const [bikeFilter, setBikeFilter] = useState<'all' | 'mecanica' | 'electrica'>('all');

  // We calculate stats locally for this view to support the filter without affecting global stats
  const stats = useBicingStats(trips, startDate, endDate, { name: 'Standard', price: 50 }, bikeFilter);

  return (
    <div className="animate-in slide-in-from-bottom-4 fade-in duration-500 space-y-8">
      
      {/* Filter Control */}
      <div className="flex justify-center">
        <div className="inline-flex bg-gray-100 p-1 rounded-xl shadow-inner">
            <button 
                onClick={() => setBikeFilter('all')}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${bikeFilter === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
            >
                Tot
            </button>
            <button 
                onClick={() => setBikeFilter('electrica')}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${bikeFilter === 'electrica' ? 'bg-white text-yellow-600 shadow-sm' : 'text-gray-500 hover:text-yellow-600'}`}
            >
                Elèctriques ⚡
            </button>
            <button 
                onClick={() => setBikeFilter('mecanica')}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${bikeFilter === 'mecanica' ? 'bg-white text-bicing shadow-sm' : 'text-gray-500 hover:text-bicing'}`}
            >
                Mecàniques 🚲
            </button>
        </div>
      </div>

      <div className="text-center text-sm text-gray-400">
        Mostrant dades de <strong>{stats.totalTrips}</strong> viatges
      </div>
      
      {/* 1. Charts (Time Evolution, Seasonality, Hours) */}
      <Charts stats={stats} />

      {/* 2. Weekly Routine Heatmap (Moved from Details) */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-4 px-2">🔥 La teva rutina setmanal</h3>
        <Heatmap data={stats.heatmap} />
        <p className="text-sm text-gray-500 mt-4 px-2 max-w-2xl">
            Aquest mapa mostra la intensitat del teu ús per dia i hora. Les zones vermelles són els moments on gairebé sempre agafes una bici.
        </p>
      </div>

       {/* 3. Daily Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
         <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-gray-800 flex items-center justify-between">
            <div>
                <div className="text-gray-500 mb-1 font-bold uppercase text-xs">Dia preferit</div>
                <div className="text-2xl font-black text-gray-900">{stats.busiestWeekday}</div>
            </div>
            <div className="text-4xl">📅</div>
         </div>
         <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-gray-800 flex items-center justify-between">
             <div>
                <div className="text-gray-500 mb-1 font-bold uppercase text-xs">Hora punta</div>
                <div className="text-2xl font-black text-gray-900">{stats.busiestHour}</div>
            </div>
            <div className="text-4xl">⏰</div>
         </div>
      </div>

    </div>
  );
};