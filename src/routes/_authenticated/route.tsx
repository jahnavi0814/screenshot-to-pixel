import { createFileRoute, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link, useLocation } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  Feather,
  Home,
  Library,
  Moon,
  PlusCircle,
  Settings,
  Sun,
  ChartPie,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getMyProfile } from "@/lib/profile.functions";
import { useTheme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
  },
  component: AuthenticatedLayout,
});

const NAV_ITEMS = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/capture", label: "Capture", icon: PlusCircle },
  { to: "/almosts", label: "My Almosts", icon: Library },
  { to: "/reflect", label: "Reflect", icon: Feather },
  { to: "/insights", label: "Insights", icon: ChartPie },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

function AuthenticatedLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark, toggle } = useTheme();
  const getProfile = useServerFn(getMyProfile);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: () => getProfile(),
  });

  const needsOnboarding = !isLoading && profile && !profile.onboarding_completed;
  const onOnboarding = location.pathname === "/onboarding";

  useEffect(() => {
    if (needsOnboarding && !onOnboarding) {
      navigate({ to: "/onboarding", replace: true });
    }
  }, [needsOnboarding, onOnboarding, navigate]);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  const showNav = !onOnboarding;

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      {showNav && (
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border bg-card px-5 py-8 md:flex">
          <Link to="/home" className="heading-serif text-2xl text-foreground">
            Almost
          </Link>
          <nav className="mt-10 flex flex-1 flex-col gap-1" aria-label="Main">
            {NAV_ITEMS.map((item) => {
              const active = location.pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                    active
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                  )}
                >
                  <item.icon className="size-4" aria-hidden />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="space-y-2 border-t border-border pt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggle}
              className="w-full justify-start gap-3 text-muted-foreground"
            >
              {isDark ? <Sun className="size-4" aria-hidden /> : <Moon className="size-4" aria-hidden />}
              {isDark ? "Light" : "Dark"}
            </Button>
            {profile?.email && (
              <p className="truncate px-3 text-xs text-muted-foreground">{profile.email}</p>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              className="w-full justify-start px-3 text-muted-foreground"
            >
              Sign out
            </Button>
          </div>
        </aside>
      )}

      {/* Mobile top bar */}
      {showNav && (
        <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-card px-4 py-3 md:hidden">
          <Link to="/home" className="heading-serif text-xl text-foreground">
            Almost
          </Link>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
              {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
            <Link
              to="/settings"
              className="inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary/60"
              aria-label="Settings"
            >
              <Settings className="size-4" aria-hidden />
            </Link>
          </div>
        </header>
      )}

      <main className={cn(showNav && "pb-20 md:pb-8", showNav && "md:pl-64")}>
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      {showNav && (
        <nav
          className="fixed inset-x-0 bottom-0 z-40 flex justify-around border-t border-border bg-card py-2 md:hidden"
          aria-label="Main"
        >
          {NAV_ITEMS.filter((i) => i.to !== "/settings").map((item) => {
            const active = location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-lg px-3 py-1.5 text-[11px]",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                <item.icon className="size-5" aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
