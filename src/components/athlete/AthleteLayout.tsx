import { useState, type ReactNode } from "react";
import { Menu } from "lucide-react";
import { AthleteSidebar } from "./AthleteSidebar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function AthleteLayout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen flex w-full bg-background">
      <aside className="hidden lg:flex w-[240px] shrink-0 border-r border-border">
        <AthleteSidebar />
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden h-14 flex items-center px-4 border-b border-border">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger className="p-2 -ml-2">
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-[240px]">
              <AthleteSidebar onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
          <span className="ml-3 font-bold tracking-tight">FightPort</span>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-8 sm:py-8 max-w-full overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
