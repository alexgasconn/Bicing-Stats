import React, { useMemo, useState } from 'react';
import { BicingTrip, TariffRules } from '../types';
import { FilterBar } from './FilterBar';
import { useBicingStats } from '../hooks/useBicingStats';

// Views
import { WrappedView } from './views/WrappedView';
import { EvolutionView } from './views/EvolutionView';
import { BikesView } from './views/BikesView'; 
import { TripsTableView } from './views/TripsTableView';

interface DashboardProps {
  trips: BicingTrip[];
  onReset: () => void;
}

type TabType = 'wrapped' | 'evolution' | 'bikes' | 'table';

const getLocalYMD = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// Official Tariff Definitions
const TARIFFS: Record<string, TariffRules> = {
  plana: { 
    id: 'plana',
    name: "Tarifa Plana (50€)", 
    price: 50,
    baseMec: 0, baseElec: 0.35,
    midMec: 0.70, midElec: 0.90,
    maxPrice: 5.00
  },
  us: { 
    id: 'us',
    name: "Tarifa d'Ús (35€)", 
    price: 35,
    baseMec: 0.35, baseElec: 0.55,
    midMec: 0.70, midElec: 0.90,
    maxPrice: 5.00
  },
  metro_plana: { 
    id: 'metro_plana',
    name: "Abonament Metro. Plana (65€)", 
    price: 65,
    baseMec: 0, baseElec: 0.35,
    midMec: 0.70, midElec: 0.90,
    maxPrice: 5.00
  },
  metro_us: { 
    id: 'metro_us',
    name: "Abonament Metro. Ús (53€)", 
    price: 53,
    baseMec: 0.35, baseElec: 0.55,
    midMec: 0.70, midElec: 0.90,
    maxPrice: 5.00
  },
};

