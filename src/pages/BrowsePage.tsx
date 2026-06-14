import { CategoryGrid } from "../components/CategoryGrid";

export function BrowsePage() {
  return (
    <div className="page-stack">
      <header className="page-header">
        <p className="eyebrow">Browse</p>
        <h1>Library Categories</h1>
      </header>
      <CategoryGrid browseOnly />
    </div>
  );
}
