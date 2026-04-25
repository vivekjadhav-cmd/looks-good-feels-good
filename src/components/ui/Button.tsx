import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  ghost: "btn-ghost",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", loading, children, className = "", disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`${variantClasses[variant]} ${
          loading || disabled ? "opacity-60 pointer-events-none" : ""
        } ${className}`}
        disabled={loading || disabled}
        {...props}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            {children}
          </span>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;
