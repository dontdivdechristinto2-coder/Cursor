export type SeasonKey =
  | "standard"
  | "kiahk"
  | "nativity"
  | "theophany"
  | "great-lent"
  | "holy-pascha"
  | "resurrection"
  | "pentecost"
  | "apostles-fast"
  | "st-marys-fast";

export type LiturgicalSeason = {
  key: SeasonKey;
  name: string;
  description: string;
  color: "navy" | "gold" | "sky" | "purple" | "red" | "green";
  start: Date;
  end: Date;
};

export type FeastDay = {
  name: string;
  date: Date;
  description: string;
  major?: boolean;
};

export type CalendarSnapshot = {
  season: LiturgicalSeason;
  upcomingFeasts: FeastDay[];
  nextMajorFeast: FeastDay;
  daysToNextMajorFeast: number;
};

type SeasonTemplate = Omit<LiturgicalSeason, "start" | "end">;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const SEASON_COPY: Record<SeasonKey, SeasonTemplate> = {
  standard: {
    key: "standard",
    name: "Annual Season",
    description: "The regular rhythm of the Church year outside the major fasts and feasts.",
    color: "navy"
  },
  kiahk: {
    key: "kiahk",
    name: "Kiahk",
    description: "A season of praise and watchfulness preparing for the Nativity of Our Lord.",
    color: "sky"
  },
  nativity: {
    key: "nativity",
    name: "Nativity",
    description: "The joyful celebration of the Incarnation of the Word of God.",
    color: "gold"
  },
  theophany: {
    key: "theophany",
    name: "Theophany",
    description: "The manifestation of the Holy Trinity at the Baptism of Christ.",
    color: "sky"
  },
  "great-lent": {
    key: "great-lent",
    name: "Great Lent",
    description: "The holy fast of repentance, prayer, almsgiving, and preparation.",
    color: "purple"
  },
  "holy-pascha": {
    key: "holy-pascha",
    name: "Holy Pascha",
    description: "The solemn week in which the Church follows the saving Passion of Christ.",
    color: "red"
  },
  resurrection: {
    key: "resurrection",
    name: "Resurrection",
    description: "The fifty days of joy celebrating the Resurrection of Our Lord.",
    color: "gold"
  },
  pentecost: {
    key: "pentecost",
    name: "Pentecost",
    description: "The descent of the Holy Spirit and the life of the Church in the Spirit.",
    color: "green"
  },
  "apostles-fast": {
    key: "apostles-fast",
    name: "Apostles Fast",
    description: "A fast honoring the service and witness of the holy Apostles.",
    color: "green"
  },
  "st-marys-fast": {
    key: "st-marys-fast",
    name: "St Mary's Fast",
    description: "A fast honoring the Mother of God and her faithful intercessions.",
    color: "sky"
  }
};

export function getCalendarSnapshot(now = new Date()): CalendarSnapshot {
  const date = startOfDay(now);
  const seasons = getSeasonsForWindow(date.getUTCFullYear());
  const season = seasons.find((item) => isWithin(date, item.start, item.end)) ?? makeStandardSeason(date);
  const upcomingFeasts = getUpcomingFeasts(date, 6);
  const nextMajorFeast = upcomingFeasts.find((feast) => feast.major) ?? upcomingFeasts[0];

  return {
    season,
    upcomingFeasts,
    nextMajorFeast,
    daysToNextMajorFeast: daysBetween(date, nextMajorFeast.date)
  };
}

export function calculateOrthodoxPascha(gregorianYear: number): Date {
  const a = gregorianYear % 4;
  const b = gregorianYear % 7;
  const c = gregorianYear % 19;
  const d = (19 * c + 15) % 30;
  const e = (2 * a + 4 * b - d + 34) % 7;
  const month = Math.floor((d + e + 114) / 31);
  const day = ((d + e + 114) % 31) + 1;

  return julianToGregorian(gregorianYear, month, day);
}

export function julianToGregorian(year: number, month: number, day: number): Date {
  const julianDayNumber =
    Math.floor((1461 * (year + 4800 + Math.floor((month - 14) / 12))) / 4) +
    Math.floor((367 * (month - 2 - 12 * Math.floor((month - 14) / 12))) / 12) -
    Math.floor((3 * Math.floor((year + 4900 + Math.floor((month - 14) / 12)) / 100)) / 4) +
    day -
    32075;

  let l = julianDayNumber + 68569;
  const n = Math.floor((4 * l) / 146097);
  l -= Math.floor((146097 * n + 3) / 4);
  const i = Math.floor((4000 * (l + 1)) / 1461001);
  l = l - Math.floor((1461 * i) / 4) + 31;
  const j = Math.floor((80 * l) / 2447);
  const gregorianDay = l - Math.floor((2447 * j) / 80);
  l = Math.floor(j / 11);
  const gregorianMonth = j + 2 - 12 * l;
  const gregorianYear = 100 * (n - 49) + i + l;

  return utcDate(gregorianYear, gregorianMonth - 1, gregorianDay);
}

