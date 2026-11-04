"use client";

import { useActionState, useState, type ReactNode } from "react";
import { ErrorText } from "@/components/ui";

export type FormState = { ok?: boolean; error?: string } | null;
type Action = (state: FormState, formData: FormData) => Promise<FormState>;

/** A form bound to a server action, showing its error and disabling while pending. */
export function ActionForm({
  action,
  children,
  className = "",
}: {
  action: Action;
  children: ReactNode;
  className?: string;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  return (
    <form action={formAction} className={className} aria-busy={pending}>
      <fieldset disabled={pending} className="contents">
        {children}
      </fieldset>
      {state?.error ? (
        <div className="basis-full">
          <ErrorText>{state.error}</ErrorText>
        </div>
      ) : null}
    </form>
  );
}

/** A one-button form for a single-record action (remove, reset, regenerate…). */
export function ActionButton({
  action,
  fields,
  confirm: confirmText,
  children,
  tone = "default",
}: {
  action: Action;
  fields: Record<string, string>;
  confirm?: string;
  children: ReactNode;
  tone?: "default" | "danger";
}) {
  return (
    <ActionForm action={action} className="inline-flex flex-wrap items-center gap-2">
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <button
        type="submit"
        onClick={(e) => {
          if (confirmText && !window.confirm(confirmText)) e.preventDefault();
        }}
        className={`min-h-9 rounded-md px-2 text-sm underline underline-offset-4 disabled:opacity-50 ${
          tone === "danger" ? "text-danger hover:text-ink" : "text-muted hover:text-ink"
        }`}
      >
        {children}
      </button>
    </ActionForm>
  );
}

export function CopyButton({ text, label = "Copy link" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          window.prompt("Copy this link:", text);
        }
      }}
      className="min-h-9 rounded-md px-2 text-sm text-muted underline underline-offset-4 hover:text-ink"
    >
      {copied ? "Copied" : label}
    </button>
  );
}

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="min-h-11 rounded-lg bg-accent px-4 font-medium text-white hover:bg-accent-dark"
    >
      Print
    </button>
  );
}
