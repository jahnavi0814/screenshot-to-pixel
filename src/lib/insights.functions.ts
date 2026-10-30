import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { CATEGORY_LABELS, STATUS_LABELS, type Category, type Status } from "./constants";

export interface InsightsData {
  sufficient: boolean;
  totalIntentions: number;
  activeIntentions: number;
  categoryCounts: { category: Category; label: string; count: number }[];
  statusCounts: { status: Status; label: string; count: number }[];
  topRevisited: { id: string; title: string; revisitCount: number }[];
  blockers: { blocker: string; count: number }[];
  postponed: { id: string; title: string; createdAt: string }[];
  statusChangesByWeek: { week: string; changes: number }[];
  sentences: string[];
}

function startOfWeek(now: Date): Date {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const day = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - day);
  return d;
}

function weekKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export const getInsights = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<InsightsData> => {
    const [intentionsResult, reflectionsResult] = await Promise.all([
      context.supabase.from("intentions").select("*").eq("user_id", context.userId),
      context.supabase
        .from("reflections")
        .select("intention_id")
        .eq("user_id", context.userId),
    ]);
    if (intentionsResult.error) throw new Error(intentionsResult.error.message);
    if (reflectionsResult.error) throw new Error(reflectionsResult.error.message);

    const intentions = intentionsResult.data ?? [];
    const reflections = reflectionsResult.data ?? [];
    const active = intentions.filter((i) => !i.archived);

    const categoryCounts = Object.entries(CATEGORY_LABELS)
      .map(([category, label]) => ({
        category: category as Category,
        label,
        count: active.filter((i) => i.category === category).length,
      }))
      .filter((c) => c.count > 0)
      .sort((a, b) => b.count - a.count);

    const statusCounts = (Object.keys(STATUS_LABELS) as Status[])
      .map((status) => ({
        status,
        label: STATUS_LABELS[status],
        count: active.filter((i) => i.status === status).length,
      }))
      .filter((s) => s.count > 0);

    const topRevisited = [...active]
      .filter((i) => i.revisit_count > 0)
      .sort((a, b) => b.revisit_count - a.revisit_count)
      .slice(0, 5)
      .map((i) => ({ id: i.id, title: i.title, revisitCount: i.revisit_count }));

    const blockerCounts = new Map<string, number>();
    for (const i of active) {
      const key = (i.blocker ?? "").trim().toLowerCase();
      if (!key) continue;
      blockerCounts.set(key, (blockerCounts.get(key) ?? 0) + 1);
    }
    const blockers = [...blockerCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([blocker, count]) => ({ blocker, count }));

    const monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const postponed = [...active]
      .filter(
        (i) => i.status === "still_thinking" && new Date(i.created_at).getTime() < monthAgo,
      )
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .slice(0, 5)
      .map((i) => ({ id: i.id, title: i.title, createdAt: i.created_at }));

    // Status changes over the last 8 weeks.
    const now = new Date();
    const thisWeek = startOfWeek(now);
    const weeks: { week: string; changes: number }[] = [];
    const changesByWeek = new Map<string, number>();
    for (const i of intentions) {
      if (!i.status_changed_at) continue;
      const changed = new Date(i.status_changed_at);
      if (changed.getTime() < thisWeek.getTime() - 7 * 8 * 24 * 60 * 60 * 1000) continue;
      const key = weekKey(startOfWeek(changed));
      changesByWeek.set(key, (changesByWeek.get(key) ?? 0) + 1);
    }
    for (let w = 7; w >= 0; w--) {
      const d = new Date(thisWeek);
      d.setUTCDate(d.getUTCDate() - w * 7);
      const key = weekKey(d);
      weeks.push({ week: key, changes: changesByWeek.get(key) ?? 0 });
    }

    // Only claim what the data supports.
    const sentences: string[] = [];
    if (categoryCounts.length > 0 && (categoryCounts[0]?.count ?? 0) >= 2) {
      sentences.push(
        `You've saved ${categoryCounts[0].count} ${categoryCounts[0].label.toLowerCase()} intentions — more than any other kind.`,
      );
    }
    if (topRevisited.length > 0 && topRevisited[0].revisitCount >= 2) {
      sentences.push(
        `“${topRevisited[0].title}” has come back to you ${topRevisited[0].revisitCount} times. Has something changed?`,
      );
    }
    if (blockers.length > 0 && blockers[0].count >= 2) {
      sentences.push(`A familiar theme appears: “${blockers[0].blocker}”.`);
    }
    if (postponed.length > 0) {
      sentences.push(
        `${postponed.length} intention${postponed.length === 1 ? " has" : "s have"} been waiting quietly for a while. Is there one you'd like to explore this week?`,
      );
    }

    const sufficient = intentions.length >= 3;

    return {
      sufficient,
      totalIntentions: intentions.length,
      activeIntentions: active.length,
      categoryCounts,
      statusCounts,
      topRevisited,
      blockers,
      postponed,
      statusChangesByWeek: weeks,
      sentences,
    };
  });
