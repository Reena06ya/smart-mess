import React from 'react';

export const LoadingSkeleton = ({ count = 3, type = 'card' }) => {
  return (
    <div className="space-y-4 animate-pulse w-full">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className={`bg-slate-200/70 rounded-2xl ${
            type === 'card' ? 'h-32' : type === 'table-row' ? 'h-12' : 'h-24'
          }`}
        />
      ))}
    </div>
  );
};

export default LoadingSkeleton;
