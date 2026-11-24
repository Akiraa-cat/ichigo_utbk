import React from 'react';

export const SkeletonCard: React.FC = () => {
  return (
    <div className="relative bg-surface rounded-xl p-4 border-2 border-ink manga-shadow space-y-4 overflow-hidden">
      <div className="flex items-center justify-between pb-2 border-b border-surface-container-high">
        <div className="flex items-center gap-2">
          <div className="h-4 w-28 bg-surface-container-highest rounded animate-pulse" />
          <div className="h-4 w-12 bg-manga-red-soft rounded animate-pulse" />
        </div>
        <div className="flex items-center gap-1.5 bg-surface-container-low px-2 py-0.5 rounded">
          <span className="w-2 h-2 rounded-full bg-amber-muted animate-pulse" />
          <span className="text-[10px] font-bold text-ink-muted uppercase">Memuat Data</span>
        </div>
      </div>

      {/* Countdown Hero Skeleton */}
      <div className="p-3 bg-surface-container-low rounded-lg flex items-center justify-between gap-3">
        <div className="space-y-2 flex-1">
          <div className="h-3 w-20 bg-surface-container-highest rounded animate-pulse" />
          <div className="h-8 w-32 bg-surface-container-highest rounded animate-pulse" />
          <div className="h-2.5 w-40 bg-surface-container-highest rounded animate-pulse" />
        </div>
        <div className="w-14 h-14 rounded-full bg-surface-container-highest flex items-center justify-center animate-pulse">
          <div className="w-9 h-9 rounded-full bg-surface-container-low" />
        </div>
      </div>

      {/* Chart Skeleton */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <div className="h-3 w-32 bg-surface-container-highest rounded animate-pulse" />
          <div className="h-3 w-14 bg-surface-container-highest rounded animate-pulse" />
        </div>
        <div className="h-24 bg-surface-container-low rounded-lg p-3 flex items-end justify-between gap-2">
          <div className="w-1/6 bg-surface-container-highest rounded-t h-1/3 animate-pulse" />
          <div className="w-1/6 bg-surface-container-highest rounded-t h-2/3 animate-pulse" />
          <div className="w-1/6 bg-surface-container-highest rounded-t h-1/2 animate-pulse" />
          <div className="w-1/6 bg-surface-container-highest rounded-t h-4/5 animate-pulse" />
          <div className="w-1/6 bg-surface-container-highest rounded-t h-3/4 animate-pulse" />
          <div className="w-1/6 bg-primary-fixed rounded-t h-full animate-pulse" />
        </div>
      </div>

      {/* Subtest Pills */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <div className="h-9 bg-surface-container-low rounded-lg p-2 flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-surface-container-highest animate-pulse" />
          <div className="h-3 w-20 bg-surface-container-highest rounded animate-pulse" />
        </div>
        <div className="h-9 bg-surface-container-low rounded-lg p-2 flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-surface-container-highest animate-pulse" />
          <div className="h-3 w-16 bg-surface-container-highest rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
};
