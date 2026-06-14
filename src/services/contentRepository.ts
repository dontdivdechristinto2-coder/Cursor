import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  QueryConstraint,
  query,
  serverTimestamp,
  updateDoc,
  where
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { CategoryId } from "../domain/categories";
import {
  AttachmentType,
  ContentAttachment,
  ContentFormValues,
  ContentItem,
  LanguageKey,
  PublishedStatus,
  tokenizeContent
} from "../domain/content";
import { isFirebaseConfigured, requireFirebaseServices } from "./firebase";

const CONTENT_COLLECTION = "contentItems";
const LOCAL_CONTENT_KEY = "copticcloud-local-content";

export type ContentSearchFilters = {
  queryText: string;
  category?: CategoryId | "all";
  language?: LanguageKey | "all";
  tags: string[];
};

export async function listPublishedContent(category?: CategoryId): Promise<ContentItem[]> {
  if (!isFirebaseConfigured) {
    return readLocalContent()
      .filter((item) => item.publishedStatus === "Published")
      .filter((item) => !category || item.category === category)
      .sort(sortByServiceOrder);
  }

  const { db } = requireFirebaseServices();
  const constraints: QueryConstraint[] = [where("publishedStatus", "==", "Published"), orderBy("serviceOrder"), orderBy("title")];

  if (category) {
    constraints.unshift(where("category", "==", category));
  }

  const snapshot = await getDocs(query(collection(db, CONTENT_COLLECTION), ...constraints));
  return snapshot.docs.map((document) => fromContentDocument(document.id, document.data()));
}

export async function listAllContent(): Promise<ContentItem[]> {
  if (!isFirebaseConfigured) {
    return readLocalContent().sort((a, b) => (b.updatedAt?.getTime() ?? 0) - (a.updatedAt?.getTime() ?? 0));
  }

  const { db } = requireFirebaseServices();
  const snapshot = await getDocs(query(collection(db, CONTENT_COLLECTION), orderBy("updatedAt", "desc"), limit(200)));
  return snapshot.docs.map((document) => fromContentDocument(document.id, document.data()));
}

export async function getContentItem(id: string, includeDraft = false): Promise<ContentItem | null> {
  if (!isFirebaseConfigured) {
    const item = readLocalContent().find((contentItem) => contentItem.id === id) ?? null;

    if (!item || (!includeDraft && item.publishedStatus !== "Published")) {
      return null;
    }

    return item;
  }

  const { db } = requireFirebaseServices();
  const snapshot = await getDoc(doc(db, CONTENT_COLLECTION, id));

  if (!snapshot.exists()) {
    return null;
  }

  const item = fromContentDocument(snapshot.id, snapshot.data());
  if (!includeDraft && item.publishedStatus !== "Published") {
    return null;
  }

  return item;
}

export async function searchContent(filters: ContentSearchFilters): Promise<ContentItem[]> {
  if (!isFirebaseConfigured) {
    const normalizedTokens = tokenizeContent({
      title: filters.queryText,
      tags: filters.tags
    });

    return readLocalContent()
      .filter((item) => item.publishedStatus === "Published")
      .filter((item) => !filters.category || filters.category === "all" || item.category === filters.category)
      .filter((item) => matchesLanguageFilter(item, filters.language))
      .filter((item) => filters.tags.every((tag) => item.tags.includes(tag)))
      .filter((item) => normalizedTokens.length === 0 || normalizedTokens.some((token) => item.searchTokens.includes(token)))
      .sort(sortByServiceOrder)
      .slice(0, 75);
  }

  const { db } = requireFirebaseServices();
  const normalizedTokens = tokenizeContent({
    title: filters.queryText,
    tags: filters.tags
  }).slice(0, 10);
  const constraints: QueryConstraint[] = [where("publishedStatus", "==", "Published"), limit(75)];

  if (filters.category && filters.category !== "all") {
    constraints.unshift(where("category", "==", filters.category));
  }

  if (normalizedTokens.length > 0) {
    constraints.push(where("searchTokens", "array-contains-any", normalizedTokens));
  } else {
    constraints.push(orderBy("serviceOrder"));
  }

  const snapshot = await getDocs(query(collection(db, CONTENT_COLLECTION), ...constraints));
  return snapshot.docs
    .map((document) => fromContentDocument(document.id, document.data()))
    .filter((item) => item.publishedStatus === "Published")
    .filter((item) => matchesLanguageFilter(item, filters.language))
    .filter((item) => filters.tags.every((tag) => item.tags.includes(tag)));
}

