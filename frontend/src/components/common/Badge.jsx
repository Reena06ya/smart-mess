import React from 'react';
import { getStatusBadgeStyle } from '../../utils/formatters';

export const Badge = ({ children, variant, className = '' }) => {
  const style = variant ? getStatusBadgeStyle(variant) : getStatusBadgeStyle(children);
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide ${style} ${className}`}
    >
      {children}
    </span>
  );
};

export default Badge;
