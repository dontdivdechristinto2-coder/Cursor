import { Download, Heart, Share2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { LanguageDisplay } from "../components/LanguageDisplay";
import { getCategory } from "../domain/categories";
import { ContentAttachment, ContentItem } from "../domain/content";
import { getContentItem } from "../services/contentRepository";
import { useAuth } from "../state/AuthContext";

export function ContentDetailPage() {
  const { contentId } = useParams();
  const { profile } = useAuth();
  const [item, setItem] = useState<ContentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [favorite, setFavorite] = useState(false);

  useEffect(() => {
    if (!contentId) {
      return;
    }

    setFavorite(readFavorite(contentId));
    getContentItem(contentId, profile?.role === "Admin")
      .then(setItem)
      .finally(() => setLoading(false));
  }, [contentId, profile?.role]);

  const attachments = useMemo(() => {
    if (!item) {
      return [];
    }

    return [
      ...item.audioFiles,
      ...item.pdfFiles,
      ...item.images,
      ...item.sheetMusic
    ];
  }, [item]);

  if (!contentId) {
    return <Navigate to="/browse" replace />;
  }

  if (loading) {
    return <p className="muted">Loading content...</p>;
  }

  if (!item) {
    return <p className="muted">Content is not available.</p>;
  }

  const category = getCategory(item.category);

  const toggleFavorite = () => {
    const next = !favorite;
    setFavorite(next);
    writeFavorite(item.id, next);
  };

  const share = async () => {
    const shareData = {
      title: item.title,
      text: item.title,
      url: window.location.href
    };

    if (navigator.share) {
      await navigator.share(shareData);
    } else {
      await navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <article className="page-stack content-detail">
      <header className="detail-header">
        <p className="eyebrow">{category.name}</p>
        <h1>{item.title}</h1>
        <span>Service Order {item.serviceOrder}</span>
      </header>
      <div className="action-row">
        <button className={favorite ? "secondary-button is-active" : "secondary-button"} type="button" onClick={toggleFavorite}>
          <Heart aria-hidden="true" />
          Favorite
        </button>
        <a className={attachments.length ? "secondary-button" : "secondary-button is-disabled"} href={attachments[0]?.url ?? "#"} download>
          <Download aria-hidden="true" />
          Download
        </a>
        <button className="secondary-button" type="button" onClick={share}>
          <Share2 aria-hidden="true" />
          Share
        </button>
      </div>
      <LanguageDisplay item={item} />
      <InfoSection title="Liturgical Explanation" body={item.liturgicalExplanation} />
      <InfoSection title="Theological Reflection" body={item.theologicalReflection} />
      <InfoSection title="Notes" body={item.notes} />
      <section className="panel">
        <p className="eyebrow">Liturgical Context</p>
        <h2>When Is This Said?</h2>
        <p>{item.liturgicalContext.whenIsThisSaid || "Not specified."}</p>
        <div className="context-grid">
          <div>
            <strong>Before This Item</strong>
            <span>{item.liturgicalContext.beforeThisItem || "Not specified."}</span>
          </div>
          <div>
            <strong>After This Item</strong>
            <span>{item.liturgicalContext.afterThisItem || "Not specified."}</span>
          </div>
        </div>
      </section>
      <AttachmentSection title="Audio Recordings" attachments={item.audioFiles} />
      <AttachmentSection title="PDFs" attachments={item.pdfFiles} />
      <AttachmentSection title="Images" attachments={item.images} />
      <AttachmentSection title="Sheet Music" attachments={item.sheetMusic} />
      <section className="panel">
        <p className="eyebrow">Related Content</p>
        <h2>Linked Items</h2>
        {item.relatedContent.length === 0 ? (
          <p className="muted">No related items linked.</p>
        ) : (
          <div className="content-list">
            {item.relatedContent.map((relatedId) => (
              <Link className="content-row" key={relatedId} to={`/content/${relatedId}`}>
                <span>{relatedId}</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </article>
  );
}

function InfoSection({ title, body }: { title: string; body: string }) {
  return (
    <section className="panel">
      <p className="eyebrow">Education</p>
      <h2>{title}</h2>
      <p>{body || "Not specified."}</p>
    </section>
  );
}

function AttachmentSection({ title, attachments }: { title: string; attachments: ContentAttachment[] }) {
  return (
    <section className="panel">
      <p className="eyebrow">Attachments</p>
      <h2>{title}</h2>
      {attachments.length === 0 ? (
        <p className="muted">No files uploaded.</p>
      ) : (
        <div className="attachment-list">
          {attachments.map((attachment) => (
            <a href={attachment.url} key={attachment.id} target="_blank" rel="noreferrer">
              {attachment.name}
            </a>
          ))}
        </div>
      )}
    </section>
  );
}

function readFavorite(id: string): boolean {
  const stored = localStorage.getItem("copticcloud-favorites");
  const favorites = stored ? (JSON.parse(stored) as string[]) : [];
  return favorites.includes(id);
}

function writeFavorite(id: string, favorite: boolean): void {
  const stored = localStorage.getItem("copticcloud-favorites");
  const favorites = new Set(stored ? (JSON.parse(stored) as string[]) : []);

  if (favorite) {
    favorites.add(id);
  } else {
    favorites.delete(id);
  }

  localStorage.setItem("copticcloud-favorites", JSON.stringify(Array.from(favorites)));
}
