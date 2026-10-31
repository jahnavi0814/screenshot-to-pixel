import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Search } from "lucide-react";
import { listIntentions } from "@/lib/intentions.functions";
import {
  CATEGORIES,
  CATEGORY_LABELS,
  STATUSES,
  STATUS_LABELS,
  type Category,
  type Status,
} from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { IntentionCard, type IntentionRow } from "@/components/intention-card";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/almosts/")({
  head: () => ({
    meta: [
      { title: "My Almosts — Almost" },
      { property: "og:title", content: "My Almosts — Almost" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AlmostsPage,
});

function AlmostsPage() {
  const listFn = useServerFn(listIntentions);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category | "all">("all");
  const [status, setStatus] = useState<Status | "all">("all");
  const [view, setView] = useState<"active" | "archived">("active");

  const { data: intentions, isLoading } = useQuery({
    queryKey: ["intentions", "library", { search, category, status, view }],
    queryFn: () =>
      listFn({
        data: {
          search: search.trim() || undefined,
          category: category === "all" ? undefined : category,
          status: status === "all" ? undefined : status,
          archived: view === "archived",
          sort: "recent",
        },
      }) as Promise<IntentionRow[]>,
  });

  const rows = intentions ?? [];

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="heading-serif text-3xl text-foreground sm:text-4xl">My Almosts</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Everything you've saved, at your own pace.
      </p>

      {/* Filters */}
      <div className="mt-8 space-y-4">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search your almosts…"
            className="rounded-full pl-9"
            aria-label="Search intentions"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            aria-pressed={view === "active"}
            onClick={() => setView("active")}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs transition-colors",
              view === "active"
                ? "border-transparent bg-primary text-primary-foreground"
                : "border-border text-foreground hover:bg-secondary",
            )}
          >
            Active
          </button>
          <button
            type="button"
            aria-pressed={view === "archived"}
            onClick={() => setView("archived")}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs transition-colors",
              view === "archived"
                ? "border-transparent bg-primary text-primary-foreground"
                : "border-border text-foreground hover:bg-secondary",
            )}
          >
            Archived
          </button>

          <span className="mx-1 hidden h-4 w-px bg-border sm:block" aria-hidden />

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as Status | "all")}
            aria-label="Filter by status"
            className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-foreground"
          >
            <option value="all">Any status</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Category | "all")}
            aria-label="Filter by category"
            className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-foreground"
          >
            <option value="all">Any category</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-36 rounded-2xl" />
          <Skeleton className="h-36 rounded-2xl" />
          <Skeleton className="h-36 rounded-2xl" />
          <Skeleton className="h-36 rounded-2xl" />
        </div>
      ) : rows.length === 0 ? (
        view === "archived" ? (
          <div className="fade-up mt-8 rounded-2xl border border-border bg-card p-10 text-center">
            <p className="heading-serif text-2xl text-foreground">Nothing archived.</p>
            <p className="mt-3 text-sm text-muted-foreground">
              Things you set aside will rest here.
            </p>
          </div>
        ) : search.trim() || category !== "all" || status !== "all" ? (
          <div className="fade-up mt-8 rounded-2xl border border-border bg-card p-10 text-center">
            <p className="heading-serif text-2xl text-foreground">Nothing matches.</p>
            <p className="mt-3 text-sm text-muted-foreground">
              Try a different word, or loosen the filters.
            </p>
          </div>
        ) : (
          <div className="fade-up mt-8 rounded-2xl border border-border bg-card p-10 text-center">
            <p className="heading-serif text-2xl text-foreground">Nothing here yet.</p>
            <p className="mt-3 text-sm text-muted-foreground">
              That's okay. Start with something you've been thinking about.
            </p>
            <Link
              to="/capture"
              className="mt-6 inline-flex items-center rounded-full border border-border px-5 py-2.5 text-sm text-foreground transition-colors hover:bg-secondary"
            >
              Capture your first almost
            </Link>
          </div>
        )
      ) : (
        <>
          <p className="mt-8 text-xs text-muted-foreground">
            {rows.length} {rows.length === 1 ? "almost" : "almosts"}
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {rows.map((i) => (
              <IntentionCard key={i.id} intention={i} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
