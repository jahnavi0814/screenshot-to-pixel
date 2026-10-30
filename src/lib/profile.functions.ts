import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const profileSchema = z.object({
  full_name: z.string().trim().max(120).optional(),
  preferred_theme: z.enum(["light", "dark", "system"]).optional(),
  reflection_cadence: z.enum(["weekly", "occasional"]).optional(),
});

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select("*")
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (data) return data;
    // Safety net in case the signup trigger didn't run for this account.
    const email = (context.claims as { email?: string } | undefined)?.email ?? null;
    const { data: created, error: insertError } = await context.supabase
      .from("profiles")
      .insert({ id: context.userId, email })
      .select("*")
      .single();
    if (insertError) throw new Error(insertError.message);
    return created;
  });

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => profileSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: updated, error } = await context.supabase
      .from("profiles")
      .update(data)
      .eq("id", context.userId)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return updated;
  });

const onboardingSchema = z.object({
  blocker: z.string().trim().max(2000).optional().or(z.literal("")),
  categories: z.array(z.string()).max(10).optional(),
  cadence: z.enum(["weekly", "occasional"]),
  firstAlmost: z
    .object({
      title: z.string().trim().min(1).max(200),
      why_it_matters: z.string().trim().max(4000).optional().or(z.literal("")),
    })
    .optional(),
});

export const completeOnboarding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => onboardingSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .update({
        onboarding_completed: true,
        onboarding_blocker: data.blocker || null,
        onboarding_categories: data.categories ?? [],
        reflection_cadence: data.cadence,
      })
      .eq("id", context.userId);
    if (error) throw new Error(error.message);

    if (data.firstAlmost?.title) {
      const { error: intentionError } = await context.supabase
        .from("intentions")
        .insert({
          user_id: context.userId,
          title: data.firstAlmost.title,
          why_it_matters: data.firstAlmost.why_it_matters || null,
          blocker: data.blocker || null,
        });
      if (intentionError) throw new Error(intentionError.message);
    }
    return { ok: true as const };
  });
