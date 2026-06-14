import { CalendarSnapshot } from "../domain/liturgicalCalendar";

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric"
});

export function SeasonBanner({ snapshot }: { snapshot: CalendarSnapshot }) {
  return (
    <section className={`season-banner season-banner--${snapshot.season.color}`}>
      <div>
        <p className="eyebrow">Current Liturgical Season</p>
        <h2>{snapshot.season.name}</h2>
        <p>{snapshot.season.description}</p>
      </div>
      <div className="season-banner__countdown">
        <span>{snapshot.daysToNextMajorFeast}</span>
        <small>days to {snapshot.nextMajorFeast.name}</small>
      </div>
      <div className="season-banner__feasts" aria-label="Upcoming feast days">
        {snapshot.upcomingFeasts.map((feast) => (
          <div key={`${feast.name}-${feast.date.toISOString()}`}>
            <strong>{dateFormatter.format(feast.date)}</strong>
            <span>{feast.name}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
