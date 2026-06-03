"use client";
import { forwardRef, InputHTMLAttributes, ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";

// ── Button ───────────────────────────────────────────────────

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading, children, className = "", disabled, ...props }, ref) => {
    const base = "inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none";
    const variants = {
      primary: "bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700 shadow-sm",
      secondary: "bg-surface-100 text-ink-primary hover:bg-surface-200 active:bg-surface-300 border border-surface-200",
      ghost: "text-ink-secondary hover:bg-surface-100 active:bg-surface-200",
      danger: "bg-danger text-white hover:bg-red-700 active:bg-red-800 shadow-sm",
    };
    const sizes = {
      sm: "text-sm px-3 py-1.5 h-8",
      md: "text-sm px-4 py-2 h-10",
      lg: "text-sm px-6 py-2.5 h-11",
    };
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

// ── Input ────────────────────────────────────────────────────

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftIcon, rightIcon, className = "", id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-ink-primary">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-tertiary pointer-events-none">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`
              w-full h-10 rounded-xl border bg-white text-sm text-ink-primary
              placeholder:text-ink-tertiary transition-colors duration-150
              focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent
              disabled:bg-surface-100 disabled:cursor-not-allowed
              ${error ? "border-danger focus:ring-danger" : "border-surface-200 hover:border-surface-300"}
              ${leftIcon ? "pl-10" : "pl-3.5"}
              ${rightIcon ? "pr-10" : "pr-3.5"}
              ${className}
            `}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-tertiary">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="text-xs text-danger">{error}</p>}
        {hint && !error && <p className="text-xs text-ink-tertiary">{hint}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

// ── Card ─────────────────────────────────────────────────────

export const Card = ({
  children,
  className = "",
  padding = "md",
}: {
  children: React.ReactNode;
  className?: string;
  padding?: "sm" | "md" | "lg";
}) => {
  const paddings = { sm: "p-4", md: "p-5", lg: "p-6" };
  return (
    <div className={`bg-white rounded-2xl shadow-card border border-surface-100 ${paddings[padding]} ${className}`}>
      {children}
    </div>
  );
};

// ── Badge ────────────────────────────────────────────────────

export const Badge = ({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: "default" | "success" | "danger" | "warning" | "info";
}) => {
  const variants = {
    default: "bg-surface-100 text-ink-secondary",
    success: "bg-green-50 text-success",
    danger: "bg-red-50 text-danger",
    warning: "bg-amber-50 text-warning",
    info: "bg-blue-50 text-brand-600",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  );
};

// ── Divider ──────────────────────────────────────────────────

export const Divider = ({ label, className = "" }: { label?: string; className?: string }) => (
  <div className={`flex items-center gap-3 ${className}`}>
    <div className="flex-1 h-px bg-surface-200" />
    {label && <span className="text-xs text-ink-tertiary">{label}</span>}
    <div className="flex-1 h-px bg-surface-200" />
  </div>
);

// ── Spinner ──────────────────────────────────────────────────

export const Spinner = ({ size = "md" }: { size?: "sm" | "md" | "lg" }) => {
  const sizes = { sm: "w-4 h-4", md: "w-6 h-6", lg: "w-8 h-8" };
  return <Loader2 className={`${sizes[size]} animate-spin text-brand-500`} />;
};

// ── Amount ───────────────────────────────────────────────────

export const Amount = ({
  value,
  size = "md",
  className = "",
}: {
  value: number;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) => {
  const formatted = new Intl.NumberFormat("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
  const sizes = { sm: "text-sm", md: "text-base", lg: "text-2xl", xl: "text-4xl" };
  return (
    <span className={`tabular ${sizes[size]} ${className}`}>
      <span className="text-[0.7em] font-medium opacity-60 mr-0.5">₦</span>
      {formatted}
    </span>
  );
};

// ── Alert ────────────────────────────────────────────────────

export const Alert = ({
  children,
  variant = "danger",
}: {
  children: React.ReactNode;
  variant?: "danger" | "success" | "warning" | "info";
}) => {
  const variants = {
    danger: "bg-red-50 border-red-100 text-danger",
    success: "bg-green-50 border-green-100 text-success",
    warning: "bg-amber-50 border-amber-100 text-warning",
    info: "bg-blue-50 border-blue-100 text-brand-600",
  };
  return (
    <div className={`border rounded-xl px-4 py-3 text-sm ${variants[variant]}`}>
      {children}
    </div>
  );
};