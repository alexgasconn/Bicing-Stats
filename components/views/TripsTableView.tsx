import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { BicingTrip, TariffRules } from '../../types';
import bicingIds from '../../data/bicing_ids';

interface TripsTableViewProps {
  trips: BicingTrip[];
  tariff: TariffRules;
}

type SortKey = 'startDate' | 'endDate' | 'durationMinutes' | 'cost' | 'bikeId' | 'type';
type SortDirection = 'asc' | 'desc';

export const TripsTableView: React.FC<TripsTableViewProps> = ({ trips, tariff }) => {
  const [sortKey, setSortKey] = useState<SortKey>('startDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Logic to classify bike (Duplicated for view isolation, but matching hook logic)
  const mecSet = useMemo(() => new Set(bicingIds.mecaniques), []);
  const elecSet = useMemo(() => new Set(bicingIds.electriques), []);

  const getBikeType = (trip: BicingTrip) => {
    const cleanId = trip.bikeId.replace(/\D/g, '');
    const idNum = parseInt(cleanId) || 0;
    
    // 1. Known IDs
    if (elecSet.has(cleanId)) return 'Elèctrica';
    if (mecSet.has(cleanId)) return 'Mecànica';
    
    // 2. Heuristic: Cost > 0 & Duration <= 30 => Electric
    if (trip.cost > 0 && trip.durationMinutes <= 30) return 'Elèctrica';
    
    // 3. Fallback ID Ranges
    if (idNum >= 3000 && idNum < 4000) return 'Elèctrica';
    if (idNum >= 8000) return 'Elèctrica';
    
    return 'Mecànica';
  };

  // Logic to calculate COST based on CURRENT TARIFF
  const getCalculatedCost = (trip: BicingTrip) => {
    const type = getBikeType(trip);
    const duration = trip.durationMinutes;
    const isElec = type === 'Elèctrica';
    
    let cost = 0;
    
    // Base 30 min
    cost += isElec ? tariff.baseElec : tariff.baseMec;

    // 30m - 2h
    if (duration > 30) {
        const excess = Math.min(duration, 120) - 30;
        const blocks = Math.ceil(excess / 30);
        cost += blocks * (isElec ? tariff.midElec : tariff.midMec);
    }

    // > 2h
    if (duration > 120) {
        const excess = duration - 120;
        const blocks = Math.ceil(excess / 60);
        cost += blocks * tariff.maxPrice;
    }

    return cost;
  };

  const sortedTrips = useMemo(() => {
    return [...trips].sort((a, b) => {
      let valA: any = a[sortKey as keyof BicingTrip];
      let valB: any = b[sortKey as keyof BicingTrip];

      if (sortKey === 'cost') {
          valA = getCalculatedCost(a);
          valB = getCalculatedCost(b);
      }

      if (sortKey === 'type') {
         valA = getBikeType(a);
         valB = getBikeType(b);
      }

      if (valA instanceof Date) valA = valA.getTime();
      if (valB instanceof Date) valB = valB.getTime();

      if (sortKey === 'bikeId') {
          valA = parseInt(a.bikeId.replace(/\D/g, '')) || 0;
          valB = parseInt(b.bikeId.replace(/\D/g, '')) || 0;
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [trips, sortKey, sortDirection, tariff]); // Re-sort if tariff changes

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('desc');
    }
  };

  const handleExport = () => {
    const data = sortedTrips.map(t => ({
      'Data Inici': t.startDate.toLocaleString('ca-ES'),
      'Data Fi': t.endDate.toLocaleString('ca-ES'),
      'Durada (min)': t.durationMinutes,
      'Bici ID': t.bikeId,
      'Tipus': getBikeType(t),
      'Cost Calc. (€)': getCalculatedCost(t).toFixed(2),
      'Cost Original (€)': t.cost.toFixed(2)
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Viatges");
    XLSX.writeFile(wb, "bicing_viatges_calculats.xlsx");
  };

  const Arrow = () => (
     <span className="ml-1 text-gray-400 text-[10px]">{sortDirection === 'asc' ? '▲' : '▼'}</span>
  );

  return (
    <div className="animate-in slide-in-from-bottom-4 fade-in duration-500">
       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                📋 Llistat Complet de Viatges
                <span className="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded-full">{trips.length}</span>
            </h3>
            <p className="text-xs text-gray-500 mt-1">
                Calculant costos segons: <strong>{tariff.name}</strong>
            </p>
          </div>
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm shadow-sm w-full sm:w-auto justify-center"
          >
            <span>📥</span> Exportar Excel
          </button>
       </div>

       <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
             <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs border-b border-gray-200">
                   <tr>
                      <th className="p-4 cursor-pointer hover:bg-gray-100 transition-colors whitespace-nowrap" onClick={() => handleSort('startDate')}>
                        Data d'inici {sortKey === 'startDate' && <Arrow/>}
                      </th>
                      <th className="p-4 cursor-pointer hover:bg-gray-100 transition-colors whitespace-nowrap" onClick={() => handleSort('endDate')}>
                        Data de fi {sortKey === 'endDate' && <Arrow/>}
                      </th>
                       <th className="p-4 cursor-pointer hover:bg-gray-100 transition-colors text-right whitespace-nowrap" onClick={() => handleSort('durationMinutes')}>
                        Durada {sortKey === 'durationMinutes' && <Arrow/>}
                      </th>
                      <th className="p-4 cursor-pointer hover:bg-gray-100 transition-colors whitespace-nowrap" onClick={() => handleSort('bikeId')}>
                        Bici {sortKey === 'bikeId' && <Arrow/>}
                      </th>
                       <th className="p-4 cursor-pointer hover:bg-gray-100 transition-colors whitespace-nowrap" onClick={() => handleSort('type')}>
                        Tipus {sortKey === 'type' && <Arrow/>}
                      </th>
                      <th className="p-4 cursor-pointer hover:bg-gray-100 transition-colors text-right whitespace-nowrap" onClick={() => handleSort('cost')}>
                        Cost (Calc) {sortKey === 'cost' && <Arrow/>}
                      </th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                   {sortedTrips.map((trip) => {
                      const calculatedCost = getCalculatedCost(trip);
                      const type = getBikeType(trip);
                      const isElectric = type === 'Elèctrica';

                      return (
                      <tr key={trip.id} className="hover:bg-gray-50 transition-colors">
                         <td className="p-4 text-gray-900 font-mono whitespace-nowrap">
                            {trip.startDate.toLocaleString('ca-ES', { 
                                day: '2-digit', month: '2-digit', year: 'numeric', 
                                hour: '2-digit', minute: '2-digit' 
                            })}
                         </td>
                         <td className="p-4 text-gray-900 font-mono whitespace-nowrap">
                            {trip.endDate.toLocaleString('ca-ES', { 
                                day: '2-digit', month: '2-digit', year: 'numeric', 
                                hour: '2-digit', minute: '2-digit' 
                            })}
                         </td>
                         <td className="p-4 text-right font-bold text-gray-800 whitespace-nowrap flex items-center justify-end gap-2">
                            {trip.durationMinutes > 30 && <span title="Excés de temps (>30min)" className="text-base cursor-help">⚠️</span>}
                            {trip.durationMinutes} min
                         </td>
                          <td className="p-4 font-mono text-gray-600 whitespace-nowrap">
                            #{trip.bikeId}
                         </td>
                         <td className="p-4 whitespace-nowrap">
                            <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${isElectric ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                                {type}
                            </span>
                         </td>
                         <td className={`p-4 text-right whitespace-nowrap ${calculatedCost > 0 ? 'text-gray-900 font-bold' : 'text-gray-400'}`}>
                            {calculatedCost > 0 ? calculatedCost.toFixed(2) + '€' : '-'}
                         </td>
                      </tr>
                   )})}
                </tbody>
             </table>
          </div>
          {trips.length === 0 && (
             <div className="p-12 text-center text-gray-400">
                No hi ha viatges en aquest període.
             </div>
          )}
       </div>
    </div>
  );
};