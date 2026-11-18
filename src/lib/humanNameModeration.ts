import { NICKNAME_ADJECTIVES, NICKNAME_NOUNS } from "@/lib/nicknameGenerator";

export interface HumanNameDetectionResult {
  hasHumanNames: boolean;
  detectedNames: string[];
  anonymizedText: string;
  summary: string;
  guidance: string;
}

const APP_AND_NICKNAME_WORDS = new Set(
  ["olive", "guest", "anonymous", ...NICKNAME_ADJECTIVES, ...NICKNAME_NOUNS].map((w) =>
    w.toLowerCase(),
  ),
);

/**
 * Tier 1: Dedicated personal first names that are almost exclusively used as
 * human given names in modern English (flagged regardless of capitalization).
 */
const DEDICATED_FIRST_NAMES = new Set([
  "aaron",
  "abby",
  "abigail",
  "adam",
  "adrian",
  "aidan",
  "aiden",
  "alejandro",
  "alexander",
  "alexandra",
  "alexis",
  "alicia",
  "allison",
  "alyssa",
  "amanda",
  "amelia",
  "andrea",
  "andrew",
  "angela",
  "angelina",
  "anna",
  "annabelle",
  "anthony",
  "ariana",
  "arianna",
  "ashley",
  "aubrey",
  "audrey",
  "ava",
  "bailey",
  "barbara",
  "benjamin",
  "bethany",
  "brandon",
  "brayden",
  "brenda",
  "brian",
  "brianna",
  "brittany",
  "brody",
  "brooke",
  "bryce",
  "brynlee",
  "caleb",
  "camila",
  "carlos",
  "caroline",
  "cassandra",
  "catherine",
  "charlie",
  "charlotte",
  "chloe",
  "christina",
  "christopher",
  "claire",
  "clara",
  "cody",
  "colin",
  "colton",
  "connor",
  "courtney",
  "daniel",
  "danielle",
  "david",
  "derek",
  "devin",
  "diana",
  "diego",
  "dominic",
  "donald",
  "dylan",
  "easton",
  "edward",
  "elena",
  "eli",
  "eliana",
  "elias",
  "elijah",
  "elizabeth",
  "ella",
  "ellie",
  "elliot",
  "elliott",
  "emily",
  "emma",
  "eric",
  "erica",
  "ethan",
  "eva",
  "evan",
  "evelyn",
  "ezekiel",
  "ezra",
  "felicia",
  "fiona",
  "gabriel",
  "gabriella",
  "gavin",
  "george",
  "gianna",
  "grayson",
  "gregory",
  "hailey",
  "haley",
  "hannah",
  "harper",
  "henry",
  "hudson",
  "isaac",
  "isabella",
  "isabelle",
  "isaiah",
  "isla",
  "jacob",
  "jaden",
  "jake",
  "james",
  "jared",
  "jason",
  "jasper",
  "javier",
  "jaxon",
  "jayden",
  "jeffrey",
  "jennifer",
  "jeremiah",
  "jessica",
  "jillian",
  "joel",
  "joey",
  "john",
  "jonah",
  "jonathan",
  "jose",
  "joseph",
  "josh",
  "joshua",
  "josiah",
  "juan",
  "julia",
  "julian",
  "juliana",
  "justin",
  "kaitlyn",
  "katherine",
  "kathryn",
  "katie",
  "kayla",
  "keith",
  "kendra",
  "kenneth",
  "kevin",
  "khloe",
  "kimberly",
  "kyle",
  "kylie",
  "landon",
  "laura",
  "lauren",
  "layla",
  "leah",
  "leo",
  "leonardo",
  "levi",
  "liam",
  "lillian",
  "lincoln",
  "lindsey",
  "logan",
  "lucas",
  "lucy",
  "luis",
  "luke",
  "lydia",
  "mackenzie",
  "madeline",
  "madelyn",
  "madison",
  "makayla",
  "malachi",
  "marcus",
  "maria",
  "mariah",
  "marissa",
  "mateo",
  "matthew",
  "maya",
  "megan",
  "melanie",
  "melissa",
  "mia",
  "michael",
  "michelle",
  "miguel",
  "mikayla",
  "milo",
  "miranda",
  "mitchell",
  "molly",
  "natalie",
  "nathan",
  "nathaniel",
  "nicholas",
  "nicole",
  "noah",
  "nolan",
  "nora",
  "oliver",
  "olivia",
  "omar",
  "oscar",
  "owen",
  "paige",
  "patrick",
  "paul",
  "penelope",
  "peter",
  "phillip",
  "rachel",
  "raymond",
  "reagan",
  "rebecca",
  "richard",
  "robert",
  "ronald",
  "ryan",
  "sabrina",
  "samantha",
  "samuel",
  "sandra",
  "sara",
  "sarah",
  "sebastian",
  "serena",
  "shane",
  "shannon",
  "shawn",
  "shelby",
  "sierra",
  "simon",
  "skylar",
  "skyler",
  "sofia",
  "sophia",
  "sophie",
  "spencer",
  "stella",
  "stephanie",
  "stephen",
  "steven",
  "sydney",
  "teresa",
  "theodore",
  "thomas",
  "timothy",
  "toby",
  "travis",
  "trevor",
  "tristan",
  "tyler",
  "valentina",
  "valerie",
  "vanessa",
  "victoria",
  "vincent",
  "vivian",
  "wesley",
  "william",
  "wyatt",
  "xavier",
  "zach",
  "zachary",
  "zane",
  "zoe",
  "zoey",
]);

