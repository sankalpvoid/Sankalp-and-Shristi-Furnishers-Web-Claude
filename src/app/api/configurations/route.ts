import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { CONFIGURATORS } from "@/lib/constants";
import { buildSummary, validateSelections } from "@/lib/configurator";
import { getOptionGroups, getProductLimits, getRules, insertConfiguration } from "@/lib/repo";
import { clientIp, rateLimit } from "@/lib/ratelimit";
import type { ConfiguratorType } from "@/lib/types";

const schema = z.object({
  configurator: z.enum(["bed", "sofa", "sofa_bed", "dining"]),
  productId: z.number().int().positive().optional(),
  selections: z.record(z.string().max(40), z.union([z.string().max(60), z.number()])),
  notes: z.string().trim().max(500).optional(),
});

export async function POST(req: Request) {
  if (!rateLimit(`cfg:${clientIp(req.headers)}`, 20, 600)) {
    return NextResponse.json({ ok: false, error: "Too many saves in a short time. Please wait a few minutes." }, { status: 429 });
  }
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Invalid design data." }, { status: 400 });
  const { configurator, productId, selections, notes } = parsed.data;
  const conf = configurator as ConfiguratorType;

  let pid: number | null = null;
  let limits: Record<string, string[]> = {};
  if (productId) {
    const p = db().prepare("SELECT id, configurator FROM products WHERE id=? AND status='published'").get(productId) as { id: number; configurator: string } | undefined;
    if (p && p.configurator === conf) { pid = p.id; limits = getProductLimits(p.id); }
  }
  const groups = getOptionGroups(conf);
  const v = validateSelections(conf, groups, getRules(conf), selections, limits);
  if (!v.ok) return NextResponse.json({ ok: false, error: v.error }, { status: 400 });
  const summary = buildSummary(conf, groups, v.sel);
  const ref = insertConfiguration({ configurator: conf, prefix: CONFIGURATORS[conf].refPrefix, productId: pid, selections: v.sel, summary, notes: notes ?? "" });
  return NextResponse.json({ ok: true, ref, summary });
}
