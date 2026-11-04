import { seg } from "@/lib/scroll";

/**
 * A paragraph whose words light up one after another as the scene's --p goes
 * from `from` to `to` (dim → full ink), like reading along as you scroll.
 */
export function WordReveal({
  text,
  from,
  to,
  className = "",
}: {
  text: string;
  from: number;
  to: number;
  className?: string;
}) {
  const words = text.split(/\s+/).filter(Boolean);
  const step = (to - from) / words.length;
  return (
    <p className={className}>
      {words.map((word, i) => (
        <span
          key={i}
          style={{ opacity: `calc(0.16 + 0.84 * ${seg(from + i * step, from + (i + 1) * step)})` }}
        >
          {word}{" "}
        </span>
      ))}
    </p>
  );
}
