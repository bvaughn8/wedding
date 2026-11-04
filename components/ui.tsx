import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

/** Centered card used by the sign-in screens. */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <p className="mb-6 text-center font-serif text-4xl tracking-wide">
          Billy <span className="text-accent">&amp;</span> Simmi
        </p>
        <div className="rounded-2xl border border-line bg-white/70 p-6 shadow-sm sm:p-8">
          {children}
        </div>
      </div>
    </main>
  );
}

export function Button({
  className = "",
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" }) {
  const styles =
    variant === "primary"
      ? "bg-accent text-white hover:bg-accent-dark disabled:opacity-60"
      : "text-muted underline underline-offset-4 hover:text-ink";
  return (
    <button
      className={`min-h-11 rounded-lg px-4 text-base font-medium transition-colors ${styles} ${className}`}
      {...props}
    />
  );
}

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      // 16px text stops iOS Safari zooming in on focus.
      className={`min-h-11 w-full rounded-lg border border-line bg-white px-3 text-base outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 ${className}`}
      {...props}
    />
  );
}

export function CodeInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Input
      inputMode="numeric"
      autoComplete="one-time-code"
      pattern="[0-9 ]*"
      maxLength={12}
      placeholder="123456"
      className="text-center font-mono text-2xl tracking-[0.4em]"
      {...props}
    />
  );
}

export function ErrorText({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className="text-sm text-danger">
      {children}
    </p>
  );
}
