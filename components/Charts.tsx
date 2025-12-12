import React, { useState } from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell, AreaChart, Area, CartesianGrid } from 'recharts';
import { BicingStats } from '../types';

interface ChartsProps {
  stats: BicingStats;
}

type ChartView = 'day' | 'week' | 'month' | 'year';

export const Charts: React.FC<ChartsProps> = ({ stats }) => {
  const [viewMode, setViewMode] = useState<ChartView>('month');

  const getData = () => {
    switch (viewMode) {
      case 'day': return stats.tripsByDate;
      case 'week': return stats.tripsByWeek;
      case 'month': return stats.tripsByMonth;
      case 'year': return stats.tripsByYear;
      default: return stats.tripsByMonth;
    }
  };

  const getXKey = () => {
    switch (viewMode) {
      case 'day': return 'date'; // Formatted DD/MM/YYYY
      case 'week': return 'label';
      case 'month': return 'label';
      case 'year': return 'year';
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-6xl mx-auto mt-8">
      
      {/* Evolution Chart (Full Width) */}
      <div className="bg-white p-6 rounded-xl shadow-md border-t-4 border-bicing">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            📈 Evolució Temporal
          </h3>
          
          <div className="flex bg-gray-100 p-1 rounded-lg mt-4 md:mt-0 gap-1 overflow-x-auto max-w-full">
            <button 
              onClick={() => setViewMode('day')}
              className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-md transition-all whitespace-nowrap ${viewMode === 'day' ? 'bg-bicing text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
            >
              Dia
            </button>
            <button 
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-md transition-all whitespace-nowrap ${viewMode === 'week' ? 'bg-bicing text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
            >
              Setmana
            </button>
            <button 
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-md transition-all whitespace-nowrap ${viewMode === 'month' ? 'bg-bicing text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
            >
              Mes
            </button>
             <button 
              onClick={() => setViewMode('year')}
              className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-md transition-all whitespace-nowrap ${viewMode === 'year' ? 'bg-bicing text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
            >
              Any
            </button>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={getData()}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D6001C" stopOpacity={0.6}/>
                  <stop offset="95%" stopColor="#D6001C" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
              <XAxis 
                dataKey={getXKey()} 
                tick={{fontSize: 10, fill: '#666'}} 
                axisLine={false} 
                tickLine={false} 
                dy={10}
                minTickGap={30}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#1f2937', 
                  color: '#fff', 
                  borderRadius: '8px', 
                  border: 'none', 
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)'
                }}
                itemStyle={{color: '#fff'}}
                labelStyle={{color: '#9ca3af', marginBottom: '4px', fontSize: '0.8rem'}}
              />
              <Area 
                type="monotone" 
                dataKey="count" 
                stroke="#D6001C" 
                fillOpacity={1} 
                fill="url(#colorCount)" 
                strokeWidth={3}
                animationDuration={1000}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 2: Seasonality & Weekdays */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         {/* Seasonality Chart (New) */}
         <div className="bg-white p-6 rounded-xl shadow-md border-t-4 border-gray-800">
          <h3 className="text-xl font-bold text-gray-900 mb-6">🌤️ Estacionalitat (Mesos)</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.tripsByMonthName}>
                <XAxis 
                  dataKey="month" 
                  tick={{fontSize: 12}} 
                  axisLine={false} 
                  tickLine={false} 
                />
                <Tooltip 
                  cursor={{fill: '#f3f4f6'}}
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}}
                />
                <Bar dataKey="count" fill="#D6001C" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekdays Chart */}
        <div className="bg-white p-6 rounded-xl shadow-md border-t-4 border-gray-800">
          <h3 className="text-xl font-bold text-gray-900 mb-6">📅 Dies de la setmana</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.tripsByDay}>
                <XAxis 
                  dataKey="day" 
                  tick={{fontSize: 12}} 
                  axisLine={false} 
                  tickLine={false}
                />
                <Tooltip 
                   cursor={{fill: '#f3f4f6'}}
                   contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {stats.tripsByDay.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.day === stats.busiestWeekday ? '#D6001C' : '#E5E7EB'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Hours (Full width for detail) */}
      <div className="bg-white p-6 rounded-xl shadow-md border-t-4 border-gray-800">
        <h3 className="text-xl font-bold text-gray-900 mb-6">🕒 Hores més actives</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.tripsByHour}>
              <XAxis 
                dataKey="hour" 
                tick={{fontSize: 12}} 
                axisLine={false} 
                tickLine={false} 
              />
              <Tooltip 
                cursor={{fill: '#f3f4f6'}}
                contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {stats.tripsByHour.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.hour === stats.busiestHour ? '#D6001C' : '#E5E7EB'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};