import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const createReflection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        content: z.string().trim().min(1).max(10000),
        prompt: z.string().trim().max(500).optional().or(z.literal("")),
        intention_id: z.string().uuid().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: created, error } = await context.supabase
      .from("reflections")
      .insert({
        user_id: context.userId,
        content: data.content,
        prompt: data.prompt || null,
        intention_id: data.intention_id ?? null,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return created;
  });

export const listMyReflections = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ limit: z.number().int().min(1).max(200).default(50) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("reflections")
      .select("*, intention:intentions(title)")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const listIntentionReflections = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ intention_id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("reflections")
      .select("*")
      .eq("user_id", context.userId)
      .eq("intention_id", data.intention_id)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const deleteReflection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("reflections")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export interface WeeklySummary {
  weekStart: string;
  newIntentions: number;
  revisited: number;
  smallSteps: number;
  letGo: number;
}

// Start of the current ISO week (Monday), UTC.
function startOfWeek(now: Date): Date {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const day = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - day);
  return d;
}

export const getWeeklySummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<WeeklySummary> => {
    const now = new Date();
    const weekStart = startOfWeek(now);
    const since = weekStart.toISOString();

    const [intentionsResult, reflectionsResult] = await Promise.all([
      context.supabase
        .from("intentions")
        .select("created_at, status_changed_at, status, revisit_count")
        .eq("user_id", context.userId)
        .gte("created_at", since),
      context.supabase
        .from("reflections")
        .select("intention_id, created_at")
        .eq("user_id", context.userId)
        .gte("created_at", since),
    ]);
    if (intentionsResult.error) throw new Error(intentionsResult.error.message);
    if (reflectionsResult.error) throw new Error(reflectionsResult.error.message);

    const intentions = intentionsResult.data ?? [];
    const reflections = reflectionsResult.data ?? [];
    const revisitedIntentions = new Set(
      reflections.filter((r) => r.intention_id).map((r) => r.intention_id),
    );

    // Revisited this week also includes intentions whose status changed this week.
    const weekAgoIso = since;
    const { data: changed, error: changedError } = await context.supabase
      .from("intentions")
      .select("id, status_changed_at, status, revisit_count")
      .eq("user_id", context.userId)
      .gte("status_changed_at", weekAgoIso);
    if (changedError) throw new Error(changedError.message);

    for (const row of changed ?? []) {
      if (row.status_changed_at) revisitedIntentions.add(row.id);
    }

    return {
      weekStart: since,
      newIntentions: intentions.length,
      revisited: revisitedIntentions.size,
      smallSteps: (changed ?? []).filter(
        (r) => r.status === "taking_small_step" || r.status === "completed",
      ).length,
      letGo: (changed ?? []).filter((r) => r.status === "no_longer_relevant").length,
    };
  });
