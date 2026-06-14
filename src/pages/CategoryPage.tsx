import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { CATEGORY_IDS, CategoryId, getCategory } from "../domain/categories";
import { ContentItem } from "../domain/content";
import { listPublishedContent } from "../services/contentRepository";

export function CategoryPage() {
  const params = useParams();
  const categoryId = params.categoryId as CategoryId | undefined;
  const category = useMemo(() => (categoryId ? getCategory(categoryId) : null), [categoryId]);
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!categoryId || !CATEGORY_IDS.includes(categoryId)) {
      return;
    }

    setLoading(true);
    listPublishedContent(categoryId)
      .then(setItems)
      .finally(() => setLoading(false));
  }, [categoryId]);

  if (!categoryId || !CATEGORY_IDS.includes(categoryId)) {
    return <Navigate to="/browse" replace />;
  }

  const Icon = category?.icon;

  return (
    <div className="page-stack">
      <header className="page-header page-header--inline">
        {Icon ? <Icon aria-hidden="true" /> : null}
        <div>
          <p className="eyebrow">Category</p>
          <h1>{category?.name}</h1>
        </div>
      </header>
      {loading ? <p className="muted">Loading published items...</p> : null}
      {!loading && items.length === 0 ? <p className="muted">No published items.</p> : null}
      <div className="content-list">
        {items.map((item) => (
          <Link className="content-row" key={item.id} to={`/content/${item.id}`}>
            <span>{item.title}</span>
            <small>Order {item.serviceOrder}</small>
          </Link>
        ))}
      </div>
    </div>
  );
}