/**
 * Tier 2: Words that are common first names OR common English nouns/words
 * (only flagged when used as a capitalized proper name or in an explicit name context).
 */
const CONTEXTUAL_FIRST_NAMES = new Set([
  "alex",
  "amber",
  "angel",
  "ariel",
  "ash",
  "austin",
  "autumn",
  "avery",
  "ben",
  "bill",
  "blake",
  "bob",
  "cameron",
  "carter",
  "chad",
  "chase",
  "chris",
  "christian",
  "cole",
  "cooper",
  "crystal",
  "dan",
  "dave",
  "dean",
  "drew",
  "faith",
  "finn",
  "frank",
  "grace",
  "grant",
  "hazel",
  "hope",
  "hunter",
  "iris",
  "ivy",
  "jack",
  "jade",
  "jamie",
  "jasmine",
  "jay",
  "jesse",
  "joe",
  "jordan",
  "joy",
  "jude",
  "kai",
  "kate",
  "kelly",
  "kendall",
  "kim",
  "lane",
  "lee",
  "lily",
  "london",
  "mack",
  "maddie",
  "mark",
  "mason",
  "matt",
  "max",
  "miles",
  "morgan",
  "nick",
  "parker",
  "pat",
  "payton",
  "peyton",
  "quinn",
  "ray",
  "reed",
  "riley",
  "river",
  "rob",
  "rose",
  "rowan",
  "ruby",
  "sam",
  "sandy",
  "savannah",
  "scarlett",
  "sue",
  "summer",
  "taylor",
  "tim",
  "tom",
  "violet",
  "wade",
]);

const NON_NAME_CAPITALIZED_WORDS = new Set([
  "i",
  "i'm",
  "i've",
  "i'd",
  "i'll",
  "am",
  "aitw",
  "aita",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
  "january",
  "february",
  "march",
  "april",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
  "high",
  "middle",
  "elementary",
  "school",
  "college",
  "university",
  "class",
  "grade",
  "english",
  "math",
  "science",
  "history",
  "spanish",
  "french",
  "art",
  "band",
  "gym",
  "pe",
  "ap",
  "cool",
  "down",
  "reach",
  "out",
  "wrong",
  "home",
  "mom",
  "dad",
  "mother",
  "father",
  "brother",
  "sister",
  "sibling",
  "friend",
  "best",
  "boyfriend",
  "girlfriend",
  "teacher",
  "coach",
  "principal",
  "counselor",
  "doctor",
  "google",
  "tiktok",
  "instagram",
  "snapchat",
  "discord",
  "roblox",
  "spotify",
  "amazon",
  "starbucks",
  "reddit",
  "youtube",
  "iphone",
  "android",
  "america",
  "usa",
  "united",
  "states",
  "christmas",
  "thanksgiving",
  "halloween",
  "easter",
  "valentine",
  "spring",
  "winter",
  "fall",
  "god",
  "lord",
  "dear",
  "warmly",
  "sincerely",
  "person",
  "someone",
  "everyone",
  "nobody",
  "somebody",
  "anybody",
  "they",
  "them",
  "their",
  "the",
  "this",
  "that",
  "what",
  "when",
  "where",
  "why",
  "how",
  "because",
  "however",
  "meanwhile",
  "anyway",
  "please",
  "thank",
  "thanks",
  "sorry",
  "okay",
  "ok",
  "yes",
  "no",
  "maybe",
  "really",
  "never",
  "always",
  "sometimes",
  "today",
  "yesterday",
  "tomorrow",
  "tonight",
  "last",
  "next",
  "first",
  "second",
  "third",
  "my",
  "our",
  "your",
  "his",
  "her",
  "its",
  "and",
  "but",
  "for",
  "nor",
  "or",
  "yet",
  "so",
  "in",
  "on",
  "at",
  "to",
  "from",
  "with",
  "by",
  "about",
  "after",
  "before",
]);

