import React, { TableHTMLAttributes } from "react";

export const Table: React.FC<TableHTMLAttributes<HTMLTableElement>> = ({
  children,
  className = "",
  ...props
}) => (
  <div className="w-full overflow-x-auto rounded-xl border border-slate-800/80 bg-slate-900/40">
    <table className={`w-full text-left text-sm text-slate-300 ${className}`} {...props}>
      {children}
    </table>
  </div>
);

export const TableHeader: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  children,
  className = "",
  ...props
}) => (
  <thead
    className={`bg-slate-950/60 text-xs uppercase tracking-wider font-semibold text-slate-400 border-b border-slate-800/80 ${className}`}
    {...props}
  >
    {children}
  </thead>
);

export const TableBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  children,
  className = "",
  ...props
}) => (
  <tbody className={`divide-y divide-slate-800/60 ${className}`} {...props}>
    {children}
  </tbody>
);

export const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({
  children,
  className = "",
  ...props
}) => (
  <tr
    className={`hover:bg-slate-800/40 transition-colors duration-150 ${className}`}
    {...props}
  >
    {children}
  </tr>
);

export const TableHead: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({
  children,
  className = "",
  ...props
}) => (
  <th className={`py-3.5 px-4 font-semibold ${className}`} {...props}>
    {children}
  </th>
);

export const TableCell: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({
  children,
  className = "",
  ...props
}) => (
  <td className={`py-3.5 px-4 align-middle ${className}`} {...props}>
    {children}
  </td>
);
