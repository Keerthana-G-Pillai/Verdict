import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: string;
  iconPosition?: "left" | "right";
  children: ReactNode;
  glow?: boolean;
}

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-primary-container text-on-primary-fixed-variant hover:bg-primary-fixed-dim transition-colors shadow-[0_0_15px_rgba(0,240,255,0.3)] hover:shadow-[0_0_25px_rgba(0,240,255,0.5)]",
  secondary:
    "bg-transparent text-on-surface border border-outline-variant hover:bg-surface-container-high transition-colors",
  ghost:
    "bg-transparent text-on-surface-variant hover:text-on-surface transition-colors",
};

const sizeStyles: Record<Size, string> = {
  sm: "px-3 py-1.5 text-label-mono",
  md: "px-4 py-2 text-body-md",
  lg: "px-8 py-3 text-body-md",
};

export default function Button({
  variant = "primary",
  size = "md",
  icon,
  iconPosition = "left",
  glow = false,
  children,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2 rounded font-semibold
        active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${glow ? "shadow-[0_0_15px_rgba(0,240,255,0.3)]" : ""}
        ${className}
      `}
      {...props}
    >
      {icon && iconPosition === "left" && (
        <span className="material-symbols-outlined text-[16px]">{icon}</span>
      )}
      {children}
      {icon && iconPosition === "right" && (
        <span className="material-symbols-outlined text-[16px]">{icon}</span>
      )}
    </button>
  );
}