function isExcludedAppWord(word: string): boolean {
  const lower = word.toLowerCase();
  return APP_AND_NICKNAME_WORDS.has(lower) || NON_NAME_CAPITALIZED_WORDS.has(lower);
}

function isSentenceStart(text: string, index: number): boolean {
  const before = text.slice(0, index).trimEnd();
  if (before.length === 0) return true;
  const lastChar = before[before.length - 1];
  return lastChar === "." || lastChar === "!" || lastChar === "?" || lastChar === "\n";
}

function isGeneratedHandleContext(text: string, start: number, end: number): boolean {
  const beforeChar = start > 0 ? text[start - 1] : "";
  const afterChar = end < text.length ? text[end] : "";
  // e.g. Mindful-Otter-482 or SunnyFox42
  if (beforeChar === "-" || afterChar === "-") return true;
  const sliceAfter = text.slice(end, end + 6);
  if (/^\d{2,4}\b/.test(sliceAfter)) return true;
  return false;
}

interface MatchSpan {
  start: number;
  end: number;
  raw: string;
  key: string;
}

function addSpan(spans: MatchSpan[], start: number, end: number, raw: string) {
  const cleaned = raw.trim();
  if (!cleaned) return;
  // Avoid overlapping spans; prefer longer span
  const overlappingIdx = spans.findIndex((s) => !(end <= s.start || start >= s.end));
  if (overlappingIdx !== -1) {
    const existing = spans[overlappingIdx];
    if (end - start > existing.end - existing.start) {
      spans[overlappingIdx] = {
        start,
        end,
        raw: cleaned,
        key: cleaned.toLowerCase(),
      };
    }
    return;
  }
  spans.push({ start, end, raw: cleaned, key: cleaned.toLowerCase() });
}

/**
 * Scans user-submitted text for actual human names (first names, full names,
 * honorific + name, or relationship-introduced names) and produces an anonymized
 * version using [Person A], [Person B], etc.
 */
