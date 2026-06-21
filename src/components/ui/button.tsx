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
          "inline-flex cursor-pointer items-center justify-center rounded-xl font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:pointer-events-none disabled:opacity-50",
          variant === "primary" &&
            "bg-blue-600 text-white shadow-sm hover:bg-blue-700 active:scale-98",
          variant === "secondary" &&
            "border border-zinc-200 bg-zinc-100 text-zinc-900 hover:bg-zinc-200/80 active:scale-98",
          variant === "danger" &&
            "bg-red-600 text-white shadow-sm hover:bg-red-700 active:scale-98",
          variant === "ghost" &&
            "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900",
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
