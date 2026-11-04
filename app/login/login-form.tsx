"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { Button, CodeInput, ErrorText, Input } from "@/components/ui";
import { sendLoginCode, verifyLoginCode } from "./actions";

export function LoginForm() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const [pending, startTransition] = useTransition();

  function sendCode(e?: FormEvent) {
    e?.preventDefault();
    setError(undefined);
    setNotice(undefined);
    startTransition(async () => {
      const result = await sendLoginCode(email);
      if (!result.ok) return setError(result.error);
      if (step === "code") setNotice("New code sent.");
      setStep("code");
    });
  }

  function submitCode(e: FormEvent) {
    e.preventDefault();
    setError(undefined);
    startTransition(async () => {
      const result = await verifyLoginCode(email, code);
      if (!result.ok) return setError(result.error);
      // New guests go straight to the RSVP, as after a QR sign-up.
      router.replace(result.firstTime ? "/rsvp" : "/");
      router.refresh();
    });
  }

  if (step === "email") {
    return (
      <form onSubmit={sendCode} className="space-y-4">
        <h1 className="font-serif text-3xl">Sign in</h1>
        <p className="text-muted">Enter the email you set up your invitation with, or the one Billy &amp; Simmi have for you.</p>
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
          {pending ? "Sending…" : "Email me a code"}
        </Button>
        <p className="text-sm text-muted">
          First time here? Scan the QR code on your invitation to get set up.
        </p>
      </form>
    );
  }

  return (
    <form onSubmit={submitCode} className="space-y-4">
      <h1 className="font-serif text-3xl">Check your email</h1>
      <p className="text-muted">
        If <strong className="text-ink">{email}</strong> is set up on our guest list,
        a code is on its way. Check spam if it doesn&apos;t show up.
      </p>
      <CodeInput required autoFocus value={code} onChange={(e) => setCode(e.target.value)} />
      <ErrorText>{error}</ErrorText>
      {notice && <p className="text-sm text-accent">{notice}</p>}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Checking…" : "Sign in"}
      </Button>
      <div className="flex justify-between">
        <Button
          type="button"
          variant="ghost"
          disabled={pending}
          onClick={() => {
            setStep("email");
            setCode("");
            setError(undefined);
          }}
        >
          Use a different email
        </Button>
        <Button type="button" variant="ghost" disabled={pending} onClick={() => sendCode()}>
          Send a new code
        </Button>
      </div>
    </form>
  );
}
