export interface RawCsvRow {
  [key: string]: string;
}

export interface BicingTrip {
  id: string; 
  startDate: Date;
  endDate: Date;
  bikeId: string; 
  durationMinutes: number;
  cost: number;
  service: string; 
}

export interface BikeStat {
  id: string;
  count: number;
  minutes: number;
  usageDates: Date[]; 
  trips: BicingTrip[]; // NEW: Keep full history for specific analysis
  firstUsed: Date;
  lastUsed: Date;
  range: 'old' | 'mid' | 'new'; 
}

export interface DayStat {
  date: string; 
  formattedDate: string; 
  count: number;
}

export interface DestinyBike {
  id: string;
  gapDays: number;
  dateA: Date;
  dateB: Date;
  totalUses: number;
}

export interface BicingStats {
  totalTrips: number;
  totalMinutes: number;
  totalCost: number;
  uniqueBikes: number;
  repeatedBikes: number;
  averageTime: number; 
  estimatedDistanceKm: number; 
  co2SavedKg: number; 
  
  electricCount: number;
  mechanicalCount: number;
  avgCostPerTripIncludingSub: number; 

  longestStreak: number; 
  topDays: DayStat[]; 
  longestTrips: BicingTrip[]; 
  
  topBikes: BikeStat[]; 
  allBikes: BikeStat[]; // Access to full fleet for searching
  
  destinyBikes: DestinyBike[]; 
  avgIdByMonth: { month: string; label: string; avgId: number; count: number }[]; 
  maxBikeId: number; 
  minBikeId: number; 
  
  busiestWeekday: string;
  busiestHour: string;
  
  tripsByHour: { hour: string; count: number }[];
  tripsByDay: { day: string; count: number }[];
  tripsByMonthName: { month: string; count: number }[];
  
  tripsByDate: { date: string; isoDate: string; timestamp: number; count: number }[]; 
  tripsByWeek: { week: string; label: string; count: number }[]; 
  tripsByMonth: { month: string; label: string; count: number }[]; 
  tripsByYear: { year: string; count: number }[]; 
  
  heatmap: number[][]; 
}