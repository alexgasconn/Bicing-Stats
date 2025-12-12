import React from 'react';
import { BicingStats, BicingTrip } from '../../types';
import { StatCard } from '../StatCard';
import { YearHeatmap } from '../YearHeatmap';

interface Tariff {
  name: string;
  price: number;
}

interface WrappedViewProps {
  stats: BicingStats;
  filteredTrips: BicingTrip[];
  elecPct: number;
  mechPct: number;
  selectedTariff: string;
  tariffOptions: Record<string, Tariff>;
  onTariffChange: (key: string) => void;
}

const formatShortDate = (date: Date) => date.toLocaleDateString('ca-ES', { day: 'numeric', month: 'short' });

export const WrappedView: React.FC<WrappedViewProps> = ({ 
    stats, 
    filteredTrips,
    elecPct, 
    mechPct, 
    selectedTariff, 
    tariffOptions, 
    onTariffChange 
}) => {
  const currentTariff = tariffOptions[selectedTariff] || { name: 'Desconegut', price: 0 };

  return (
    <div className="animate-in slide-in-from-bottom-4 fade-in duration-500 space-y-10">
      
      {/* 1. Hero Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Total Trajectes" 
          value={stats.totalTrips} 
          delay={100}
          icon={<span className="text-2xl">🚲</span>}
        />
        <StatCard 
          label="Temps total" 
          value={`${(stats.totalMinutes / 60).toFixed(1)}h`} 
          subValue="sobre rodes"
          delay={200}
          icon={<span className="text-2xl">⏱️</span>}
        />
        <StatCard 
          label="Racha màxima" 
          value={`${stats.longestStreak} dies`} 
          subValue="consecutius"
          delay={300}
          highlight
          icon={<span className="text-2xl">🔥</span>}
        />
         <StatCard 
          label="Bicis diferents" 
          value={stats.uniqueBikes}
          subValue={`${stats.repeatedBikes} repetides`}
          delay={400}
          icon={<span className="text-2xl">🎲</span>}
        />
      </div>

      {/* 2. Year Heatmap */}
      <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300">
         <YearHeatmap data={stats.tripsByDate} />
      </div>

      {/* 3. Records Section (Moved from Details) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Top Days */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">📅 Dies Rècord</h3>
              <div className="space-y-3">
                  {stats.topDays.slice(0, 5).map((day, idx) => (
                      <div key={day.date} className="flex items-center justify-between border-b border-gray-50 last:border-0 pb-2 last:pb-0">
                          <div className="flex items-center gap-3">
                              <span className={`text-xs font-bold rounded px-1.5 py-0.5 ${idx === 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-500'}`}>{idx+1}</span>
                              <span className="text-sm font-medium text-gray-700">{day.formattedDate}</span>
                          </div>
                          <div className="font-bold text-bicing">{day.count} <span className="text-xs text-gray-400 font-normal">viatges</span></div>
                      </div>
                  ))}
              </div>
          </div>

          {/* Longest Trips */}
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">⏱️ Viatges més llargs</h3>
              <div className="space-y-3">
                  {stats.longestTrips.slice(0, 5).map((trip, idx) => (
                      <div key={trip.id} className="flex items-center justify-between border-b border-gray-50 last:border-0 pb-2 last:pb-0">
                          <div className="flex items-center gap-3">
                               <span className={`text-xs font-bold rounded px-1.5 py-0.5 ${idx === 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-500'}`}>{idx+1}</span>
                              <span className="text-sm font-medium text-gray-700">{formatShortDate(trip.startDate)}</span>
                          </div>
                          <div className="font-bold text-bicing">{trip.durationMinutes} <span className="text-xs text-gray-400 font-normal">min</span></div>
                      </div>
                  ))}
              </div>
          </div>
      </div>

      {/* 4. Bike Types & Cost */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Bike Types */}
          <div className="bg-white p-8 rounded-xl shadow-sm border-l-4 border-gray-800 flex flex-col justify-center h-full hover:shadow-lg transition-all">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6">Mecànica vs Elèctrica</h3>
              <div className="w-full h-8 bg-gray-100 rounded-full overflow-hidden flex mb-8">
                  <div className="bg-yellow-400 h-full flex items-center justify-center text-[10px] font-bold text-yellow-900" style={{width: `${elecPct}%`}}></div>
                  <div className="bg-bicing h-full flex items-center justify-center text-[10px] font-bold text-white" style={{width: `${mechPct}%`}}></div>
              </div>
              <div className="flex justify-between items-end">
                  <div>
                      <div className="text-4xl font-black text-gray-900">{stats.electricCount}</div>
                      <div className="text-sm font-bold text-gray-500 uppercase">Elèctriques</div>
                      <div className="text-xl text-yellow-600 font-bold mt-1">{elecPct}%</div>
                  </div>
                  <div className="text-right">
                      <div className="text-4xl font-black text-gray-900">{stats.mechanicalCount}</div>
                      <div className="text-sm font-bold text-gray-500 uppercase">Mecàniques</div>
                      <div className="text-xl text-bicing font-bold mt-1">{mechPct}%</div>
                  </div>
              </div>
          </div>

          {/* Cost Card */}
          <div className="bg-white p-8 rounded-xl shadow-sm border-l-4 border-bicing flex flex-col justify-between h-full hover:shadow-lg transition-all">
              <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Economia</h3>
                  <div className="relative">
                      <select 
                          value={selectedTariff} 
                          onChange={(e) => onTariffChange(e.target.value)}
                          className="appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-1 px-3 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-bicing text-xs font-bold uppercase tracking-wide cursor-pointer hover:bg-gray-100"
                      >
                          {Object.entries(tariffOptions).map(([key, tariff]) => (
                              <option key={key} value={key}>{(tariff as Tariff).name} ({(tariff as Tariff).price}€/any)</option>
                          ))}
                      </select>
                   </div>
              </div>

              <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                      <span className="text-gray-500 font-medium">Extres acumulats</span>
                      <span className="text-xl font-bold text-bicing">{stats.totalCost.toFixed(2)}€</span>
                  </div>
                  <div className="flex justify-between items-end pt-2">
                      <div>
                          <span className="font-bold text-gray-900 block text-lg">Preu real per viatge</span>
                          <span className="text-xs text-gray-400 font-medium">
                            {currentTariff.price}€ x {Array.from(new Set(filteredTrips.map(t => t.startDate.getFullYear()))).length || 1} anys
                          </span>
                      </div>
                      <span className="text-6xl font-black text-gray-900 block">{stats.avgCostPerTripIncludingSub.toFixed(2)}€</span>
                  </div>
              </div>
          </div>
      </div>
      
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <StatCard 
          label="CO2 Estalviat" 
          value={`${stats.co2SavedKg.toFixed(1)} kg`} 
          subValue="Respira millor!"
          delay={500}
        />
        <StatCard 
          label="Temps mig" 
          value={`${stats.averageTime} min`} 
          delay={600}
        />
         <StatCard 
          label="Distància est." 
          value={`~${stats.estimatedDistanceKm.toFixed(0)} km`} 
          delay={700}
        />
      </div>

    </div>
  );
};