export const Dashboard: React.FC<DashboardProps> = ({ trips: allTrips, onReset }) => {
  const [activeTab, setActiveTab] = useState<TabType>('wrapped');
  const [selectedTariffKey, setSelectedTariffKey] = useState<string>('plana');
  
  const currentTariff = TARIFFS[selectedTariffKey];

  // Calculate date boundaries
  const { minDate, maxDate, availableYears } = useMemo(() => {
    if (allTrips.length === 0) return { minDate: '', maxDate: '', availableYears: [] };
    const sorted = [...allTrips].sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
    const min = getLocalYMD(sorted[0].startDate);
    const max = getLocalYMD(sorted[sorted.length - 1].startDate);
    
    const years = new Set(allTrips.map(t => t.startDate.getFullYear()));
    const distinctYears = Array.from(years).sort((a: number, b: number) => b - a);

    return { minDate: min, maxDate: max, availableYears: distinctYears };
  }, [allTrips]);

  const [filterStart, setFilterStart] = useState(minDate);
  const [filterEnd, setFilterEnd] = useState(maxDate);

  // Use Custom Hook for all the heavy lifting (Global Stats)
  const stats = useBicingStats(allTrips, filterStart, filterEnd, currentTariff, 'all');

  // Filter raw trips for the list view
  const filteredTrips = useMemo(() => {
    const s = new Date(filterStart);
    const e = new Date(filterEnd);
    e.setHours(23, 59, 59, 999);
    
    return allTrips.filter(t => t.startDate >= s && t.startDate <= e);
  }, [allTrips, filterStart, filterEnd]);

  if (allTrips.length === 0) return null;

  const elecPct = stats.totalTrips > 0 ? Math.round((stats.electricCount / stats.totalTrips) * 100) : 0;
  const mechPct = 100 - elecPct;

  return (
    <div className="w-full min-h-screen bg-gray-50 pb-20 animate-in fade-in duration-500 font-sans">
      
      {/* 1. STICKY APP HEADER */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40 shadow-sm transition-all">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-row items-center justify-between">
           
           {/* Branding */}
           <div className="flex items-center gap-3">
              <div className="bg-bicing text-white p-1.5 rounded-lg">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <h1 className="text-xl md:text-2xl font-black tracking-tighter text-gray-900 leading-none">
                BICING <span className="text-bicing">WRAPPED</span>
              </h1>
           </div>

           {/* Quick Actions */}
           <div className="flex items-center gap-4">
               <div className="hidden md:flex flex-col items-end mr-2">
                   <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Trajectes carregats</span>
                   <span className="text-xs font-bold text-gray-900 font-mono">{allTrips.length}</span>
               </div>
               <button 
                onClick={onReset} 
                className="bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 p-2 rounded-lg transition-colors"
                title="Carregar un altre fitxer"
               >
                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
               </button>
           </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        
        {/* 2. CONTROLS ROW (TABS + FILTER) */}
        <div className="flex flex-col-reverse lg:flex-row items-stretch lg:items-center justify-between gap-4 mb-8">
            
            <div className="flex flex-col md:flex-row gap-3 w-full lg:w-auto">
                {/* Navigation Tabs */}
                <div className="bg-white p-1.5 rounded-xl border border-gray-200 shadow-sm grid grid-cols-3 gap-1 w-full md:w-auto md:min-w-[320px]">
                    <button 
                    onClick={() => setActiveTab('wrapped')} 
                    className={`px-2 md:px-6 py-2 rounded-lg text-xs md:text-sm font-bold uppercase tracking-wide transition-all flex items-center justify-center gap-2 ${activeTab === 'wrapped' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
                    >
                    <span>🎁</span> <span className="hidden md:inline">Resum</span>
                    </button>
                    <button 
                    onClick={() => setActiveTab('evolution')} 
                    className={`px-2 md:px-6 py-2 rounded-lg text-xs md:text-sm font-bold uppercase tracking-wide transition-all flex items-center justify-center gap-2 ${activeTab === 'evolution' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
                    >
                    <span>📈</span> <span className="hidden md:inline">Hàbits</span>
                    </button>
                    <button 
                    onClick={() => setActiveTab('bikes')} 
                    className={`px-2 md:px-6 py-2 rounded-lg text-xs md:text-sm font-bold uppercase tracking-wide transition-all flex items-center justify-center gap-2 ${activeTab === 'bikes' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
                    >
                    <span>🚲</span> <span className="hidden md:inline">Flota</span>
                    </button>
                </div>

                {/* List Button */}
                <button 
                    onClick={() => setActiveTab('table')}
                    className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold uppercase tracking-wide transition-all flex items-center justify-center gap-2 border ${activeTab === 'table' ? 'bg-gray-800 text-white border-gray-800 shadow-md' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50 hover:shadow-sm'}`}
                >
                    <span>📋</span> <span className="hidden md:inline">Llistat</span>
                </button>
            </div>

            {/* Date Filters */}
            <div className="w-full lg:w-auto">
                 <FilterBar 
                    startDate={filterStart} 
                    endDate={filterEnd} 
                    minDate={minDate} 
                    maxDate={maxDate} 
                    availableYears={availableYears}
                    onStartDateChange={setFilterStart}
                    onEndDateChange={setFilterEnd}
                    className="w-full"
                  />
            </div>
        </div>

        {/* 3. MAIN CONTENT */}
        <div className="min-h-[500px]">
            {activeTab === 'wrapped' && (
            <WrappedView 
                stats={stats} 
                filteredTrips={filteredTrips} 
                elecPct={elecPct} 
                mechPct={mechPct} 
                selectedTariff={selectedTariffKey}
                tariffOptions={TARIFFS}
                onTariffChange={setSelectedTariffKey}
            />
            )}

            {activeTab === 'evolution' && (
            <EvolutionView 
              trips={allTrips}
              startDate={filterStart}
              endDate={filterEnd}
            />
            )}

            {activeTab === 'bikes' && (
            <BikesView stats={stats} />
            )}

            {activeTab === 'table' && (
            <TripsTableView trips={filteredTrips} tariff={currentTariff} />
            )}
        </div>

      </div>
    </div>
  );
};