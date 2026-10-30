import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const setReminder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        intention_id: z.string().uuid(),
        reminder_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        enabled: z.boolean().default(true),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: existing } = await context.supabase
      .from("reminders")
      .select("id")
      .eq("user_id", context.userId)
      .eq("intention_id", data.intention_id)
      .maybeSingle();

    if (existing) {
      const { error } = await context.supabase
        .from("reminders")
        .update({ reminder_date: data.reminder_date, enabled: data.enabled })
        .eq("id", existing.id);
      if (error) throw new Error(error.message);
      return { ok: true as const };
    }

    const { error } = await context.supabase.from("reminders").insert({
      user_id: context.userId,
      intention_id: data.intention_id,
      reminder_date: data.reminder_date,
      enabled: data.enabled,
    });
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const getReminder = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ intention_id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("reminders")
      .select("*")
      .eq("user_id", context.userId)
      .eq("intention_id", data.intention_id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row;
  });

export const removeReminder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ intention_id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("reminders")
      .delete()
      .eq("user_id", context.userId)
      .eq("intention_id", data.intention_id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
