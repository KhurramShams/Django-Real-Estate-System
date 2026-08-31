import React, { HTMLAttributes } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "glass" | "bordered" | "gold";
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = "glass",
  className = "",
  ...props
}) => {
  const variantStyles = {
    glass: "glass-card",
    default: "bg-slate-900/80 border border-slate-800 shadow-xl shadow-slate-950/50",
    bordered: "bg-slate-950/60 border border-slate-800",
    gold: "bg-gradient-to-b from-amber-950/20 to-slate-900/90 border border-amber-500/30 shadow-xl shadow-amber-950/20",
  };

  return (
    <div
      className={`rounded-2xl overflow-hidden ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = "",
  ...props
}) => (
  <div
    className={`p-5 md:p-6 border-b border-slate-800/80 flex items-center justify-between gap-4 ${className}`}
    {...props}
  >
    {children}
  </div>
);

export const CardTitle: React.FC<HTMLAttributes<HTMLHeadingElement>> = ({
  children,
  className = "",
  ...props
}) => (
  <h3
    className={`text-base font-semibold text-slate-100 tracking-tight flex items-center gap-2 ${className}`}
    {...props}
  >
    {children}
  </h3>
);

export const CardDescription: React.FC<HTMLAttributes<HTMLParagraphElement>> = ({
  children,
  className = "",
  ...props
}) => (
  <p className={`text-xs text-slate-400 mt-1 ${className}`} {...props}>
    {children}
  </p>
);

export const CardContent: React.FC<HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = "",
  ...props
}) => (
  <div className={`p-5 md:p-6 ${className}`} {...props}>
    {children}
  </div>
);

export const CardFooter: React.FC<HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = "",
  ...props
}) => (
  <div
    className={`p-5 md:p-6 border-t border-slate-800/80 bg-slate-950/30 flex items-center justify-between gap-4 ${className}`}
    {...props}
  >
    {children}
  </div>
);
