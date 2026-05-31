import type { ReactNode } from "react";

interface TopbarProps {
  title: string;
  subtitle?: string;
  children?: ReactNode;
}

export function Topbar({ title, subtitle, children }: TopbarProps) {
  return (
    <div
      style={{
        background: "var(--color-surface)",
        height: 58,
        minHeight: 58,
        padding: "0 24px",
        borderBottom: "1px solid var(--color-border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexShrink: 0,
      }}
    >
      <div>
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 17,
            fontWeight: 400,
            color: "var(--color-text-primary)",
            letterSpacing: "-0.4px",
            lineHeight: 1.2,
          }}
        >
          {title}
        </div>
        {subtitle && (
          <div
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 11,
              color: "var(--color-text-muted)",
              marginTop: 2,
            }}
          >
            {subtitle}
          </div>
        )}
      </div>
      {children && (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {children}
        </div>
      )}
    </div>
  );
}

export function TopbarGhostBtn({
  onClick,
  children,
}: {
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="topbar-ghost-btn"
      style={{
        background: "transparent",
        border: "1px solid var(--color-border)",
        color: "var(--color-text-secondary)",
        padding: "6px 14px",
        borderRadius: 8,
        fontSize: 12,
        fontWeight: 500,
        fontFamily: "var(--font-body)",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
      }}
    >
      {children}
    </button>
  );
}
