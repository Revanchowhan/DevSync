import React from 'react';

export function Card({ children, className = '', hover = false, ...props }) {
  return (
    <div
      className={`rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card transition-all duration-200 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-slate-100 ${
        hover
          ? 'hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-card-hover hover:-translate-y-0.5'
          : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }) {
  return <div className={`mb-4 flex flex-col space-y-1.5 ${className}`}>{children}</div>;
}

export function CardTitle({ children, className = '' }) {
  return (
    <h3 className={`text-lg font-semibold tracking-tight text-slate-900 dark:text-white ${className}`}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className = '' }) {
  return (
    <p className={`text-sm text-slate-500 dark:text-slate-400 leading-relaxed ${className}`}>
      {children}
    </p>
  );
}

export function CardContent({ children, className = '' }) {
  return <div className={`${className}`}>{children}</div>;
}

export function CardFooter({ children, className = '' }) {
  return (
    <div className={`mt-5 flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800/80 ${className}`}>
      {children}
    </div>
  );
}
