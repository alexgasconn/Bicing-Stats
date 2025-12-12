import { useMemo } from 'react';
import { BicingTrip, BicingStats, BikeStat, DayStat, DestinyBike } from '../types';
import bicingIds from '../data/bicing_ids';

// Helpers
const getLocalYMD = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const getLocalYM = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
};

const formatDateCA = (date: Date) => {
  return date.toLocaleDateString('ca-ES', { day: 'numeric', month: 'long', year: 'numeric' });
};

const formatShortDate = (date: Date) => {
  return date.toLocaleDateString('ca-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

interface TariffInfo {
    price: number;
    name: string;
}

export const useBicingStats = (
    trips: BicingTrip[], 
    filterStart: string, 
    filterEnd: string,
    tariff: TariffInfo,
    bikeType: 'all' | 'mecanica' | 'electrica' = 'all'
): BicingStats & { 
    idHistogram: { range: string; count: number; fullRange: string; binStart: number }[];
    generationStats: { name: string; count: number; color: string }[];
    achievements: { id: string; icon: string; title: string; desc: string; unlocked: boolean; progress?: string }[];
} => {

    return useMemo(() => {
        // 0. Prepare Lookup Sets for O(1) access
        const mecSet = new Set(bicingIds.mecaniques);
        const elecSet = new Set(bicingIds.electriques);

        // 1. Filter trips
        const [sY, sM, sD] = filterStart.split('-').map(Number);
        const [eY, eM, eD] = filterEnd.split('-').map(Number);
        
        const start = new Date(sY, sM - 1, sD, 0, 0, 0);
        const end = new Date(eY, eM - 1, eD, 23, 59, 59, 999);
    
        const filteredTrips = trips.filter(t => t.startDate >= start && t.startDate <= end);

        // 2. Initialize counters
        let totalTrips = 0; // Calculated in loop now due to type filter
        
        // Aggregation Containers
        const bikeUsage: Record<string, { count: number, minutes: number, usageDates: Date[], trips: BicingTrip[] }> = {};
        const hourCounts: Record<string, number> = {};
        const dayNameCounts: Record<string, number> = {};
        const dailyCounts: Record<string, number> = {};
        const weeklyCounts: Record<string, number> = {};
        const monthlyCounts: Record<string, number> = {};
        const yearlyCounts: Record<string, number> = {};
        
        const monthlyIdSums: Record<string, { sum: number, count: number }> = {};
        const uniqueYears = new Set<number>();
        const monthCounts = Array(12).fill(0); 
    
        let electricCount = 0;
        let mechanicalCount = 0;
        let maxBikeId = 0;
        let minBikeId = 999999;
        
        let adjustedTotalCost = 0;
        let totalMinutes = 0;

        // Histograms
        const HISTOGRAM_BIN_SIZE = 500;
        const idHistogramMap = new Map<number, number>();
        
        // Generations
        let genMec = 0; 
        let genElecOld = 0; 
        let genElecNew = 0;
        
        const heatmap = Array.from({ length: 7 }, () => Array(24).fill(0));
        const dayNames = ['Diumenge', 'Dilluns', 'Dimarts', 'Dimecres', 'Dijous', 'Divendres', 'Dissabte'];
        const monthNames = ['Gen', 'Feb', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Des'];
        
        // Temp array to store trips that pass the type filter for "Longest Trips" etc
        const finalProcessedTrips: BicingTrip[] = [];
    
        // 3. Main Loop
        filteredTrips.forEach(t => {
            const bikeIdClean = t.bikeId.replace(/\D/g, '');
            const idNum = parseInt(bikeIdClean) || 0;

            // --- TYPE DETECTION LOGIC ---
            // Priority: 1. JSON List, 2. Cost > 0, 3. ID Heuristic
            let isElectric = false;
            
            if (elecSet.has(bikeIdClean)) {
                isElectric = true;
            } else if (mecSet.has(bikeIdClean)) {
                isElectric = false;
            } else {
                // Fallback Logic
                if (t.cost > 0) isElectric = true;
                else if (idNum >= 3000 && idNum < 4000) isElectric = true; // Classic range for old electrics
                else if (idNum >= 8000) isElectric = true; // New fleet electrics mostly high IDs
                else isElectric = false; // Default to mechanical
            }

            // --- FILTER BY TYPE ---
            if (bikeType === 'electrica' && !isElectric) return;
            if (bikeType === 'mecanica' && isElectric) return;
            
            // If we are here, the trip is valid for the current view
            totalTrips++;
            finalProcessedTrips.push(t);
            totalMinutes += t.durationMinutes;

            // --- COST ADJUSTMENT LOGIC ---
            // If it's electric and cost is 0, assumes 0.35€ (per user request)
            let tripCost = t.cost;
            if (isElectric) {
                electricCount++;
                if (tripCost === 0) tripCost = 0.35; 
            } else {
                mechanicalCount++;
            }
            adjustedTotalCost += tripCost;

            const year = t.startDate.getFullYear();
            uniqueYears.add(year);
            const yearKey = year.toString();
            yearlyCounts[yearKey] = (yearlyCounts[yearKey] || 0) + 1;
            
            monthCounts[t.startDate.getMonth()]++;
    
            if (idNum > 0) {
                if (idNum > maxBikeId) maxBikeId = idNum;
                if (idNum < minBikeId) minBikeId = idNum;

                // Histogram
                const bin = Math.floor(idNum / HISTOGRAM_BIN_SIZE) * HISTOGRAM_BIN_SIZE;
                idHistogramMap.set(bin, (idHistogramMap.get(bin) || 0) + 1);

                // Generation Logic Updated with strict detection
                if (isElectric) {
                    if (idNum < 8000) genElecOld++;
                    else genElecNew++;
                } else {
                    genMec++;
                }
            }

            // Bike Stats
            if (!bikeUsage[t.bikeId]) {
                bikeUsage[t.bikeId] = { count: 0, minutes: 0, usageDates: [], trips: [] };
            }
            bikeUsage[t.bikeId].count++;
            bikeUsage[t.bikeId].minutes += t.durationMinutes;
            bikeUsage[t.bikeId].usageDates.push(t.startDate);
            bikeUsage[t.bikeId].trips.push({
                ...t,
                cost: tripCost // Store the adjusted cost in the bike history too
            });
    
            const d = t.startDate;
            const hour = d.getHours();
            const dayIdx = d.getDay(); 
            
            const hourStr = hour.toString().padStart(2, '0') + 'h';
            hourCounts[hourStr] = (hourCounts[hourStr] || 0) + 1;
            
            const dayName = dayNames[dayIdx];
            dayNameCounts[dayName] = (dayNameCounts[dayName] || 0) + 1;
    
            const heatmapRow = (dayIdx + 6) % 7; 
            heatmap[heatmapRow][hour]++;
            
            const dateKey = getLocalYMD(d);
            dailyCounts[dateKey] = (dailyCounts[dateKey] || 0) + 1;
            
            const monthKey = getLocalYM(d);
            monthlyCounts[monthKey] = (monthlyCounts[monthKey] || 0) + 1;

            if (idNum > 0) {
                if (!monthlyIdSums[monthKey]) monthlyIdSums[monthKey] = { sum: 0, count: 0 };
                monthlyIdSums[monthKey].sum += idNum;
                monthlyIdSums[monthKey].count += 1;
            }
    
            const onejan = new Date(d.getFullYear(), 0, 1);
            const weekNum = Math.ceil((((d.getTime() - onejan.getTime()) / 86400000) + onejan.getDay() + 1) / 7);
            const weekKey = `${d.getFullYear()}-W${weekNum.toString().padStart(2, '0')}`;
            weeklyCounts[weekKey] = (weeklyCounts[weekKey] || 0) + 1;
        });
        
        if (minBikeId === 999999) minBikeId = 0;
    
        // 4. Chart Data Filling
        const tripsByDate = [];
        const currentD = new Date(sY, sM - 1, sD);
        const endD = new Date(eY, eM - 1, eD);
    
        while (currentD <= endD) {
           const key = getLocalYMD(currentD);
           tripsByDate.push({
             date: formatShortDate(currentD),
             isoDate: key,
             timestamp: currentD.getTime(),
             count: dailyCounts[key] || 0
           });
           currentD.setDate(currentD.getDate() + 1);
        }
    
        const tripsByMonth = [];
        const avgIdByMonthRaw = []; // Temporary array

        const currentM = new Date(sY, sM - 1, 1);
        const endM = new Date(eY, eM - 1, 1);
        
        while (currentM <= endM) {
           const key = getLocalYM(currentM);
           let label = currentM.toLocaleDateString('ca-ES', { month: 'short', year: '2-digit' });
           label = label.charAt(0).toUpperCase() + label.slice(1);
           tripsByMonth.push({ month: key, label: label, count: monthlyCounts[key] || 0 });

           const mData = monthlyIdSums[key];
           avgIdByMonthRaw.push({
             month: key,
             label: label,
             avgId: mData ? Math.round(mData.sum / mData.count) : 0,
             count: mData ? mData.count : 0
           });

           currentM.setMonth(currentM.getMonth() + 1);
        }

        // Filter out months with 0 trips for the Evolution chart to avoid drop-to-zero lines
        const avgIdByMonth = avgIdByMonthRaw.filter(d => d.count > 0);
    
        const tripsByWeek = Object.keys(weeklyCounts).sort().map(w => ({ week: w, label: w, count: weeklyCounts[w] }));
        const tripsByYear = Object.entries(yearlyCounts)
            .map(([year, count]) => ({ year, count }))
            .sort((a, b) => parseInt(a.year) - parseInt(b.year));
        const tripsByMonthName = monthNames.map((name, i) => ({ month: name, count: monthCounts[i] }));
    
        // 5. Bike Analysis
        const bikeList: BikeStat[] = [];
        const destinyBikes: DestinyBike[] = [];

        Object.entries(bikeUsage).forEach(([id, data]) => {
             const idNum = parseInt(id.replace(/\D/g, '')) || 0;
             let range: 'old' | 'mid' | 'new' = 'mid';
             if (idNum < 3000) range = 'old';
             if (idNum >= 8000) range = 'new'; // Updated range logic

             const dates = data.usageDates.sort((a, b) => a.getTime() - b.getTime());

             bikeList.push({
                 id,
                 count: data.count,
                 minutes: data.minutes,
                 usageDates: dates,
                 trips: data.trips.sort((a,b) => b.startDate.getTime() - a.startDate.getTime()), // sort trips desc
                 firstUsed: dates[0],
                 lastUsed: dates[dates.length - 1],
                 range
             });

             if (dates.length > 1) {
                 let maxGap = 0;
                 let dateA = dates[0];
                 let dateB = dates[1];

                 for(let i=0; i < dates.length - 1; i++) {
                     const diff = dates[i+1].getTime() - dates[i].getTime();
                     const diffDays = diff / (1000 * 3600 * 24);
                     if (diffDays > maxGap) {
                         maxGap = diffDays;
                         dateA = dates[i];
                         dateB = dates[i+1];
                     }
                 }
                 
                 if (maxGap > 30) {
                     destinyBikes.push({
                         id,
                         gapDays: Math.round(maxGap),
                         dateA,
                         dateB,
                         totalUses: data.count
                     });
                 }
             }
        });

        // Sort by Count (Popularity)
        const topBikes = [...bikeList].sort((a, b) => b.count - a.count).slice(0, 50);
        // Sort by ID (to return all)
        const allBikes = [...bikeList].sort((a, b) => (parseInt(a.id)||0) - (parseInt(b.id)||0));

        const sortedDestinyBikes = destinyBikes.sort((a, b) => b.gapDays - a.gapDays).slice(0, 20);
        const uniqueBikes = bikeList.length;
        const repeatedBikes = bikeList.filter(b => b.count > 1).length;
    
        const getBusiest = (record: Record<string, number>) => {
            let maxKey = '-'; let maxVal = 0;
            Object.entries(record).forEach(([k, v]) => { if (v > maxVal) { maxVal = v; maxKey = k; } });
            return maxKey;
        };
        const busiestHour = getBusiest(hourCounts);
        const busiestWeekday = getBusiest(dayNameCounts);
    
        const tripsByHour = Array.from({length: 24}, (_, i) => {
            const h = i.toString().padStart(2, '0') + 'h';
            return { hour: h, count: hourCounts[h] || 0 };
        });
    
        const orderedDays = ['Dilluns', 'Dimarts', 'Dimecres', 'Dijous', 'Divendres', 'Dissabte', 'Diumenge'];
        const tripsByDay = orderedDays.map(day => ({
          day: day.substring(0, 3),
          fullDay: day,
          count: dayNameCounts[day] || 0
        }));
    
        const uniqueDates = Object.keys(dailyCounts).sort();
        let maxStreak = 0;
        let currentStreak = 0;
        let prevDate: Date | null = null;
        uniqueDates.forEach(dStr => {
          const [y, m, dNum] = dStr.split('-').map(Number);
          const d = new Date(y, m - 1, dNum);
          if (!prevDate) {
            currentStreak = 1;
          } else {
            const diffTime = d.getTime() - prevDate.getTime();
            const diffDays = Math.round(diffTime / (1000 * 3600 * 24));
            if (diffDays === 1) currentStreak++; else currentStreak = 1;
          }
          if (currentStreak > maxStreak) maxStreak = currentStreak;
          prevDate = d;
        });
    
        const topDays: DayStat[] = Object.entries(dailyCounts)
          .map(([dateKey, count]) => {
            const [y, m, dNum] = dateKey.split('-').map(Number);
            return { date: dateKey, formattedDate: formatDateCA(new Date(y, m-1, dNum)), count };
          })
          .sort((a, b) => b.count - a.count).slice(0, 50);
    
        const longestTrips = [...finalProcessedTrips]
          .sort((a, b) => b.durationMinutes - a.durationMinutes).slice(0, 50);
    
        const subscriptionBase = tariff.price;
        const yearsPaid = uniqueYears.size || 1; 
        const totalSubscriptionCost = subscriptionBase * yearsPaid;
        
        const averageTime = totalTrips > 0 ? Math.round(totalMinutes / totalTrips) : 0;
        const estimatedDistanceKm = totalMinutes / 5;
        const co2SavedKg = estimatedDistanceKm * 0.12;
        
        // Use ADJUSTED cost for the final calculation
        const avgCostPerTripIncludingSub = totalTrips > 0 ? (adjustedTotalCost + totalSubscriptionCost) / totalTrips : 0;
        
        // Prepare ID Histogram Data
        const idHistogram = Array.from(idHistogramMap.entries())
            .map(([bin, count]) => ({
                range: `${(bin/1000).toFixed(1)}k`, 
                fullRange: `${bin} - ${bin + HISTOGRAM_BIN_SIZE - 1}`,
                binStart: bin,
                count
            }))
            .sort((a,b) => a.binStart - b.binStart);

        // Prepare Generation Stats
        const generationStats = [
            { name: "Mecàniques (Originals)", count: genMec, color: "#991b1b" }, 
            { name: "Elèctriques (Clàssiques)", count: genElecOld, color: "#ca8a04" }, 
            { name: "Elèctriques (Nova Flota)", count: genElecNew, color: "#16a34a" }, 
        ];

        // Achievements Logic
        const achievements = [
            { 
                id: 'explorer', 
                icon: '🌍', 
                title: 'Explorador', 
                desc: 'Utilitzar 50 bicis diferents', 
                unlocked: uniqueBikes >= 50,
                progress: `${Math.min(uniqueBikes, 50)}/50`
            },
            { 
                id: 'veteran', 
                icon: '🦖', 
                title: 'Veterà', 
                desc: 'Trobar una bici < ID 1000', 
                unlocked: minBikeId > 0 && minBikeId < 1000,
                progress: minBikeId > 0 && minBikeId < 1000 ? 'Trobat' : 'Pendent'
            },
            { 
                id: 'futurist', 
                icon: '⚡', 
                title: 'Futurista', 
                desc: 'Provar la nova flota (IDs +8000)', 
                unlocked: genElecNew > 0,
                progress: genElecNew > 0 ? 'Desbloquejat' : 'Pendent'
            },
            { 
                id: 'loyal', 
                icon: '🐕', 
                title: 'Fidel', 
                desc: 'Repetir bici 10+ vegades', 
                unlocked: repeatedBikes > 10,
                progress: `${Math.min(repeatedBikes, 10)}/10`
            },
            { 
                id: 'marathon', 
                icon: '🏃', 
                title: 'Marató', 
                desc: 'Un viatge > 45 minuts', 
                unlocked: longestTrips.length > 0 && longestTrips[0].durationMinutes >= 45,
                progress: longestTrips.length > 0 ? `${longestTrips[0].durationMinutes}m / 45m` : '0m'
            },
            { 
                id: 'nightowl', 
                icon: '🦉', 
                title: 'Nocturn', 
                desc: 'Viatjar de matinada (0-5h)', 
                unlocked: tripsByHour.slice(0, 5).some(h => h.count > 0),
                progress: tripsByHour.slice(0, 5).reduce((acc, curr) => acc + curr.count, 0) > 0 ? 'Sí' : 'Mai'
            },
        ];

        return {
          totalTrips, totalMinutes, 
          totalCost: adjustedTotalCost, // Return the adjusted cost
          uniqueBikes, repeatedBikes, averageTime,
          estimatedDistanceKm, co2SavedKg, electricCount, mechanicalCount, avgCostPerTripIncludingSub,
          topBikes, 
          allBikes, 
          busiestWeekday, busiestHour, tripsByHour, tripsByDay, tripsByMonthName,
          tripsByMonth, tripsByDate, tripsByWeek, tripsByYear, heatmap, longestStreak: maxStreak,
          topDays, longestTrips,
          destinyBikes: sortedDestinyBikes,
          avgIdByMonth,
          maxBikeId,
          minBikeId,
          // New Data
          idHistogram,
          generationStats,
          achievements
        };
      }, [trips, filterStart, filterEnd, tariff, bikeType]);
}