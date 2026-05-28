import { useState, type ReactNode } from "react";
import { Menu } from "lucide-react";
import { DashSidebar } from "./DashSidebar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/ThemeToggle";

export function DashLayout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen flex w-full bg-background">
      <aside className="hidden lg:flex w-[240px] shrink-0 border-r border-border">
        <DashSidebar />
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 flex items-center justify-between px-4 sm:px-8 border-b border-border">
          <div className="flex items-center gap-3">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger className="p-2 -ml-2 lg:hidden">
                <Menu className="h-5 w-5" />
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-[240px]">
                <DashSidebar onNavigate={() => setOpen(false)} />
              </SheetContent>
            </Sheet>
            <span className="font-bold tracking-tight lg:hidden">FightPort Admin</span>
          </div>
          <div className="hidden lg:flex"><ThemeToggle /></div>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-8 sm:py-8 max-w-full overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
