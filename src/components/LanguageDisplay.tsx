import { useMemo, useState } from "react";
import { ContentItem, LanguageKey } from "../domain/content";

const LANGUAGE_OPTIONS: Array<{ key: LanguageKey; label: string; direction: "ltr" | "rtl"; className?: string }> = [
  {
    key: "copticText",
    label: "Coptic",
    direction: "ltr",
    className: "text-coptic"
  },
  {
    key: "arabicText",
    label: "Arabic",
    direction: "rtl",
    className: "text-arabic"
  },
  {
    key: "englishTranslation",
    label: "English",
    direction: "ltr"
  },
  {
    key: "francoTransliteration",
    label: "Franco",
    direction: "ltr"
  }
];

export function LanguageDisplay({ item }: { item: ContentItem }) {
  const availableLanguages = useMemo(
    () => LANGUAGE_OPTIONS.filter((option) => item[option.key].trim().length > 0),
    [item]
  );
  const [selected, setSelected] = useState<LanguageKey[]>(() => availableLanguages.slice(0, 1).map((option) => option.key));

  const visibleLanguages = availableLanguages.filter((option) => selected.includes(option.key));

  if (availableLanguages.length === 0) {
    return <p className="muted">No text has been published for this item yet.</p>;
  }

  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Text</p>
          <h2>Language View</h2>
        </div>
        <button
          className="ghost-button"
          type="button"
          onClick={() => setSelected(availableLanguages.map((option) => option.key))}
        >
          Show all
        </button>
      </div>
      <div className="language-tabs" role="tablist" aria-label="Language selection">
        {availableLanguages.map((option) => (
          <button
            aria-pressed={selected.includes(option.key)}
            className={selected.includes(option.key) ? "is-active" : ""}
            key={option.key}
            type="button"
            onClick={() =>
              setSelected((current) =>
                current.includes(option.key)
                  ? current.filter((key) => key !== option.key)
                  : [...current, option.key]
              )
            }
          >
            {option.label}
          </button>
        ))}
      </div>
      <div className={`language-columns language-columns--${Math.min(visibleLanguages.length, 4)}`}>
        {visibleLanguages.map((option) => (
          <article className="language-panel" key={option.key}>
            <h3>{option.label}</h3>
            <p className={option.className} dir={option.direction}>
              {item[option.key]}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
