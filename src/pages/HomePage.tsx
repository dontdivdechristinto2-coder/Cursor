import { FormEvent, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { CategoryGrid } from "../components/CategoryGrid";
import { SeasonBanner } from "../components/SeasonBanner";
import { getCalendarSnapshot } from "../domain/liturgicalCalendar";
import { useAuth } from "../state/AuthContext";

export function HomePage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const snapshot = useMemo(() => getCalendarSnapshot(), []);

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <div className="page-stack">
      <section className="welcome-card">
        <img alt="" className="profile-image" src={profile?.photoURL} />
        <div>
          <p className="eyebrow">Welcome</p>
          <h1>{profile?.displayName ? `Peace be with you, ${profile.displayName}` : "Peace be with you"}</h1>
        </div>
      </section>
      <SeasonBanner snapshot={snapshot} />
      <form className="search-shell" role="search" onSubmit={handleSearch}>
        <Search aria-hidden="true" />
        <input
          aria-label="Global search"
          placeholder="Search CopticCloud"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </form>
      <CategoryGrid />
    </div>
  );
}
