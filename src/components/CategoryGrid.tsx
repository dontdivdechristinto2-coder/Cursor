import { Link } from "react-router-dom";
import { CATEGORIES } from "../domain/categories";

export function CategoryGrid({ browseOnly = false }: { browseOnly?: boolean }) {
  return (
    <div className={browseOnly ? "category-grid category-grid--simple" : "category-grid"}>
      {CATEGORIES.map((category) => {
        const Icon = category.icon;

        return (
          <Link className="category-card" key={category.id} to={`/category/${category.id}`}>
            <Icon aria-hidden="true" />
            <span>{category.name}</span>
          </Link>
        );
      })}
    </div>
  );
}
