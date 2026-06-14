import { FormEvent, useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import { CATEGORIES, CategoryId } from "../domain/categories";
import { ContentItem, LanguageKey } from "../domain/content";
import { searchContent } from "../services/contentRepository";

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [initialQuery] = useState(searchParams.get("q") ?? "");
  const [queryText, setQueryText] = useState(initialQuery);
  const [category, setCategory] = useState<CategoryId | "all">("all");
  const [language, setLanguage] = useState<LanguageKey | "all">("all");
  const [tagText, setTagText] = useState("");
  const [results, setResults] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(false);

  const runSearch = useCallback(async (
    nextQueryText: string,
    nextCategory: CategoryId | "all",
    nextLanguage: LanguageKey | "all",
    nextTagText: string
  ) => {
    setLoading(true);
    const tags = nextTagText
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    try {
      setResults(
        await searchContent({
          queryText: nextQueryText,
          category: nextCategory,
          language: nextLanguage,
          tags
        })
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialQuery) {
      runSearch(initialQuery, "all", "all", "");
    }
  }, [initialQuery, runSearch]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setSearchParams(queryText.trim() ? { q: queryText.trim() } : {});
    runSearch(queryText, category, language, tagText);
  };

  return (
    <div className="page-stack">
      <header className="page-header">
        <p className="eyebrow">Global Search</p>
        <h1>Search CopticCloud</h1>
      </header>
      <form className="filter-panel" onSubmit={handleSubmit}>
        <label className="search-shell search-shell--embedded">
          <Search aria-hidden="true" />
          <input
            aria-label="Search"
            placeholder="Title, text, transliteration, or tags"
            value={queryText}
            onChange={(event) => setQueryText(event.target.value)}
          />
        </label>
        <div className="filter-grid">
          <label>
            Category
            <select value={category} onChange={(event) => setCategory(event.target.value as CategoryId | "all")}>
              <option value="all">All categories</option>
              {CATEGORIES.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Language
            <select value={language} onChange={(event) => setLanguage(event.target.value as LanguageKey | "all")}>
              <option value="all">All languages</option>
              <option value="copticText">Coptic</option>
              <option value="arabicText">Arabic</option>
              <option value="englishTranslation">English</option>
              <option value="francoTransliteration">Franco</option>
            </select>
          </label>
          <label>
            Tags
            <input placeholder="Comma-separated tags" value={tagText} onChange={(event) => setTagText(event.target.value)} />
          </label>
        </div>
        <button className="primary-button" type="submit">
          Search
        </button>
      </form>
      {loading ? <p className="muted">Searching...</p> : null}
      {!loading && results.length === 0 ? <p className="muted">No published results.</p> : null}
      <div className="content-list">
        {results.map((item) => (
          <Link className="content-row" key={item.id} to={`/content/${item.id}`}>
            <span>{item.title}</span>
            <small>{item.tags.join(", ")}</small>
          </Link>
        ))}
      </div>
    </div>
  );
}