export function detectHumanNames(text: string): HumanNameDetectionResult {
  if (!text || !text.trim()) {
    return {
      hasHumanNames: false,
      detectedNames: [],
      anonymizedText: text,
      summary: "No human names detected.",
      guidance: "Safe to submit.",
    };
  }

  const spans: MatchSpan[] = [];

  // 1. Honorific + Name (e.g., "Mr. Smith", "Mrs. Davis", "Ms. Lee", "Coach Rivera", "Dr. Patel")
  const honorificRegex =
    /\b(?:Mr|Mrs|Ms|Miss|Dr|Prof|Coach|Principal)\.?\s+([A-Z][a-z]{1,20}(?:\s+[A-Z][a-z]{1,20})?)\b/g;
  let m: RegExpExecArray | null;
  while ((m = honorificRegex.exec(text)) !== null) {
    const fullMatch = m[0];
    const namePart = m[1];
    if (
      !isExcludedAppWord(namePart) &&
      !isGeneratedHandleContext(text, m.index, m.index + fullMatch.length)
    ) {
      addSpan(spans, m.index, m.index + fullMatch.length, fullMatch);
    }
  }

  // 2. Explicit relationship / naming introductions
  // e.g., "my friend Emma", "my brother Jake", "named Alex", "called Sam", "my name is Chris"
  const relationIntroRegex =
    /\b(?:my\s+(?:best\s+)?(?:friend|bff|brother|sister|sibling|cousin|classmate|teammate|roommate|crush|boyfriend|girlfriend|ex|neighbor|partner)|(?:guy|girl|kid|person|someone|boy|teacher)\s+(?:named|called)|my\s+name\s+is|(?:^|[.!?]\s*)i['’]?m|(?:named|called))\s+([A-Z][a-z]{1,20}(?:\s+[A-Z](?:\.|[a-z]{1,20}))?)\b/gi;
  while ((m = relationIntroRegex.exec(text)) !== null) {
    const rawCaptured = m[1];
    const parts = rawCaptured.split(/\s+/);
    const firstWord = parts[0];
    const secondWord = parts[1];
    const includeSecond =
      Boolean(secondWord) &&
      /^[A-Z]/.test(secondWord) &&
      !isExcludedAppWord(secondWord.replace(/\.$/, ""));
    const captured = includeSecond ? `${firstWord} ${secondWord}` : firstWord;

    const startOfName = m.index + m[0].indexOf(rawCaptured);
    const endOfName = startOfName + captured.length;
    const isCapitalized = /^[A-Z]/.test(firstWord);
    const lowerFirst = firstWord.toLowerCase();

    const looksLikeName =
      DEDICATED_FIRST_NAMES.has(lowerFirst) ||
      CONTEXTUAL_FIRST_NAMES.has(lowerFirst) ||
      (isCapitalized && !isExcludedAppWord(firstWord));

    if (
      looksLikeName &&
      !isExcludedAppWord(firstWord) &&
      !isGeneratedHandleContext(text, startOfName, endOfName)
    ) {
      addSpan(spans, startOfName, endOfName, captured);
    }
  }

  // 3. Full names or First + Last Initial (e.g., "John Doe", "Emma Johnson", "Sarah K.")
  const fullNameRegex = /\b([A-Z][a-z]{1,18})\s+([A-Z](?:\.|[a-z]{2,18}))\b/g;
  while ((m = fullNameRegex.exec(text)) !== null) {
    const first = m[1];
    const second = m[2];
    const full = m[0];
    if (
      isGeneratedHandleContext(text, m.index, m.index + full.length) ||
      isExcludedAppWord(first) ||
      isExcludedAppWord(second.replace(/\.$/, ""))
    ) {
      continue;
    }
    const lowerFirst = first.toLowerCase();
    const isFirstRecognized =
      DEDICATED_FIRST_NAMES.has(lowerFirst) || CONTEXTUAL_FIRST_NAMES.has(lowerFirst);
    const isSecondInitial = /^[A-Z]\.$/.test(second);
    const midSentence = !isSentenceStart(text, m.index);

    if (isFirstRecognized || isSecondInitial || midSentence) {
      addSpan(spans, m.index, m.index + full.length, full);
    }
  }

  // 4. Individual word scan for Dedicated Names (any case) and Capitalized Contextual Names
  const wordRegex = /\b([A-Za-z]{2,20})\b/g;
  while ((m = wordRegex.exec(text)) !== null) {
    const word = m[1];
    const start = m.index;
    const end = start + word.length;
    const lower = word.toLowerCase();

    if (isExcludedAppWord(word) || isGeneratedHandleContext(text, start, end)) {
      continue;
    }

    if (DEDICATED_FIRST_NAMES.has(lower)) {
      addSpan(spans, start, end, word);
      continue;
    }

    // Tier 2 ambiguous names: only flag if capitalized and NOT at the start of a sentence
    if (
      CONTEXTUAL_FIRST_NAMES.has(lower) &&
      /^[A-Z][a-z]+$/.test(word) &&
      !isSentenceStart(text, start)
    ) {
      addSpan(spans, start, end, word);
    }
  }

  if (spans.length === 0) {
    return {
      hasHumanNames: false,
      detectedNames: [],
      anonymizedText: text,
      summary: "No human names detected.",
      guidance: "Safe to submit.",
    };
  }

  spans.sort((a, b) => a.start - b.start);

  // Assign stable [Person A], [Person B], ... labels in order of appearance
  const labelMap = new Map<string, string>();
  const detectedNames: string[] = [];
  let personIndex = 0;

  for (const span of spans) {
    if (!labelMap.has(span.key)) {
      const letter = String.fromCharCode(65 + (personIndex % 26));
      const suffix = personIndex >= 26 ? String(Math.floor(personIndex / 26) + 1) : "";
      labelMap.set(span.key, `[Person ${letter}${suffix}]`);
      detectedNames.push(span.raw);
      personIndex++;
    }
  }

  // Build anonymized string from right to left (or sequentially using slice offsets)
  let anonymizedText = "";
  let cursor = 0;
  for (const span of spans) {
    if (span.start < cursor) continue;
    anonymizedText += text.slice(cursor, span.start);
    anonymizedText += labelMap.get(span.key) ?? "[someone]";
    cursor = span.end;
  }
  anonymizedText += text.slice(cursor);

  const previewList = detectedNames.slice(0, 4).join(", ");
  const extraCount = detectedNames.length > 4 ? ` (+${detectedNames.length - 4} more)` : "";

  return {
    hasHumanNames: true,
    detectedNames,
    anonymizedText,
    summary: `No real human names are allowed on Olive (detected: ${previewList}${extraCount}).`,
    guidance:
      "To protect everyone's privacy, replace real names with roles (like 'my friend' or 'a classmate') or anonymous labels like [Person A].",
  };
}
