import * as React from "react";
import { cn } from "../../utils/cn";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 disabled:opacity-50 disabled:pointer-events-none cursor-pointer",
          // Variants
          variant === "primary" &&
            "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-md shadow-violet-500/20 active:scale-98",
          variant === "secondary" &&
            "bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-100 active:scale-98",
          variant === "danger" &&
            "bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-md shadow-rose-500/20 active:scale-98",
          variant === "ghost" &&
            "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900",
          // Sizes
          size === "sm" && "h-9 px-3 text-xs",
          size === "md" && "h-11 px-5 text-sm",
          size === "lg" && "h-12 px-6 text-base",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";
export default Button;
