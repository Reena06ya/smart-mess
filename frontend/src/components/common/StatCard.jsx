import React from 'react';

export const StatCard = ({
  title,
  value,
  subtext,
  icon: Icon,
  color = 'blue',
  trend,
  className = '',
}) => {
  const colorMap = {
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-100',
      iconBg: 'bg-blue-600 text-white',
    },
    green: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-100',
      iconBg: 'bg-emerald-600 text-white',
    },
    amber: {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-100',
      iconBg: 'bg-amber-500 text-white',
    },
    rose: {
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-100',
      iconBg: 'bg-rose-600 text-white',
    },
    navy: {
      bg: 'bg-navy-50',
      text: 'text-navy-900',
      border: 'border-navy-200',
      iconBg: 'bg-navy-900 text-white',
    },
  };

  const c = colorMap[color] || colorMap.blue;

  return (
    <div
      className={`bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 ${className}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-1">
            {title}
          </p>
          <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{value}</h3>
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl shadow-sm ${c.iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {(subtext || trend) && (
        <div className="mt-3 flex items-center space-x-2 text-xs">
          {trend && (
            <span
              className={`font-semibold px-1.5 py-0.5 rounded ${
                trend > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {trend}
            </span>
          )}
          {subtext && <span className="text-slate-500">{subtext}</span>}
        </div>
      )}
    </div>
  );
};

export default StatCard;
