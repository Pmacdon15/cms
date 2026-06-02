import * as React from "react";
import { cn } from "../../utils/cn";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", label, error, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            {label}
          </label>
        )}
        <input
          type={type}
          className={cn(
            "flex w-full h-11 rounded-xl bg-white border border-zinc-200 px-4 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus-visible:outline-none focus-visible:border-blue-500 focus-visible:ring-1 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
            error &&
              "border-rose-500 focus-visible:border-rose-500 focus-visible:ring-rose-500",
            className,
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <span className="text-xs text-rose-500 font-medium">{error}</span>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";
export default Input;
