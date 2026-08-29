import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  accent?: "primary" | "secondary" | "tertiary" | "error" | "none";
  glow?: boolean;
  onClick?: () => void;
}

const accentColors = {
  primary: "rgba(0, 240, 255, 0.5)",
  secondary: "rgba(111, 251, 190, 0.5)",
  tertiary: "rgba(255, 185, 95, 0.5)",
  error: "rgba(255, 180, 171, 0.5)",
  none: "transparent",
};

const accentHoverColors = {
  primary: "#00f0ff",
  secondary: "#6ffbbe",
  tertiary: "#ffb95f",
  error: "#ffb4ab",
  none: "transparent",
};

export default function Card({
  children,
  className = "",
  accent = "none",
  glow = false,
  onClick,
}: CardProps) {
  return (
    <div
      className={`card relative overflow-hidden group ${glow ? "ai-glow" : ""} ${onClick ? "cursor-pointer" : ""} ${className}`}
      onClick={onClick}
    >
      {/* Top accent line */}
      {accent !== "none" && (
        <div
          className="absolute top-0 left-0 right-0 h-[2px] transition-colors duration-200"
          style={{
            backgroundColor: accentColors[accent],
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = accentHoverColors[accent])
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = accentColors[accent])
          }
        />
      )}
      {children}
    </div>
  );
}
