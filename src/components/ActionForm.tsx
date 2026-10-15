"use client";
import { startTransition, useActionState } from "react";
import type { ActionState } from "@/app/admin/actions";

export function ActionForm({ action, children, submitLabel = "Save", className = "grid-form", encType, extra }: {
  action: (s: ActionState, f: FormData) => Promise<ActionState>; children: React.ReactNode; submitLabel?: string; className?: string; encType?: string; extra?: React.ReactNode;
}) {
  const [state, run, pending] = useActionState(action, undefined);
  // Submit via onSubmit (not the form `action` prop) so React does not reset the fields after a failed save.
  return (
    <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); startTransition(() => run(fd)); }} className={className} encType={encType}>
      {children}
      <div className="full row">
        <button className="btn" type="submit" disabled={pending}>{pending ? "Working…" : submitLabel}</button>
        {extra}
        {state?.error && <span className="err" role="alert">{state.error}</span>}
        {state?.ok && <span role="status" style={{ color: "var(--ok)", whiteSpace: "pre-line" }}>{state.message || "Done."}</span>}
      </div>
    </form>
  );
}
