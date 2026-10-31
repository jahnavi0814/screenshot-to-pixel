import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { CATEGORIES, STATUSES } from "./constants";

const statusEnum = z.enum(STATUSES);
type DbStatus = (typeof STATUSES)[number];

const intentionFields = {
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(4000).optional().or(z.literal("")),
  why_it_matters: z.string().trim().max(4000).optional().or(z.literal("")),
  blocker: z.string().trim().max(4000).optional().or(z.literal("")),
  category: z.enum(CATEGORIES).default("other"),
  next_step: z.string().trim().max(2000).optional().or(z.literal("")),
  timeframe: z.string().trim().max(120).optional().or(z.literal("")),
  people_involved: z.string().trim().max(500).optional().or(z.literal("")),
  notes: z.string().trim().max(8000).optional().or(z.literal("")),
};

export const createIntention = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object(intentionFields).parse(input))
  .handler(async ({ data, context }) => {
    const payload = {
      user_id: context.userId,
      title: data.title,
      description: data.description || null,
      why_it_matters: data.why_it_matters || null,
      blocker: data.blocker || null,
      category: data.category,
      timeframe: data.timeframe || null,
      people_involved: data.people_involved || null,
      notes: data.notes || null,
    };
    const { data: created, error } = await context.supabase
      .from("intentions")
      .insert(payload)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return created;
  });

export const updateIntention = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        id: z.string().uuid(),
        archived: z.boolean().optional(),
        ...intentionFields,
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { id, archived, ...fields } = data;
    const payload: {
      title?: string;
      description?: string | null;
      why_it_matters?: string | null;
      blocker?: string | null;
      category?: string;
      next_step?: string | null;
      timeframe?: string | null;
      people_involved?: string | null;
      notes?: string | null;
      archived?: boolean;
    } = {};
    payload.title = fields.title;
    payload.category = fields.category;
    if (fields.description !== undefined)
      payload.description = fields.description || null;
    if (fields.why_it_matters !== undefined)
      payload.why_it_matters = fields.why_it_matters || null;
    if (fields.blocker !== undefined) payload.blocker = fields.blocker || null;
    if (fields.next_step !== undefined) payload.next_step = fields.next_step || null;
    if (fields.timeframe !== undefined) payload.timeframe = fields.timeframe || null;
    if (fields.people_involved !== undefined)
      payload.people_involved = fields.people_involved || null;
    if (fields.notes !== undefined) payload.notes = fields.notes || null;
    if (archived !== undefined) payload.archived = archived;
    const { data: updated, error } = await context.supabase
      .from("intentions")
      .update(payload)
      .eq("id", id)
      .eq("user_id", context.userId)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return updated;
  });

export const updateIntentionStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ id: z.string().uuid(), status: statusEnum }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: updated, error } = await context.supabase
      .from("intentions")
      .update({ status: data.status as DbStatus })
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return updated;
  });

export const setNextStep = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({ id: z.string().uuid(), next_step: z.string().trim().min(1).max(2000) })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: updated, error } = await context.supabase
      .from("intentions")
      .update({ next_step: data.next_step, next_step_at: new Date().toISOString() })
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return updated;
  });

export const deleteIntention = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("intentions")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

const listSchema = z.object({
  search: z.string().trim().max(200).optional(),
  category: z.enum(CATEGORIES).optional(),
  status: statusEnum.optional(),
  archived: z.boolean().optional(),
  sort: z.enum(["recent", "oldest"]).default("recent"),
});

export const listIntentions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => listSchema.parse(input))
  .handler(async ({ data, context }) => {
    let query = context.supabase
      .from("intentions")
      .select("*")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: data.sort === "oldest" });

    if (data.archived !== undefined) query = query.eq("archived", data.archived);
    if (data.category) query = query.eq("category", data.category);
    if (data.status) query = query.eq("status", data.status as DbStatus);
    if (data.search) {
      const term = `%${data.search.replace(/[%_]/g, "\\$&")}%`;
      query = query.or(`title.ilike.${term},description.ilike.${term},notes.ilike.${term}`);
    }

    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const getIntention = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("intentions")
      .select("*")
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row;
  });
