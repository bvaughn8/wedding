// ─────────────────────────────────────────────────────────────────────────────
// PLACEHOLDER CONTENT for the "Our story" page (/about). Everything here is
// made up — replace it with the real thing.
//
// Photos live in Supabase Storage (private bucket "site-photos"), not the repo:
//   1. Supabase dashboard → Storage → site-photos → create folder "about" →
//      upload (JPG, ~2000px on the long side, under 10 MB).
//   2. Set `image` to the path inside the bucket, e.g. image: "about/simmi.jpg".
// Until a photo is set (or if the path is wrong) a labelled placeholder shows.
// Portraits look best around 4:5, timeline photos around 4:3, the intro
// photo landscape (16:9 or wider).
//
// Photos are cropped to fill their frame. `focus` says which point to keep in
// view, as "x% y%" from the photo's top-left — put it on the faces, e.g.
// focus: "50% 20%" keeps the top-middle. Default is the centre ("50% 50%").
// ─────────────────────────────────────────────────────────────────────────────

export type Tone = "blush" | "sage" | "mustard" | "sky";

export type Photo = {
  /** Path in the site-photos bucket, e.g. "about/simmi.jpg". */
  image?: string;
  /** Point to keep in view when cropped, "x% y%" (see top of file). */
  focus?: string;
  /** Filled in at render time with a signed URL; don't set by hand. */
  src?: string;
  alt: string;
  tone: Tone; // placeholder colour
};

export type Person = {
  name: string;
  tagline: string;
  bio: string;
  facts: { label: string; value: string }[];
  photo: Photo;
};

export const intro = {
  kicker: "Our story",
  title: "Billy & Simmi",
  caption: "Two people, a big world, too many airport lounge snacks.",
  photo: { alt: "Billy and Simmi together", tone: "sage", image: "couch.jpg", focus: "50% 28%" } as Photo,
};

export const simmi: Person = {
  name: "Simmi",
  tagline: "The artsy one.",
  bio: "Simmi can turn a single ball of yarn into a blanket, a hat and three gifts before most people finish their coffee. She's always down to throw clay, go on an adventure, or try out whatever Billy has cooking.",
  facts: [
    { label: "Hometown", value: "Hong Kong" },
    { label: "Always has", value: "A crochet hook" },
    { label: "Order", value: "Anything with rice" },
  ],
  photo: { alt: "Portrait of Simmi", tone: "blush", image: "simmi-orchard.jpg", focus: "38% 40%" },
};

export const billy: Person = {
  name: "Billy",
  tagline: "Early miles, late dinners.",
  bio: "Billy is happiest on a long run before the city wakes up, and second-happiest finding the best coffee and pastries afterwards. He's the one who reads every museum plaque, packs one bag for two weeks, and still somehow forgets a charger.",
  facts: [
    { label: "Hometown", value: "Catonsville, Maryland" },
    { label: "Long run", value: "Sundays, 7am" },
    { label: "Order", value: "Whatever she's having" },
  ],
  photo: { alt: "Portrait of Billy", tone: "sky", image: "billy-orchard.jpg", focus: "62% 28%" },
};

export const timeline: {
  when: string;
  title: string;
  text: string;
  photo: Photo;
}[] = [
  {
    when: "2023",
    title: "We met",
    text: "Another dating app success story, joined together over Canto cocktails, a bowl of ramen, and a riverside chat.",
    photo: { alt: "Where we met", tone: "mustard", image: "us-first.jpg", focus: "45% 36%" },
  },
  {
    when: "2019",
    title: "First weekend trip",
    text: "A weekend away that turned into a tradition: one tent, a long drive, and many fire roasted meals.",
    photo: { alt: "Our first trip", tone: "sky", image: "simmi-camping.jpg", focus: "62% 52%" },
  },
  {
    when: "2021",
    title: "First international trip",
    text: "An adventure to Belize and Guatemala to explore Mayan ruins, fry jacks, and beachside relaxation.",
    photo: { alt: "The first blanket", tone: "blush", image: "gua-pyramid.jpg", focus: "50% 24%" },
  },
  {
    when: "2023",
    title: "Race day",
    text: "One of Billy's many marathons. Simmi always on the side with a sign ready to cheer.",
    photo: { alt: "Race day", tone: "sage", image: "marathon.jpg", focus: "50% 14%" },
  },
  {
    when: "2026",
    title: "The question",
    text: "A quick detour from a tiramisu escapade. Back to the original riverside chat spot.",
    photo: { alt: "The proposal", tone: "mustard", image: "engagement.JPG", focus: "35% 65%" },
  },
];

export const stats: { value: number; suffix?: string; label: string }[] = [
  { value: 14, label: "countries together" },
  { value: 7, label: "Marathons" },
  { value: 19, label: "Crocheted hats (and counting)" },
  { value: 1000, suffix: "+", label: "dumplings shared" },
];

export const closing = {
  title: "And now, the next chapter.",
  text: "We can't wait to celebrate it with you.",
};
