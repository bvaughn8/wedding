import type { Metadata } from "next";
import { AboutStory } from "@/components/about/about-story";

export const metadata: Metadata = { title: "Our story · Billy & Simmi" };

export default function AboutPage() {
  return <AboutStory />;
}
