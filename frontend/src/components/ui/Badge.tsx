import React from "react";

export type BadgeVariant =
  | "available"
  | "under_negotiation"
  | "sold"
  | "rented"
  | "negotiation"
  | "booked"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "pending"
  | "partial"
  | "paid"
  | "overdue"
  | "partial_overdue"
  | "admin"
  | "agent"
  | "accountant"
  | "staff"
  | "gold"
  | "neutral";

export interface BadgeProps {
  variant?: BadgeVariant;
  label?: string;
  children?: React.ReactNode;
  size?: "sm" | "md";
  className?: string;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = "neutral",
  label,
  children,
  size = "md",
  className = "",
  dot = true,
}) => {
  const variantStyles: Record<BadgeVariant, { bg: string; text: string; border: string; dotColor: string; defaultLabel: string }> = {
    // Property statuses
    available: {
      bg: "bg-emerald-950/60",
      text: "text-emerald-300",
      border: "border-emerald-700/50",
      dotColor: "bg-emerald-400",
      defaultLabel: "Available",
    },
    under_negotiation: {
      bg: "bg-amber-950/60",
      text: "text-amber-300",
      border: "border-amber-700/50",
      dotColor: "bg-amber-400",
      defaultLabel: "Under Negotiation",
    },
    sold: {
      bg: "bg-emerald-900/80",
      text: "text-emerald-100",
      border: "border-emerald-500/60",
      dotColor: "bg-emerald-300",
      defaultLabel: "Sold",
    },
    rented: {
      bg: "bg-blue-950/60",
      text: "text-blue-300",
      border: "border-blue-700/50",
      dotColor: "bg-blue-400",
      defaultLabel: "Rented",
    },

    // Deal statuses
    negotiation: {
      bg: "bg-sky-950/60",
      text: "text-sky-300",
      border: "border-sky-700/50",
      dotColor: "bg-sky-400",
      defaultLabel: "Negotiation",
    },
    booked: {
      bg: "bg-amber-950/60",
      text: "text-amber-300",
      border: "border-amber-700/50",
      dotColor: "bg-amber-400",
      defaultLabel: "Booked",
    },
    in_progress: {
      bg: "bg-indigo-950/60",
      text: "text-indigo-300",
      border: "border-indigo-700/50",
      dotColor: "bg-indigo-400",
      defaultLabel: "In Progress",
    },
    completed: {
      bg: "bg-emerald-950/70",
      text: "text-emerald-300",
      border: "border-emerald-600/60",
      dotColor: "bg-emerald-400",
      defaultLabel: "Completed",
    },
    cancelled: {
      bg: "bg-rose-950/60",
      text: "text-rose-300",
      border: "border-rose-700/50",
      dotColor: "bg-rose-400",
      defaultLabel: "Cancelled",
    },

    // Payment statuses
    pending: {
      bg: "bg-slate-800/80",
      text: "text-slate-300",
      border: "border-slate-700/60",
      dotColor: "bg-slate-400",
      defaultLabel: "Pending",
    },
    partial: {
      bg: "bg-amber-950/60",
      text: "text-amber-300",
      border: "border-amber-700/50",
      dotColor: "bg-amber-400",
      defaultLabel: "Partially Paid",
    },
    paid: {
      bg: "bg-emerald-950/70",
      text: "text-emerald-300",
      border: "border-emerald-600/60",
      dotColor: "bg-emerald-400",
      defaultLabel: "Paid",
    },
    overdue: {
      bg: "bg-rose-950/70",
      text: "text-rose-300",
      border: "border-rose-600/60",
      dotColor: "bg-rose-400 animate-pulse",
      defaultLabel: "Overdue",
    },
    partial_overdue: {
      bg: "bg-orange-950/70",
      text: "text-orange-300",
      border: "border-orange-600/60",
      dotColor: "bg-orange-400 animate-pulse",
      defaultLabel: "Partial Overdue",
    },

    // User Roles
    admin: {
      bg: "bg-purple-950/60",
      text: "text-purple-300",
      border: "border-purple-700/50",
      dotColor: "bg-purple-400",
      defaultLabel: "Admin",
    },
    agent: {
      bg: "bg-amber-950/50",
      text: "text-amber-300",
      border: "border-amber-600/50",
      dotColor: "bg-amber-400",
      defaultLabel: "Agent",
    },
    accountant: {
      bg: "bg-teal-950/60",
      text: "text-teal-300",
      border: "border-teal-700/50",
      dotColor: "bg-teal-400",
      defaultLabel: "Accountant",
    },
    staff: {
      bg: "bg-slate-800/80",
      text: "text-slate-300",
      border: "border-slate-700/60",
      dotColor: "bg-slate-400",
      defaultLabel: "Staff",
    },

    // Custom
    gold: {
      bg: "bg-amber-950/60",
      text: "text-amber-200",
      border: "border-amber-500/50",
      dotColor: "bg-amber-400",
      defaultLabel: "Premium",
    },
    neutral: {
      bg: "bg-slate-800/60",
      text: "text-slate-300",
      border: "border-slate-700/50",
      dotColor: "bg-slate-400",
      defaultLabel: "Default",
    },
  };

  const style = variantStyles[variant] || variantStyles.neutral;
  const sizeStyles = {
    sm: "text-[11px] px-2 py-0.5 gap-1.5 font-medium",
    md: "text-xs px-2.5 py-1 gap-1.5 font-semibold",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border shadow-sm ${style.bg} ${style.text} ${style.border} ${sizeStyles[size]} ${className}`}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${style.dotColor}`}
        />
      )}
      <span>{children || label || style.defaultLabel}</span>
    </span>
  );
};
