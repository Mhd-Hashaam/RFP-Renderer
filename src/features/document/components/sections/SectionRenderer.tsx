"use client";

import type { ClassifiedSection, DeviceCapability } from "@/features/document/model/types";
import { ContentSection } from "./ContentSection";
import { FeatureSection } from "./FeatureSection";
import { GallerySection } from "./GallerySection";
import { HeroSection } from "./HeroSection";

type Props = {
  section: ClassifiedSection;
  device: DeviceCapability;
  onUpdateHeading: (id: string, content: string) => void;
  onUpdateParagraph: (id: string, content: string) => void;
  onUpdateListItem: (id: string, index: number, value: string) => void;
};

/**
 * Dispatches to the correct section template based on section.role.
 * No layout logic — pure dispatch only.
 */
export function SectionRenderer({
  section,
  device,
  onUpdateHeading,
  onUpdateParagraph,
  onUpdateListItem,
}: Props) {
  const sharedProps = {
    section,
    device,
    onUpdateHeading,
    onUpdateParagraph,
    onUpdateListItem,
  };

  switch (section.role) {
    case "hero":
      return <HeroSection {...sharedProps} />;
    case "feature":
      return <FeatureSection {...sharedProps} />;
    case "gallery":
      return <GallerySection {...sharedProps} />;
    case "content":
      return <ContentSection {...sharedProps} />;
    default: {
      // Exhaustive check — TypeScript will error if a new role is added without handling it
      const _never: never = section.role;
      void _never;
      // Runtime fallback
      return <ContentSection {...sharedProps} />;
    }
  }
}
