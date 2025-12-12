import React, { useState, useMemo } from 'react';
import { BicingStats, BikeStat } from '../../types';
import { StatCard } from '../StatCard';
import { Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart } from 'recharts';
import bicingIds from '../../data/bicing_ids';

// Extend Stats type locally to include the new fields from the hook
interface ExtendedBicingStats extends BicingStats {
    idHistogram: { range: string; count: number; fullRange: string; binStart: number }[];
    generationStats: { name: string; count: number; color: string }[];
    achievements: { id: string; icon: string; title: string; desc: string; unlocked: boolean; progress?: string }[];
}

interface BikesViewProps {
  stats: ExtendedBicingStats;
}

const formatShortDate = (date: Date) => date.toLocaleDateString('ca-ES', { day: 'numeric', month: 'short', year: '2-digit' });
const formatFullDateTime = (date: Date) => date.toLocaleDateString('ca-ES', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

// --- SUB-COMPONENTS ---

// 1. Detailed Profile Modal (VITAMINADA)
const BikeProfile: React.FC<{ bike: BikeStat; stats: BicingStats; onClose: () => void }> = ({ bike, stats, onClose }) => {
    // Derived Stats
    const totalDaysSpan = Math.max(1, Math.round((bike.lastUsed.getTime() - bike.firstUsed.getTime()) / (1000 * 3600 * 24)));
    const avgDuration = Math.round(bike.minutes / bike.count);
    const idStr = bike.id.replace(/\D/g, '');
    const idNum = parseInt(idStr) || 0;
    
    // Global Comparison
    const diffGlobal = avgDuration - stats.averageTime;
    const speedText = diffGlobal > 0 ? `${diffGlobal}min més lenta` : `${Math.abs(diffGlobal)}min més ràpida`;
    const speedColor = diffGlobal > 0 ? 'text-red-500' : 'text-green-500';

    // Ranking
    const rankIndex = stats.topBikes.findIndex(b => b.id === bike.id);
    const rankDisplay = rankIndex > -1 ? `#${rankIndex + 1}` : 'NP';

    // Time of Day Analysis
    const timeOfDay = { morning: 0, afternoon: 0, night: 0, late: 0 };
    bike.trips.forEach(t => {
        const h = t.startDate.getHours();
        if (h >= 6 && h < 13) timeOfDay.morning++;
        else if (h >= 13 && h < 20) timeOfDay.afternoon++;
        else if (h >= 20 || h < 2) timeOfDay.night++;
        else timeOfDay.late++;
    });

    // Habits
    const hours = new Array(24).fill(0);
    const days = new Array(7).fill(0);
    bike.trips.forEach(t => {
        hours[t.startDate.getHours()]++;
        days[t.startDate.getDay()]++;
    });
    const maxHourVal = Math.max(...hours);
    const favHour = hours.indexOf(maxHourVal);
    const dayNames = ['Diumenge', 'Dilluns', 'Dimarts', 'Dimecres', 'Dijous', 'Divendres', 'Dissabte'];
    const maxDayVal = Math.max(...days);
    const favDay = dayNames[days.indexOf(maxDayVal)];

    // Estimate Generation (Using JSON first)
    const mecSet = new Set(bicingIds.mecaniques);
    const elecSet = new Set(bicingIds.electriques);
    
    let generation = "Desconeguda";
    let genColor = "bg-gray-100 text-gray-600";
    
    if (mecSet.has(idStr)) {
        generation = "Mecànica (Confirmada)";
        genColor = "bg-red-100 text-red-800";
    } else if (elecSet.has(idStr)) {
         if (idNum >= 8000) {
            generation = "Elèctrica (Nova Flota)";
            genColor = "bg-green-100 text-green-800";
         } else {
            generation = "Elèctrica (Confirmada)";
            genColor = "bg-yellow-100 text-yellow-800";
         }
    } else {
        // Fallback Logic
        if (idNum > 0 && idNum < 3000) { generation = "Mecànica (Probable)"; genColor = "bg-red-50 text-red-600"; }
        else if (idNum >= 3000 && idNum < 8000) { generation = "Elèctrica (Clàssica?)"; genColor = "bg-yellow-50 text-yellow-600"; }
        else if (idNum >= 8000) { generation = "Elèctrica (Nova?)"; genColor = "bg-green-50 text-green-600"; }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl border-t-8 border-bicing w-full max-w-5xl max-h-[95vh] overflow-y-auto animate-in zoom-in-95 duration-300 flex flex-col md:flex-row overflow-hidden">
                
                {/* Left Sidebar: ID & Identity */}
                <div className="w-full md:w-1/3 bg-gray-50 p-6 md:p-8 border-b md:border-b-0 md:border-r border-gray-200 flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-start mb-6">
                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide border ${genColor} bg-white`}>
                                {generation}
                            </span>
                             <button onClick={onClose} className="md:hidden text-gray-400 p-1">
                                ✕
                            </button>
                        </div>
                        
                        <div className="text-center mb-8">
                             <h2 className="text-6xl font-black text-gray-900 font-mono tracking-tighter mb-2">
                                <span className="text-2xl text-gray-400 align-top mr-1">#</span>{bike.id}
                            </h2>
                            <div className="inline-block bg-white border border-gray-200 rounded-full px-4 py-1 text-sm font-bold text-gray-600 shadow-sm">
                                🏆 Rànquing: <span className="text-bicing">{rankDisplay}</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                <div className="text-xs text-gray-400 uppercase font-bold mb-1">Total Viatges</div>
                                <div className="text-3xl font-black text-gray-900">{bike.count}</div>
                            </div>
                            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                <div className="text-xs text-gray-400 uppercase font-bold mb-1">Temps Total</div>
                                <div className="text-3xl font-black text-gray-900">{bike.minutes} <span className="text-sm font-normal text-gray-500">min</span></div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 text-xs text-gray-400 text-center">
                        Detectada per primer cop: <br/>
                        <span className="font-mono font-bold text-gray-600">{formatShortDate(bike.firstUsed)}</span>
                    </div>
                </div>

                {/* Right Content: Stats & details */}
                <div className="flex-1 p-6 md:p-8 overflow-y-auto">
                    <div className="flex justify-between items-center mb-6">
                         <h3 className="text-xl font-bold text-gray-900">Anàlisi de Rendiment</h3>
                         <button onClick={onClose} className="hidden md:block text-gray-400 hover:text-gray-900 transition-colors bg-gray-100 hover:bg-gray-200 rounded-full p-2">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>

                    {/* Row 1: Comparison & Habits */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                         {/* Avg Duration Card */}
                        <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                             <div className="text-xs font-bold text-blue-800 uppercase mb-2">Ritme mitjà</div>
                             <div className="flex items-end gap-2">
                                 <span className="text-3xl font-black text-blue-900">{avgDuration}m</span>
                                 <span className={`text-xs font-bold mb-1 ${speedColor}`}>
                                     ({speedText} que la mitjana)
                                 </span>
                             </div>
                             <div className="w-full bg-blue-200 h-1.5 rounded-full mt-3 overflow-hidden">
                                 <div className="bg-blue-600 h-full" style={{width: `${Math.min(100, (avgDuration / 30) * 100)}%`}}></div>
                             </div>
                        </div>

                        {/* Favs */}
                        <div className="p-4 bg-orange-50 rounded-xl border border-orange-100 flex flex-col justify-center">
                             <div className="flex justify-between items-center border-b border-orange-100 pb-2 mb-2">
                                 <span className="text-xs font-bold text-orange-800 uppercase">Dia Preferit</span>
                                 <span className="font-bold text-orange-900">{favDay}</span>
                             </div>
                             <div className="flex justify-between items-center">
                                 <span className="text-xs font-bold text-orange-800 uppercase">Hora Punta</span>
                                 <span className="font-bold text-orange-900">{favHour}:00h</span>
                             </div>
                        </div>
                    </div>

                    {/* Row 2: Time of Day Distribution */}
                    <div className="mb-8">
                        <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Moment del dia</h4>
                        <div className="flex h-8 rounded-lg overflow-hidden w-full font-bold text-[10px] text-white text-center leading-8 shadow-sm">
                            {timeOfDay.morning > 0 && <div style={{flex: timeOfDay.morning}} className="bg-yellow-400 text-yellow-900" title="Matí (6-13)">MATÍ</div>}
                            {timeOfDay.afternoon > 0 && <div style={{flex: timeOfDay.afternoon}} className="bg-orange-400" title="Tarda (13-20)">TARDA</div>}
                            {timeOfDay.night > 0 && <div style={{flex: timeOfDay.night}} className="bg-indigo-900" title="Nit (20-02)">NIT</div>}
                            {timeOfDay.late > 0 && <div style={{flex: timeOfDay.late}} className="bg-gray-800" title="Matinada (02-06)">LATE</div>}
                        </div>
                        <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                            <span>6:00</span>
                            <span>13:00</span>
                            <span>20:00</span>
                            <span>02:00</span>
                        </div>
                    </div>
                    
                    {/* Row 3: Trip Log */}
                    <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Historial de Viatges</h4>
                        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-inner max-h-48 overflow-y-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-200 sticky top-0">
                                    <tr>
                                        <th className="p-3">Data</th>
                                        <th className="p-3 text-right">Hora</th>
                                        <th className="p-3 text-right">Minuts</th>
                                        <th className="p-3 text-right">Cost</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {bike.trips.map((trip, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                            <td className="p-3 font-mono text-gray-600">{trip.startDate.toLocaleDateString()}</td>
                                            <td className="p-3 text-right text-gray-500">{trip.startDate.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</td>
                                            <td className="p-3 text-right font-bold text-gray-800">{trip.durationMinutes}'</td>
                                            <td className="p-3 text-right text-gray-500">
                                                {trip.cost > 0 ? (
                                                    <span className="font-bold text-red-600">{trip.cost.toFixed(2)}€</span>
                                                ) : (
                                                    <span className="text-gray-300">-</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

// 2. Fleet Matrix Modal (NUMERIC)
const FleetMatrixModal: React.FC<{ stats: BicingStats; onClose: () => void }> = ({ stats, onClose }) => {
    // State: { level: 100(thousands) | 10(hundreds) | 1(units), focus: number(start of range) }
    const [viewState, setViewState] = useState<{ level: 100 | 10 | 1; focus: number }>({ level: 100, focus: 0 });
    
    const maxSeen = stats.maxBikeId;
    const maxCeiling = Math.ceil((maxSeen + 100) / 1000) * 1000;

    const bikeMap = useMemo(() => {
        const map = new Map<number, number>();
        stats.allBikes.forEach(b => {
            const id = parseInt(b.id);
            if (!isNaN(id)) map.set(id, b.count);
        });
        return map;
    }, [stats.allBikes]);

    // Level 100: Thousands
    const renderThousands = () => {
        const blocks = [];
        const numThousands = Math.ceil(maxCeiling / 1000);

        for (let k = 0; k < numThousands; k++) {
            const startId = k * 1000;
            const endId = startId + 999;
            let found = 0;
            for(let i=startId; i<=endId; i++) if(bikeMap.has(i)) found++;
            const percent = ((found / 1000) * 100).toFixed(1);
            
            let bgClass = "bg-gray-50 text-gray-400";
            if (found > 0) bgClass = "bg-red-50 text-red-800 border-red-200";
            if (found > 100) bgClass = "bg-red-100 text-red-900 border-red-300";
            if (found > 300) bgClass = "bg-red-200 text-bicing border-red-400";
            if (found > 500) bgClass = "bg-bicing text-white border-red-700";

            blocks.push(
                <div key={k} onClick={() => setViewState({ level: 10, focus: startId })} className={`aspect-[3/2] rounded-xl border-2 flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-105 hover:shadow-lg relative overflow-hidden group ${bgClass} ${found === 0 ? 'border-dashed border-gray-200 hover:border-gray-300' : ''}`}>
                    <div className="text-2xl font-black mb-1">{k}k</div>
                    <div className="text-xs font-mono font-bold opacity-80">{startId}-{endId}</div>
                    {found > 0 && <div className="absolute top-2 right-2 text-[10px] font-bold bg-white/20 backdrop-blur px-1.5 rounded">{percent}%</div>}
                    <div className="mt-2 text-xs font-medium">{found} trobades</div>
                </div>
            );
        }
        return <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in">{blocks}</div>;
    };

    // Level 10: Hundreds
    const renderHundreds = () => {
        const thousandStart = viewState.focus;
        const blocks = [];
        for (let h = 0; h < 10; h++) {
            const startId = thousandStart + (h * 100);
            let found = 0;
            for(let i=startId; i<=startId+99; i++) if(bikeMap.has(i)) found++;
            
            let bgClass = "bg-gray-50 text-gray-400";
            if (found > 0) bgClass = "bg-red-50 text-red-800 border-red-100";
            if (found > 10) bgClass = "bg-red-200 text-red-900 border-red-300";
            if (found > 30) bgClass = "bg-bicing text-white border-red-600";

            blocks.push(
                <div key={h} onClick={() => setViewState({ level: 1, focus: startId })} className={`p-4 rounded-xl border flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-105 relative group ${bgClass} ${found === 0 ? 'border-dashed border-gray-200' : ''}`}>
                    <div className="text-xl font-black">{startId}</div>
                    <div className="text-[10px] font-mono uppercase opacity-70">Sèrie</div>
                    <div className="mt-2 text-xs font-bold">{found}/100</div>
                </div>
            );
        }
        return <div className="grid grid-cols-2 md:grid-cols-5 gap-4 animate-in fade-in">{blocks}</div>;
    };

    // Level 1: Units
    const renderUnits = () => {
        const hundredStart = viewState.focus;
        const cells = [];
        for (let u = 0; u < 100; u++) {
            const id = hundredStart + u;
            const count = bikeMap.get(id) || 0;
            let cellClass = "bg-gray-100 text-gray-300 scale-90";
            if (count > 0) {
                cellClass = "shadow-sm text-white font-bold hover:scale-125 hover:z-10";
                if (count === 1) cellClass += " bg-red-300";
                else if (count <= 5) cellClass += " bg-red-500";
                else cellClass += " bg-bicing";
            }
            cells.push(
                <div key={id} className={`aspect-square rounded flex items-center justify-center text-[10px] transition-all cursor-default relative group ${cellClass}`}>
                    {u.toString().padStart(2, '0')}
                    {count > 0 && <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-2 bg-black text-white text-xs py-1 px-2 rounded z-50 whitespace-nowrap">#{id} ({count}v)</div>}
                </div>
            );
        }
        return (
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 animate-in fade-in">
                <h3 className="text-xl font-bold mb-4">Sèrie {hundredStart} - {hundredStart + 99}</h3>
                <div className="grid grid-cols-10 gap-1">{cells}</div>
             </div>
        )
    };

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-gray-50 animate-in fade-in duration-200">
            <div className="bg-white border-b border-gray-200 p-4 shadow-md z-20 sticky top-0 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">✕</button>
                    <div className="flex items-center gap-2 text-sm">
                        <button onClick={() => setViewState({level: 100, focus: 0})} className={`font-bold ${viewState.level === 100 ? 'text-black cursor-default' : 'text-bicing hover:underline'}`}>Total</button>
                        {viewState.level < 100 && <><span className="text-gray-300">/</span><button onClick={() => setViewState({level: 10, focus: Math.floor(viewState.focus / 1000) * 1000})} className={`font-bold ${viewState.level === 10 ? 'text-black' : 'text-bicing hover:underline'}`}>{Math.floor(viewState.focus / 1000)}000s</button></>}
                        {viewState.level === 1 && <><span className="text-gray-300">/</span><span className="font-bold text-black">{viewState.focus}s</span></>}
                    </div>
                </div>
                <div className="text-xs text-gray-500 font-mono hidden md:block">{stats.uniqueBikes} úniques</div>
            </div>
            <div className="flex-1 overflow-auto bg-gray-50 p-4 md:p-8">
                <div className="max-w-6xl mx-auto">
                    {viewState.level === 100 && renderThousands()}
                    {viewState.level === 10 && renderHundreds()}
                    {viewState.level === 1 && renderUnits()}
                </div>
            </div>
        </div>
    );
};


// --- MAIN VIEW ---

export const BikesView: React.FC<BikesViewProps> = ({ stats }) => {
  const [searchId, setSearchId] = useState('');
  const [selectedBike, setSelectedBike] = useState<BikeStat | null>(null);
  const [showMatrix, setShowMatrix] = useState(false);

  // Lists for Oldest/Newest (filtered to ensure valid IDs)
  const validBikes = stats.allBikes.filter(b => parseInt(b.id) > 0);
  const oldestBikes = validBikes.slice(0, 5);
  const newestBikes = validBikes.slice(-5).reverse();
  const coveragePercent = ((stats.uniqueBikes / Math.max(1, stats.maxBikeId)) * 100).toFixed(1);

  const handleSearch = (e: React.FormEvent) => {
      e.preventDefault();
      const bike = stats.allBikes.find(b => b.id === searchId || b.id === `#${searchId}`);
      if (bike) {
          setSelectedBike(bike);
      } else {
          alert(`No s'ha trobat cap bici amb l'ID #${searchId} al teu historial.`);
      }
  };

  return (
    <div className="animate-in slide-in-from-bottom-4 fade-in duration-500 space-y-6">
      
      {/* 1. ROW: Action Bar (Search + Map Button) - 50/50 Split */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Col 1: Search Form */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                  <span className="text-2xl">🔎</span>
                  <div className="leading-tight">
                    <h2 className="text-sm font-bold text-gray-900">Busca Bici</h2>
                    <p className="text-[10px] text-gray-400">Consulta historial</p>
                  </div>
              </div>
              <form onSubmit={handleSearch} className="flex gap-2">
                  <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-xs">#</span>
                      <input 
                        type="number" 
                        value={searchId} 
                        onChange={(e) => setSearchId(e.target.value)} 
                        placeholder="1234" 
                        className="pl-5 pr-2 py-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 focus:outline-none focus:border-bicing focus:ring-1 focus:ring-bicing font-mono text-sm w-24 md:w-32 transition-all" 
                      />
                  </div>
                  <button type="submit" className="bg-gray-900 hover:bg-black text-white font-bold py-2 px-3 rounded-lg transition-colors text-xs">GO</button>
              </form>
          </div>

          {/* Col 2: Map Button */}
          <div 
            onClick={() => setShowMatrix(true)} 
            className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl p-4 shadow-sm border border-gray-700 flex items-center justify-between text-white cursor-pointer hover:shadow-lg transition-all group"
          >
                <div className="flex items-center gap-3">
                    <div className="bg-white/10 p-2 rounded-lg group-hover:scale-110 transition-transform">🗺️</div>
                    <div className="leading-tight">
                        <h3 className="font-bold text-sm">Mapa de Cobertura</h3>
                        <p className="text-[10px] text-gray-400 group-hover:text-white transition-colors">{stats.uniqueBikes} bicis úniques</p>
                    </div>
                </div>
                <div className="bg-white text-gray-900 text-xs font-bold py-2 px-3 rounded-lg group-hover:bg-gray-100 transition-colors">
                    Obrir
                </div>
          </div>
      </div>

      {/* 2. Quick Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Bicis Úniques</span>
              <span className="text-2xl font-black text-gray-900">{stats.uniqueBikes}</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Cobertura</span>
              <span className="text-2xl font-black text-bicing">{coveragePercent}%</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">ID Més Alt</span>
              <span className="text-2xl font-black text-gray-900">#{stats.maxBikeId}</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Repetides</span>
              <span className="text-2xl font-black text-gray-900">{stats.repeatedBikes}</span>
          </div>
      </div>

      {/* MODALS */}
      {selectedBike && <BikeProfile bike={selectedBike} stats={stats} onClose={() => setSelectedBike(null)} />}
      {showMatrix && <FleetMatrixModal stats={stats} onClose={() => setShowMatrix(false)} />}


      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 3. ID Distribution */}
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-6">📊 Distribució per Sèries</h3>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.idHistogram}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="range" tick={{fontSize: 10}} interval={2} />
                            <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'}} />
                            <Bar dataKey="count" name="Viatges" fill="#D6001C" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* 4. Top Bikes Podium */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col">
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">🏆 Les teves preferides</h3>
                <div className="flex-1 overflow-y-auto pr-2 max-h-64 space-y-3">
                    {stats.topBikes.slice(0, 20).map((bike, index) => (
                        <div key={bike.id} onClick={() => setSelectedBike(bike)} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg cursor-pointer group transition-colors">
                            <div className="flex items-center gap-3">
                                <div className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${index < 3 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'}`}>{index + 1}</div>
                                <span className="font-mono font-bold text-gray-700 group-hover:text-bicing">#{bike.id}</span>
                            </div>
                            <div className="text-sm font-bold text-gray-900">{bike.count} <span className="text-gray-400 font-normal text-xs">viatges</span></div>
                        </div>
                    ))}
                </div>
            </div>
      </div>

      {/* 5. Oldest vs Newest */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-green-50 p-6 rounded-2xl border border-green-100">
                <h3 className="text-green-800 font-bold mb-4 flex items-center gap-2">✨ Top 5 Més Noves</h3>
                <div className="space-y-2">
                    {newestBikes.map((bike) => (
                         <div key={bike.id} onClick={() => setSelectedBike(bike)} className="flex justify-between items-center bg-white/60 p-2 rounded cursor-pointer hover:bg-white transition-colors">
                            <span className="font-mono font-bold text-green-900">#{bike.id}</span>
                            <span className="text-xs text-green-700">{formatShortDate(bike.firstUsed)}</span>
                         </div>
                    ))}
                </div>
            </div>
             <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100">
                <h3 className="text-orange-800 font-bold mb-4 flex items-center gap-2">🦕 Top 5 Més Antigues</h3>
                <div className="space-y-2">
                    {oldestBikes.map((bike) => (
                         <div key={bike.id} onClick={() => setSelectedBike(bike)} className="flex justify-between items-center bg-white/60 p-2 rounded cursor-pointer hover:bg-white transition-colors">
                            <span className="font-mono font-bold text-orange-900">#{bike.id}</span>
                            <span className="text-xs text-orange-700">{formatShortDate(bike.firstUsed)}</span>
                         </div>
                    ))}
                </div>
            </div>
      </div>

    </div>
  );
};