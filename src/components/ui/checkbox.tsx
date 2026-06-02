import * as React from "react";
import { cn } from "../../utils/cn";

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, ...props }, ref) => {
    return (
      <label className="flex items-center gap-3 cursor-pointer select-none group">
        <div className="relative">
          <input
            type="checkbox"
            className="sr-only peer"
            ref={ref}
            {...props}
          />
          <div
            className={cn(
              "w-5.5 h-5.5 rounded-md border border-zinc-700 bg-zinc-900 flex items-center justify-center transition-all duration-200 group-hover:border-zinc-500 peer-checked:bg-gradient-to-r peer-checked:from-violet-600 peer-checked:to-indigo-600 peer-checked:border-transparent peer-focus-visible:ring-2 peer-focus-visible:ring-violet-500",
              className
            )}
          >
            <svg
              className="w-3.5 h-3.5 text-white scale-0 peer-checked:scale-100 transition-transform duration-200"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="3.5"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>
        {label && (
          <span className="text-sm text-zinc-300 font-medium group-hover:text-zinc-100 transition-colors">
            {label}
          </span>
        )}
      </label>
    );
  }
);

Checkbox.displayName = "Checkbox";
export default Checkbox;
