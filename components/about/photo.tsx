import type { CSSProperties } from "react";
import type { Photo as PhotoData, Tone } from "@/content/about";

const TONES: Record<Tone, [string, string]> = {
  blush: ["#f1d3ce", "#d9a39b"],
  sage: ["#d7e2cd", "#9fb48f"],
  mustard: ["#f3e2b5", "#d6b467"],
  sky: ["#d6e3eb", "#94afbf"],
};

/**
 * Shows the photo if it has a signed `src` (see withPhotoUrls in
 * about-story.tsx), otherwise a soft labelled placeholder so it's obvious
 * what goes where.
 */
export function Photo({
  photo,
  className = "",
  style,
}: {
  photo: PhotoData;
  className?: string;
  style?: CSSProperties;
}) {
  if (photo.src) {
    return (
      // Plain <img>: signed Supabase Storage URLs, sized by their container.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photo.src}
        alt={photo.alt}
        decoding="async"
        className={`h-full w-full object-cover ${className}`}
        style={{ objectPosition: photo.focus ?? "50% 50%", ...style }}
      />
    );
  }
  const [light, dark] = TONES[photo.tone];
  return (
    <div
      role="img"
      aria-label={`${photo.alt} (placeholder)`}
      className={`grid h-full w-full place-items-center ${className}`}
      style={{
        backgroundImage: `radial-gradient(circle at 30% 25%, ${light}, ${dark})`,
        ...style,
      }}
    >
      <div className="flex flex-col items-center gap-2 text-white/90">
        <svg viewBox="0 0 24 24" className="size-10" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          <path d="M4 8h3l1.5-2h7L17 8h3v11H4z" strokeLinejoin="round" />
          <circle cx="12" cy="13" r="3.5" />
        </svg>
        <span className="rounded-full bg-black/10 px-3 py-1 text-xs tracking-wide">{photo.alt}</span>
      </div>
    </div>
  );
}
