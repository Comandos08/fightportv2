import type { ReactNode } from "react";

interface TopbarProps { title: string; subtitle?: string; children?: ReactNode; }

export function Topbar({ title, subtitle, children }: TopbarProps) {
  return (
    <div className="h-[58px] min-h-[58px] px-6 border-b border-[#E8E6E1] bg-white flex items-center justify-between shrink-0">
      <div>
        <div className="[font-family:'Space_Grotesk',sans-serif] font-normal text-[17px] text-[#0f0f0f] tracking-[-0.4px] leading-tight">
          {title}
        </div>
        {subtitle && (
          <div className="font-sans text-[11px] text-[#999999] mt-0.5">{subtitle}</div>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-2">{children}</div>
      )}
    </div>
  );
}

export function TopbarGhostBtn({ onClick, children }: { onClick?: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="border border-[#E8E6E1] bg-transparent text-[#555555] hover:bg-[#F0EEE9] px-3.5 py-1.5 rounded-lg text-[12px] font-medium inline-flex items-center gap-1.5 cursor-pointer transition-colors"
    >
      {children}
    </button>
  );
}
