import * as React from "react";
import { cn } from "../../utils/cn";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", label, error, ...props }, ref) => {
    const uniqueId = React.useId();
    const inputId = props.id || uniqueId;

    return (
      <div className="flex w-full flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="font-semibold text-xs text-zinc-500 uppercase tracking-wider"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          type={type}
          className={cn(
            "flex h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-900 transition-all duration-200 placeholder:text-zinc-400 focus-visible:border-blue-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50",
            error &&
              "border-rose-500 focus-visible:border-rose-500 focus-visible:ring-rose-500",
            className,
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <span className="font-medium text-rose-500 text-xs">{error}</span>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";
export default Input;
