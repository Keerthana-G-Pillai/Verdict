import AppShell from "@/components/layout/AppShell";
import Link from "next/link";

interface PlaceholderPageProps {
  title: string;
  subtitle: string;
  icon: string;
  cta?: { label: string; href: string; icon?: string };
}

export function PlaceholderPage({ title, subtitle, icon, cta }: PlaceholderPageProps) {
  return (
    <AppShell>
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen px-margin-desktop">
        <div className="text-center max-w-md">
          {/* Icon */}
          <div
            className="w-16 h-16 rounded-lg mx-auto mb-lg flex items-center justify-center border"
            style={{
              backgroundColor: "var(--color-surface-container-low)",
              borderColor: "#2d2d30",
            }}
          >
            <span className="material-symbols-outlined text-on-surface-variant text-[32px]">
              {icon}
            </span>
          </div>

          <h1 className="text-headline-lg font-semibold text-on-surface mb-sm">{title}</h1>
          <p className="text-body-md text-on-surface-variant mb-xl">{subtitle}</p>

          <div className="flex items-center justify-center gap-md">
            {cta && (
              <Link
                href={cta.href}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary-container text-on-primary-fixed-variant text-label-mono rounded hover:bg-primary-fixed-dim transition-colors"
              >
                {cta.icon && (
                  <span className="material-symbols-outlined text-[16px]">{cta.icon}</span>
                )}
                {cta.label}
              </Link>
            )}
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-2.5 border border-outline-variant text-on-surface-variant text-label-mono rounded hover:text-on-surface hover:bg-surface-container-high transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
