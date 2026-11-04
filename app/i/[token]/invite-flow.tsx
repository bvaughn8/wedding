"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { Button, CodeInput, ErrorText, Input } from "@/components/ui";
import {
  confirmClaim,
  sendCodeToSavedEmail,
  startClaim,
  verifySavedEmailCode,
  type ActionResult,
} from "./actions";

export type InviteGuestOption = {
  id: string;
  name: string;
  claimed: boolean;
  maskedEmail: string | null;
};

type Step =
  | { kind: "pick" }
  | { kind: "email"; guest: InviteGuestOption }
  | { kind: "code"; guest: InviteGuestOption; email?: string; sentTo: string };

export function InviteFlow({
  token,
  householdName,
  guests,
}: {
  token: string;
  householdName: string;
  guests: InviteGuestOption[];
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>({ kind: "pick" });
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<ActionResult>, onOk: (r: ActionResult & { ok: true }) => void) {
    setError(undefined);
    setNotice(undefined);
    startTransition(async () => {
      const result = await action();
      if (result.ok) onOk(result);
      else setError(result.error);
    });
  }

  function pickGuest(guest: InviteGuestOption) {
    setCode("");
    if (!guest.claimed) {
      setStep({ kind: "email", guest });
      return;
    }
    // Already set up: send a code to the email they saved last time.
    run(
      () => sendCodeToSavedEmail(token, guest.id),
      (r) => setStep({ kind: "code", guest, sentTo: r.maskedEmail ?? "your email" }),
    );
  }

  function submitEmail(e: FormEvent) {
    e.preventDefault();
    if (step.kind !== "email") return;
    const guest = step.guest;
    run(
      () => startClaim(token, guest.id, email),
      (r) => setStep({ kind: "code", guest, email, sentTo: r.maskedEmail ?? email }),
    );
  }

  function submitCode(e: FormEvent) {
    e.preventDefault();
    if (step.kind !== "code") return;
    const { guest, email: claimEmail } = step;
    run(
      () =>
        claimEmail
          ? confirmClaim(token, guest.id, claimEmail, code)
          : verifySavedEmailCode(token, guest.id, code),
      () => {
        // First-time set-up goes straight on to the RSVP; returning guests go home.
        router.replace(claimEmail ? "/rsvp" : "/");
        router.refresh();
      },
    );
  }

  function resend() {
    if (step.kind !== "code") return;
    const { guest, email: claimEmail } = step;
    run(
      () =>
        claimEmail
          ? startClaim(token, guest.id, claimEmail)
          : sendCodeToSavedEmail(token, guest.id),
      () => setNotice("New code sent."),
    );
  }

  function back() {
    setError(undefined);
    setNotice(undefined);
    setStep({ kind: "pick" });
  }

  if (step.kind === "pick") {
    return (
      <div>
        <h1 className="font-serif text-3xl">Welcome, {householdName}</h1>
        <p className="mt-2 text-muted">Who&apos;s this?</p>
        <ul className="mt-6 space-y-3">
          {guests.map((g) => (
            <li key={g.id}>
              <button
                type="button"
                disabled={pending}
                onClick={() => pickGuest(g)}
                className="flex min-h-14 w-full items-center justify-between rounded-xl border border-line bg-white px-4 text-left transition-colors hover:border-accent disabled:opacity-60"
              >
                <span className="text-lg">{g.name}</span>
                {g.claimed && (
                  <span className="text-sm text-muted">Set up · sign in</span>
                )}
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-4">
          <ErrorText>{error}</ErrorText>
        </div>
      </div>
    );
  }

  if (step.kind === "email") {
    return (
      <form onSubmit={submitEmail} className="space-y-4">
        <h1 className="font-serif text-3xl">Hi {step.guest.name.split(" ")[0]}!</h1>
        <p className="text-muted">
          Enter your email and we&apos;ll send you a code. Next time, you can sign in
          with just your email, no QR code needed.
        </p>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Email</span>
          <Input
            type="email"
            autoComplete="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <ErrorText>{error}</ErrorText>
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Sending…" : "Send my code"}
        </Button>
        <Button type="button" variant="ghost" onClick={back} className="w-full">
          That&apos;s not me
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={submitCode} className="space-y-4">
      <h1 className="font-serif text-3xl">Check your email</h1>
      <p className="text-muted">
        We sent a code to <strong className="text-ink">{step.sentTo}</strong>. It can take a
        minute; check spam if it doesn&apos;t show up.
      </p>
      <CodeInput required autoFocus value={code} onChange={(e) => setCode(e.target.value)} />
      <ErrorText>{error}</ErrorText>
      {notice && <p className="text-sm text-accent">{notice}</p>}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Checking…" : "Continue"}
      </Button>
      <div className="flex justify-between">
        <Button type="button" variant="ghost" onClick={back} disabled={pending}>
          Back
        </Button>
        <Button type="button" variant="ghost" onClick={resend} disabled={pending}>
          Send a new code
        </Button>
      </div>
    </form>
  );
}
