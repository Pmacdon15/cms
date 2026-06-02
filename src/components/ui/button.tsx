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
          "inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none cursor-pointer",
          variant === "primary" &&
            "bg-blue-600 hover:bg-blue-700 text-white shadow-sm active:scale-98",
          variant === "secondary" &&
            "bg-zinc-100 border border-zinc-200 hover:bg-zinc-200/80 text-zinc-900 active:scale-98",
          variant === "danger" &&
            "bg-red-600 hover:bg-red-700 text-white shadow-sm active:scale-98",
          variant === "ghost" &&
            "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100",
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
