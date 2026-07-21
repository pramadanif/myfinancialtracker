import { cn } from "@/lib/utils";
import { HTMLAttributes, forwardRef } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: "none" | "sm" | "md" | "lg";
  variant?: "default" | "elevated" | "flat";
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, padding = "md", variant = "default", children, ...props }, ref) => {
    const paddings = {
      none: "",
      sm: "p-3",
      md: "p-4",
      lg: "p-5",
    };

    const variants = {
      default: "bg-white border border-border-light shadow-card",
      elevated: "bg-white border border-border-light shadow-card-hover",
      flat: "bg-background-secondary border border-border-light",
    };

    return (
      <div
        ref={ref}
        className={cn("rounded-2xl", variants[variant], paddings[padding], className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";
export default Card;