export function copticDateToGregorian(copticYear: number, copticMonth: number, copticDay: number): Date {
  const gregorianYear = copticYear + 283;
  const newYear = copticNewYear(gregorianYear);
  const offset = (copticMonth - 1) * 30 + copticDay - 1;

  return addDays(newYear, offset);
}

function getSeasonsForWindow(gregorianYear: number): LiturgicalSeason[] {
  return [gregorianYear - 1, gregorianYear, gregorianYear + 1].flatMap(getSeasonsForYear);
}

function getSeasonsForYear(gregorianYear: number): LiturgicalSeason[] {
  const pascha = calculateOrthodoxPascha(gregorianYear);
  const pentecost = addDays(pascha, 49);
  const copticYearForJanuary = gregorianYear - 284;
  const copticYearForFall = gregorianYear - 283;
  const apostlesFeast = copticDateToGregorian(copticYearForJanuary, 11, 5);

  return [
    createSeason("kiahk", copticDateToGregorian(copticYearForFall, 4, 1), copticDateToGregorian(copticYearForFall, 4, 28)),
    createSeason("nativity", copticDateToGregorian(copticYearForJanuary, 4, 29), copticDateToGregorian(copticYearForJanuary, 5, 10)),
    createSeason("theophany", copticDateToGregorian(copticYearForJanuary, 5, 11), copticDateToGregorian(copticYearForJanuary, 5, 13)),
    createSeason("great-lent", addDays(pascha, -55), addDays(pascha, -8)),
    createSeason("holy-pascha", addDays(pascha, -7), addDays(pascha, -1)),
    createSeason("resurrection", pascha, addDays(pascha, 48)),
    createSeason("pentecost", pentecost, pentecost),
    createSeason("apostles-fast", addDays(pentecost, 1), addDays(apostlesFeast, -1)),
    createSeason("st-marys-fast", copticDateToGregorian(copticYearForFall, 12, 1), copticDateToGregorian(copticYearForFall, 12, 15))
  ].filter((season) => season.end >= season.start);
}

function getUpcomingFeasts(date: Date, limit: number): FeastDay[] {
  const years = [date.getUTCFullYear(), date.getUTCFullYear() + 1, date.getUTCFullYear() + 2];
  const feasts = years.flatMap((year) => {
    const copticYearForJanuary = year - 284;
    const copticYearForFall = year - 283;
    const pascha = calculateOrthodoxPascha(year);

    return [
      feast("Nativity", copticDateToGregorian(copticYearForJanuary, 4, 29), "The birth of Our Lord Jesus Christ.", true),
      feast("Theophany", copticDateToGregorian(copticYearForJanuary, 5, 11), "The Baptism of Our Lord in the Jordan.", true),
      feast("Great Lent Begins", addDays(pascha, -55), "The beginning of the Great Fast.", true),
      feast("Holy Pascha Begins", addDays(pascha, -7), "The beginning of Holy Week.", true),
      feast("Resurrection Feast", pascha, "The Feast of the Resurrection.", true),
      feast("Pentecost", addDays(pascha, 49), "The descent of the Holy Spirit.", true),
      feast("Apostles Feast", copticDateToGregorian(copticYearForJanuary, 11, 5), "The commemoration of the Apostles Peter and Paul.", true),
      feast("St Mary's Fast Begins", copticDateToGregorian(copticYearForFall, 12, 1), "The beginning of St Mary's Fast."),
      feast("Nayrouz", copticDateToGregorian(copticYearForFall, 1, 1), "The Coptic New Year.", true),
      feast("Kiahk Begins", copticDateToGregorian(copticYearForFall, 4, 1), "The beginning of the month of Kiahk.")
    ];
  });

  return feasts
    .filter((item) => item.date >= date)
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .filter((item, index, array) => array.findIndex((other) => sameDay(other.date, item.date) && other.name === item.name) === index)
    .slice(0, limit);
}

function createSeason(key: SeasonKey, start: Date, end: Date): LiturgicalSeason {
  return {
    ...SEASON_COPY[key],
    start: startOfDay(start),
    end: startOfDay(end)
  };
}

function makeStandardSeason(date: Date): LiturgicalSeason {
  return {
    ...SEASON_COPY.standard,
    start: date,
    end: date
  };
}

function feast(name: string, date: Date, description: string, major = false): FeastDay {
  return {
    name,
    date: startOfDay(date),
    description,
    major
  };
}

function copticNewYear(gregorianYear: number): Date {
  return utcDate(gregorianYear, 8, isGregorianLeap(gregorianYear + 1) ? 12 : 11);
}

function isGregorianLeap(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * MS_PER_DAY);
}

function daysBetween(start: Date, end: Date): number {
  return Math.max(0, Math.round((startOfDay(end).getTime() - startOfDay(start).getTime()) / MS_PER_DAY));
}

function isWithin(date: Date, start: Date, end: Date): boolean {
  return date >= start && date <= end;
}

function sameDay(a: Date, b: Date): boolean {
  return a.getUTCFullYear() === b.getUTCFullYear() && a.getUTCMonth() === b.getUTCMonth() && a.getUTCDate() === b.getUTCDate();
}

function startOfDay(date: Date): Date {
  return utcDate(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function utcDate(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month, day));
}
