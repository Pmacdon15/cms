import * as React from "react";
import { cn } from "../../utils/cn";

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, ...props }, ref) => {
    return (
      <label className="group flex cursor-pointer select-none items-center gap-3">
        <div className="relative">
          <input
            type="checkbox"
            className="peer sr-only"
            ref={ref}
            {...props}
          />
          <div
            className={cn(
              "flex h-5 w-5 items-center justify-center rounded-md border border-zinc-300 bg-white transition-all duration-200 group-hover:border-zinc-450 peer-checked:border-blue-600 peer-checked:bg-blue-600 peer-focus-visible:ring-2 peer-focus-visible:ring-blue-500 peer-checked:[&>svg]:scale-100 peer-checked:[&>svg]:opacity-100",
              className,
            )}
          >
            <svg
              className="h-3 w-3 scale-0 text-white opacity-0 transition-all duration-200"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="4"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>
        {label && (
          <span className="font-medium text-sm text-zinc-600 transition-colors group-hover:text-zinc-900">
            {label}
          </span>
        )}
      </label>
    );
  },
);

Checkbox.displayName = "Checkbox";
export default Checkbox;
