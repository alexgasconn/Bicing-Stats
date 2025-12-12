import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon?: React.ReactNode;
  delay?: number;
  highlight?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, subValue, icon, delay = 0, highlight = false }) => {
  return (
    <div 
      className={`bg-white p-6 rounded-xl shadow-sm flex flex-col items-center justify-center text-center transform transition-all duration-700 animate-in fade-in slide-in-from-bottom-4 border-l-4 ${highlight ? 'border-yellow-400 bg-yellow-50' : 'border-bicing'}`}
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
    >
      {icon && <div className="mb-3 text-bicing">{icon}</div>}
      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">{label}</h3>
      <div className={`text-3xl md:text-4xl font-black mb-1 font-mono ${highlight ? 'text-yellow-600' : 'text-gray-900'}`}>
        {value}
      </div>
      {subValue && (
        <div className="text-sm font-semibold text-bicing mt-1">
          {subValue}
        </div>
      )}
    </div>
  );
};