import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { CATEGORIES, CategoryId } from "../domain/categories";
import {
  AttachmentType,
  ContentFormValues,
  ContentItem,
  PublishedStatus,
  emptyContentForm
} from "../domain/content";
import { UserProfile, UserRole } from "../domain/user";
import {
  createContentItem,
  deleteContentItem,
  listAllContent,
  updateContentItem,
  updateContentStatus,
  uploadContentAttachment
} from "../services/contentRepository";
import { listUsers, updateUserRole } from "../services/userRepository";
import { useAuth } from "../state/AuthContext";

const ATTACHMENT_TYPES: Array<{ type: AttachmentType; label: string; accept: string }> = [
  {
    type: "audio",
    label: "Audio",
    accept: "audio/*"
  },
  {
    type: "pdf",
    label: "PDF",
    accept: "application/pdf"
  },
  {
    type: "image",
    label: "Image",
    accept: "image/*"
  },
  {
    type: "sheetMusic",
    label: "Sheet Music",
    accept: "application/pdf,image/*"
  }
];

export function AdminDashboardPage() {
  const { firebaseUser } = useAuth();
  const [items, setItems] = useState<ContentItem[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const [formValues, setFormValues] = useState<ContentFormValues>(emptyContentForm);
  const [tagText, setTagText] = useState("");
  const [relatedText, setRelatedText] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    refreshAdminData();
  }, []);

  const refreshAdminData = async () => {
    const [content, userProfiles] = await Promise.all([listAllContent(), listUsers()]);
    setItems(content);
    setUsers(userProfiles);
  };

  const resetForm = () => {
    setSelectedItem(null);
    setFormValues(emptyContentForm);
    setTagText("");
    setRelatedText("");
  };

  const selectItem = (item: ContentItem) => {
    setSelectedItem(item);
    setFormValues(toFormValues(item));
    setTagText(item.tags.join(", "));
    setRelatedText(item.relatedContent.join(", "));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!firebaseUser) {
      return;
    }

    setSaving(true);
    setMessage("");

    const preparedValues: ContentFormValues = {
      ...formValues,
      title: formValues.title.trim(),
      serviceOrder: Number(formValues.serviceOrder),
      tags: parseCommaList(tagText),
      relatedContent: parseCommaList(relatedText)
    };

    try {
      if (selectedItem) {
        await updateContentItem(selectedItem.id, preparedValues, firebaseUser.uid);
        setMessage("Content updated.");
      } else {
        const id = await createContentItem(preparedValues, firebaseUser.uid);
        setMessage("Content created as draft.");
        const created = await listAllContent();
        setItems(created);
        const nextSelected = created.find((item) => item.id === id) ?? null;
        if (nextSelected) {
          selectItem(nextSelected);
        }
        return;
      }

      await refreshAdminData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save content.");
    } finally {
      setSaving(false);
    }
  };

  const handlePublishToggle = async (item: ContentItem) => {
    if (!firebaseUser) {
      return;
    }

    const nextStatus = item.publishedStatus === "Published" ? "Draft" : "Published";
    await updateContentStatus(item.id, nextStatus, firebaseUser.uid);
    await refreshAdminData();
    setMessage(`Content marked ${nextStatus}.`);
  };

  const handleDelete = async (item: ContentItem) => {
    const confirmed = window.confirm(`Delete "${item.title}"? This cannot be undone.`);
    if (!confirmed) {
      return;
    }

    await deleteContentItem(item.id);
    if (selectedItem?.id === item.id) {
      resetForm();
    }
    await refreshAdminData();
    setMessage("Content deleted.");
  };

  const handleUpload = async (type: AttachmentType, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedItem || !firebaseUser) {
      return;
    }

    const existing = selectedItem[attachmentField(type)];
    await uploadContentAttachment({
      contentId: selectedItem.id,
      file,
      type,
      existing,
      userId: firebaseUser.uid
    });
    const content = await listAllContent();
    setItems(content);
    const updatedSelected = content.find((item) => item.id === selectedItem.id) ?? null;
    if (updatedSelected) {
      selectItem(updatedSelected);
    }
    setMessage(`${file.name} uploaded.`);
  };

  const handleRoleChange = async (uid: string, role: UserRole) => {
    await updateUserRole(uid, role);
    await refreshAdminData();
  };

  return (
    <div className="page-stack admin-page">
      <header className="page-header">
        <p className="eyebrow">Admin Portal</p>
        <h1>Content & User Management</h1>
      </header>
      <section className="admin-layout">
        <aside className="panel admin-list">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Content Management</p>
              <h2>Library Items</h2>
            </div>
            <button className="secondary-button" type="button" onClick={resetForm}>
              New
            </button>
          </div>
          {items.length === 0 ? <p className="muted">No content has been created.</p> : null}
          <div className="content-list">
            {items.map((item) => (
              <button className="content-row content-row--button" key={item.id} type="button" onClick={() => selectItem(item)}>
                <span>{item.title}</span>
                <small>{item.publishedStatus}</small>
              </button>
            ))}
          </div>
        </aside>
        <section className="panel">
          <p className="eyebrow">Create / Edit Content</p>
          <h2>{selectedItem ? "Edit Content" : "Create Content"}</h2>
          <form className="stack-form admin-form" onSubmit={handleSubmit}>
            <label>
              Title
              <input value={formValues.title} onChange={(event) => updateField("title", event.target.value)} required />
            </label>
            <div className="filter-grid">
              <label>
                Category
                <select value={formValues.category} onChange={(event) => updateField("category", event.target.value as CategoryId)}>
                  {CATEGORIES.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Service Order
                <input
                  min="0"
                  type="number"
                  value={formValues.serviceOrder}
                  onChange={(event) => updateField("serviceOrder", Number(event.target.value))}
                />
              </label>
              <label>
                Published Status
                <select
                  value={formValues.publishedStatus}
                  onChange={(event) => updateField("publishedStatus", event.target.value as PublishedStatus)}
                >
                  <option value="Draft">Draft</option>
                  <option value="Published">Published</option>
                </select>
              </label>
            </div>
            <label>
              Coptic Text
              <textarea value={formValues.copticText} onChange={(event) => updateField("copticText", event.target.value)} />
            </label>
            <label>
              Arabic Text
              <textarea dir="rtl" value={formValues.arabicText} onChange={(event) => updateField("arabicText", event.target.value)} />
            </label>
            <label>
              English Translation
              <textarea value={formValues.englishTranslation} onChange={(event) => updateField("englishTranslation", event.target.value)} />
            </label>
            <label>
              Franco Transliteration
              <textarea value={formValues.francoTransliteration} onChange={(event) => updateField("francoTransliteration", event.target.value)} />
            </label>
            <label>
              Liturgical Explanation
              <textarea value={formValues.liturgicalExplanation} onChange={(event) => updateField("liturgicalExplanation", event.target.value)} />
            </label>
            <label>
              Theological Reflection
              <textarea value={formValues.theologicalReflection} onChange={(event) => updateField("theologicalReflection", event.target.value)} />
            </label>
            <label>
              Notes
              <textarea value={formValues.notes} onChange={(event) => updateField("notes", event.target.value)} />
            </label>
            <label>
              When Is This Said?
              <textarea
                value={formValues.liturgicalContext.whenIsThisSaid}
                onChange={(event) => updateContextField("whenIsThisSaid", event.target.value)}
              />
            </label>
            <div className="filter-grid">
              <label>
                Before This Item
                <input
                  value={formValues.liturgicalContext.beforeThisItem}
                  onChange={(event) => updateContextField("beforeThisItem", event.target.value)}
                />
              </label>
              <label>
                After This Item
                <input
                  value={formValues.liturgicalContext.afterThisItem}
                  onChange={(event) => updateContextField("afterThisItem", event.target.value)}
                />
              </label>
            </div>
            <label>
              Tags
              <input value={tagText} onChange={(event) => setTagText(event.target.value)} />
            </label>
            <label>
              Related Content IDs
              <input value={relatedText} onChange={(event) => setRelatedText(event.target.value)} />
            </label>
            <div className="form-row">
              <button className="primary-button" disabled={saving} type="submit">
                {saving ? "Saving..." : selectedItem ? "Save Changes" : "Create Content"}
              </button>
              {selectedItem ? (
                <>
                  <button className="secondary-button" type="button" onClick={() => handlePublishToggle(selectedItem)}>
                    {selectedItem.publishedStatus === "Published" ? "Unpublish" : "Publish"}
                  </button>
                  <button className="danger-button" type="button" onClick={() => handleDelete(selectedItem)}>
                    Delete
                  </button>
                </>
              ) : null}
            </div>
          </form>
          {message ? <p className="muted">{message}</p> : null}
        </section>
      </section>
      <section className="panel">
        <p className="eyebrow">Media Uploads</p>
        <h2>Upload Files</h2>
        {!selectedItem ? <p className="muted">Select or create content before uploading media.</p> : null}
        <div className="upload-grid">
          {ATTACHMENT_TYPES.map((upload) => (
            <label key={upload.type}>
              {upload.label}
              <input accept={upload.accept} disabled={!selectedItem} type="file" onChange={(event) => handleUpload(upload.type, event)} />
            </label>
          ))}
        </div>
      </section>
      <section className="panel">
        <p className="eyebrow">User Management</p>
        <h2>Users & Roles</h2>
        <div className="content-list">
          {users.map((user) => (
            <div className="content-row" key={user.uid}>
              <span>{user.displayName || user.email}</span>
              <select value={user.role} onChange={(event) => handleRoleChange(user.uid, event.target.value as UserRole)}>
                <option value="User">User</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
          ))}
        </div>
      </section>
    </div>
  );

  function updateField<K extends keyof ContentFormValues>(field: K, value: ContentFormValues[K]) {
    setFormValues((current) => ({
      ...current,
      [field]: value
    }));
  }

  function updateContextField<K extends keyof ContentFormValues["liturgicalContext"]>(
    field: K,
    value: ContentFormValues["liturgicalContext"][K]
  ) {
    setFormValues((current) => ({
      ...current,
      liturgicalContext: {
        ...current.liturgicalContext,
        [field]: value
      }
    }));
  }
}

function toFormValues(item: ContentItem): ContentFormValues {
  return {
    title: item.title,
    category: item.category,
    serviceOrder: item.serviceOrder,
    copticText: item.copticText,
    arabicText: item.arabicText,
    englishTranslation: item.englishTranslation,
    francoTransliteration: item.francoTransliteration,
    liturgicalExplanation: item.liturgicalExplanation,
    theologicalReflection: item.theologicalReflection,
    notes: item.notes,
    liturgicalContext: item.liturgicalContext,
    tags: item.tags,
    relatedContent: item.relatedContent,
    publishedStatus: item.publishedStatus
  };
}

function parseCommaList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
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
