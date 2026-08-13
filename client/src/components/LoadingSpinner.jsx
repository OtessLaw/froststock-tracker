import React from 'react';

export const LoadingSpinner = ({ size = 'md', className = '' }) => {
  const sizes = { sm: 'w-4 h-4 border-2', md: 'w-8 h-8 border-[3px]', lg: 'w-12 h-12 border-4' };
  return (
    <div className={`spinner ${sizes[size]} ${className}`} />
  );
};

export const PageLoading = () => (
  <div className="flex items-center justify-center h-64">
    <LoadingSpinner size="lg" />
  </div>
);

export const InlineLoading = ({ text = 'Loading...' }) => (
  <div className="flex items-center justify-center gap-3 py-10">
    <LoadingSpinner size="md" />
    <span className="text-gray-500 text-sm">{text}</span>
  </div>
);

// Skeleton card for loading states
export const SkeletonCard = () => (
  <div className="card animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
    <div className="h-3 bg-gray-100 rounded w-1/2 mb-2"></div>
    <div className="h-3 bg-gray-100 rounded w-2/3"></div>
  </div>
);

export const SkeletonTable = ({ rows = 5, cols = 4 }) => (
  <div className="animate-pulse">
    <div className="h-10 bg-pink-50 rounded-t-2xl mb-px"></div>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex gap-4 px-4 py-3 border-b border-gray-50">
        {Array.from({ length: cols }).map((_, j) => (
          <div key={j} className="h-3 bg-gray-100 rounded flex-1"></div>
        ))}
      </div>
    ))}
  </div>
);

export default LoadingSpinner;
