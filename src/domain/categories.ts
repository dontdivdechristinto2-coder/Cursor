import { BookOpen, Church, LucideIcon, MoonStar, Music } from "lucide-react";

export const CATEGORY_IDS = ["matins-liturgy", "readings", "vespers", "psalmody"] as const;

export type CategoryId = (typeof CATEGORY_IDS)[number];

export type Category = {
  id: CategoryId;
  name: string;
  icon: LucideIcon;
};

export const CATEGORIES: Category[] = [
  {
    id: "matins-liturgy",
    name: "Matins & Divine Liturgy",
    icon: Church
  },
  {
    id: "readings",
    name: "Readings",
    icon: BookOpen
  },
  {
    id: "vespers",
    name: "Vespers",
    icon: MoonStar
  },
  {
    id: "psalmody",
    name: "Psalmody",
    icon: Music
  }
];

export function getCategory(categoryId: CategoryId): Category {
  return CATEGORIES.find((category) => category.id === categoryId) ?? CATEGORIES[0];
}