export async function createContentItem(values: ContentFormValues, userId: string): Promise<string> {
  if (!isFirebaseConfigured) {
    const now = new Date();
    const id = crypto.randomUUID();
    const item: ContentItem = {
      ...values,
      id,
      audioFiles: [],
      pdfFiles: [],
      images: [],
      sheetMusic: [],
      searchTokens: tokenizeContent(values),
      createdBy: userId,
      updatedBy: userId,
      createdAt: now,
      updatedAt: now
    };
    writeLocalContent([...readLocalContent(), item]);
    return id;
  }

  const { db } = requireFirebaseServices();
  const searchTokens = tokenizeContent(values);
  const document = await addDoc(collection(db, CONTENT_COLLECTION), {
    ...values,
    audioFiles: [],
    pdfFiles: [],
    images: [],
    sheetMusic: [],
    searchTokens,
    createdBy: userId,
    updatedBy: userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  return document.id;
}

export async function updateContentItem(id: string, values: ContentFormValues, userId: string): Promise<void> {
  if (!isFirebaseConfigured) {
    const content = readLocalContent();
    writeLocalContent(
      content.map((item) =>
        item.id === id
          ? {
              ...item,
              ...values,
              searchTokens: tokenizeContent(values),
              updatedBy: userId,
              updatedAt: new Date()
            }
          : item
      )
    );
    return;
  }

  const { db } = requireFirebaseServices();

  await updateDoc(doc(db, CONTENT_COLLECTION, id), {
    ...values,
    searchTokens: tokenizeContent(values),
    updatedBy: userId,
    updatedAt: serverTimestamp()
  });
}

export async function updateContentStatus(id: string, publishedStatus: PublishedStatus, userId: string): Promise<void> {
  if (!isFirebaseConfigured) {
    writeLocalContent(
      readLocalContent().map((item) =>
        item.id === id
          ? {
              ...item,
              publishedStatus,
              updatedBy: userId,
              updatedAt: new Date()
            }
          : item
      )
    );
    return;
  }

  const { db } = requireFirebaseServices();

  await updateDoc(doc(db, CONTENT_COLLECTION, id), {
    publishedStatus,
    updatedBy: userId,
    updatedAt: serverTimestamp()
  });
}

export async function deleteContentItem(id: string): Promise<void> {
  if (!isFirebaseConfigured) {
    writeLocalContent(readLocalContent().filter((item) => item.id !== id));
    return;
  }

  const { db } = requireFirebaseServices();
  await deleteDoc(doc(db, CONTENT_COLLECTION, id));
}

export async function uploadContentAttachment(params: {
  contentId: string;
  file: File;
  type: AttachmentType;
  existing: ContentAttachment[];
  userId: string;
}): Promise<ContentAttachment[]> {
  if (!isFirebaseConfigured) {
    const attachment: ContentAttachment = {
      id: crypto.randomUUID(),
      name: params.file.name,
      type: params.type,
      url: URL.createObjectURL(params.file),
      storagePath: `local://${params.contentId}/${attachmentFolder(params.type)}/${sanitizeFileName(params.file.name)}`,
      contentType: params.file.type,
      sizeBytes: params.file.size
    };
    const nextAttachments = [...params.existing, attachment];
    const field = attachmentField(params.type);

    writeLocalContent(
      readLocalContent().map((item) =>
        item.id === params.contentId
          ? {
              ...item,
              [field]: nextAttachments,
              updatedBy: params.userId,
              updatedAt: new Date()
            }
          : item
      )
    );

    return nextAttachments;
  }

  const { db, storage } = requireFirebaseServices();
  const folder = attachmentFolder(params.type);
  const storagePath = `content/${params.contentId}/${folder}/${Date.now()}-${sanitizeFileName(params.file.name)}`;
  const storageRef = ref(storage, storagePath);
  await uploadBytes(storageRef, params.file, {
    contentType: params.file.type
  });
  const url = await getDownloadURL(storageRef);
  const attachment: ContentAttachment = {
    id: crypto.randomUUID(),
    name: params.file.name,
    type: params.type,
    url,
    storagePath,
    contentType: params.file.type,
    sizeBytes: params.file.size
  };
  const nextAttachments = [...params.existing, attachment];

  await updateDoc(doc(db, CONTENT_COLLECTION, params.contentId), {
    [attachmentField(params.type)]: nextAttachments,
    updatedBy: params.userId,
    updatedAt: serverTimestamp()
  });

  return nextAttachments;
}

function matchesLanguageFilter(item: ContentItem, language?: LanguageKey | "all"): boolean {
  if (!language || language === "all") {
    return true;
  }

  return item[language].trim().length > 0;
}

function fromContentDocument(id: string, data: Record<string, unknown>): ContentItem {
  return {
    id,
    title: String(data.title ?? ""),
    category: parseCategory(data.category),
    serviceOrder: Number(data.serviceOrder ?? 0),
    copticText: String(data.copticText ?? ""),
    arabicText: String(data.arabicText ?? ""),
    englishTranslation: String(data.englishTranslation ?? ""),
    francoTransliteration: String(data.francoTransliteration ?? ""),
    liturgicalExplanation: String(data.liturgicalExplanation ?? ""),
    theologicalReflection: String(data.theologicalReflection ?? ""),
    notes: String(data.notes ?? ""),
    liturgicalContext: {
      whenIsThisSaid: String(readNested(data.liturgicalContext, "whenIsThisSaid") ?? ""),
      beforeThisItem: String(readNested(data.liturgicalContext, "beforeThisItem") ?? ""),
      afterThisItem: String(readNested(data.liturgicalContext, "afterThisItem") ?? "")
    },
    tags: toStringArray(data.tags),
    relatedContent: toStringArray(data.relatedContent),
    audioFiles: toAttachments(data.audioFiles, "audio"),
    pdfFiles: toAttachments(data.pdfFiles, "pdf"),
    images: toAttachments(data.images, "image"),
    sheetMusic: toAttachments(data.sheetMusic, "sheetMusic"),
    publishedStatus: data.publishedStatus === "Published" ? "Published" : "Draft",
    searchTokens: toStringArray(data.searchTokens),
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
    createdBy: typeof data.createdBy === "string" ? data.createdBy : undefined,
    updatedBy: typeof data.updatedBy === "string" ? data.updatedBy : undefined
  };
}

function parseCategory(value: unknown): CategoryId {
  return value === "readings" || value === "vespers" || value === "psalmody" || value === "matins-liturgy"
    ? value
    : "matins-liturgy";
}

function toAttachments(value: unknown, type: AttachmentType): ContentAttachment[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
    .map((item) => ({
      id: String(item.id ?? crypto.randomUUID()),
      name: String(item.name ?? ""),
      type,
      url: String(item.url ?? ""),
      storagePath: String(item.storagePath ?? ""),
      contentType: typeof item.contentType === "string" ? item.contentType : undefined,
      sizeBytes: typeof item.sizeBytes === "number" ? item.sizeBytes : undefined
    }));
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function readNested(source: unknown, key: string): unknown {
  return typeof source === "object" && source !== null && key in source ? source[key as keyof typeof source] : undefined;
}

function toDate(value: unknown): Date | undefined {
  if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    return value.toDate();
  }

  return undefined;
}

function attachmentFolder(type: AttachmentType): string {
  return type === "sheetMusic" ? "sheet-music" : type;
}

function attachmentField(type: AttachmentType): "audioFiles" | "pdfFiles" | "images" | "sheetMusic" {
  if (type === "audio") {
    return "audioFiles";
  }

  if (type === "pdf") {
    return "pdfFiles";
  }

  if (type === "image") {
    return "images";
  }

  return "sheetMusic";
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-z0-9._-]/gi, "-").toLowerCase();
}

function readLocalContent(): ContentItem[] {
  const stored = localStorage.getItem(LOCAL_CONTENT_KEY);

  if (!stored) {
    return [];
  }

  try {
    const parsed = JSON.parse(stored) as Array<ContentItem & { createdAt?: string; updatedAt?: string }>;
    return parsed.map((item) => ({
      ...item,
      createdAt: item.createdAt ? new Date(item.createdAt) : undefined,
      updatedAt: item.updatedAt ? new Date(item.updatedAt) : undefined
    }));
  } catch {
    localStorage.removeItem(LOCAL_CONTENT_KEY);
    return [];
  }
}

function writeLocalContent(items: ContentItem[]): void {
  localStorage.setItem(LOCAL_CONTENT_KEY, JSON.stringify(items));
}

function sortByServiceOrder(a: ContentItem, b: ContentItem): number {
  return a.serviceOrder - b.serviceOrder || a.title.localeCompare(b.title);
}
