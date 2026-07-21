import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s/g, "-");

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wide">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "w-full px-3.5 py-3 rounded-xl border border-border bg-white text-text-primary text-sm",
            "placeholder:text-text-tertiary",
            "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
            "transition-all duration-150",
            error && "border-status-danger focus:ring-status-danger/20",
            className
          )}
          {...props}
        />
        {error && <p className="mt-1.5 text-xs text-status-danger">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
