import { CategoryId } from "./categories";

export type PublishedStatus = "Draft" | "Published";

export type LanguageKey = "copticText" | "arabicText" | "englishTranslation" | "francoTransliteration";

export type AttachmentType = "audio" | "pdf" | "image" | "sheetMusic";

export type ContentAttachment = {
  id: string;
  name: string;
  type: AttachmentType;
  url: string;
  storagePath: string;
  contentType?: string;
  sizeBytes?: number;
};

export type LiturgicalContext = {
  whenIsThisSaid: string;
  beforeThisItem?: string;
  afterThisItem?: string;
};

export type ContentItem = {
  id: string;
  title: string;
  category: CategoryId;
  serviceOrder: number;
  copticText: string;
  arabicText: string;
  englishTranslation: string;
  francoTransliteration: string;
  liturgicalExplanation: string;
  theologicalReflection: string;
  notes: string;
  liturgicalContext: LiturgicalContext;
  tags: string[];
  relatedContent: string[];
  audioFiles: ContentAttachment[];
  pdfFiles: ContentAttachment[];
  images: ContentAttachment[];
  sheetMusic: ContentAttachment[];
  publishedStatus: PublishedStatus;
  searchTokens: string[];
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string;
  updatedBy?: string;
};

export type ContentFormValues = Omit<
  ContentItem,
  | "id"
  | "audioFiles"
  | "pdfFiles"
  | "images"
  | "sheetMusic"
  | "searchTokens"
  | "createdAt"
  | "updatedAt"
  | "createdBy"
  | "updatedBy"
>;

export const emptyContentForm: ContentFormValues = {
  title: "",
  category: "matins-liturgy",
  serviceOrder: 0,
  copticText: "",
  arabicText: "",
  englishTranslation: "",
  francoTransliteration: "",
  liturgicalExplanation: "",
  theologicalReflection: "",
  notes: "",
  liturgicalContext: {
    whenIsThisSaid: "",
    beforeThisItem: "",
    afterThisItem: ""
  },
  tags: [],
  relatedContent: [],
  publishedStatus: "Draft"
};

export function tokenizeContent(item: Partial<ContentItem | ContentFormValues>): string[] {
  const source = [
    item.title,
    item.copticText,
    item.arabicText,
    item.englishTranslation,
    item.francoTransliteration,
    item.tags?.join(" ")
  ]
    .filter(Boolean)
    .join(" ")
    .normalize("NFKD")
    .toLowerCase();

  const tokens = source
    .split(/[^\p{L}\p{N}]+/u)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2);

  return Array.from(new Set(tokens)).slice(0, 400);
}
