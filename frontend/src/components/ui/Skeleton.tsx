import React, { HTMLAttributes } from "react";

export const Skeleton: React.FC<HTMLAttributes<HTMLDivElement>> = ({
  className = "",
  ...props
}) => {
  return (
    <div
      className={`animate-shimmer bg-slate-800/80 rounded-xl ${className}`}
      {...props}
    />
  );
};

export const CardSkeleton: React.FC = () => (
  <div className="glass-card rounded-2xl p-6 flex flex-col gap-4">
    <div className="flex items-center justify-between">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-8 w-8 rounded-full" />
    </div>
    <Skeleton className="h-7 w-40 mt-1" />
    <div className="flex items-center gap-2 mt-2">
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-4 w-24" />
    </div>
  </div>
);

export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({
  rows = 5,
  cols = 4,
}) => (
  <div className="w-full rounded-2xl border border-slate-800 bg-slate-900/40 p-4 flex flex-col gap-3">
    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
      <Skeleton className="h-5 w-36" />
      <Skeleton className="h-8 w-24" />
    </div>
    {Array.from({ length: rows }).map((_, rIdx) => (
      <div key={rIdx} className="flex items-center gap-4 py-2">
        {Array.from({ length: cols }).map((_, cIdx) => (
          <Skeleton
            key={cIdx}
            className={`h-4 ${cIdx === 0 ? "w-1/3" : "w-1/5"}`}
          />
        ))}
      </div>
    ))}
  </div>
);
