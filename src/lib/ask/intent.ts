import { detectProjects } from "./aliases";

export type Intent =
  | { kind: "answer"; projects: string[] }
  | { kind: "deflect" }
  | { kind: "meta" }
  | { kind: "refuse" };

export const REPLIES = {
  deflect: "I don't answer questions about employers, location or availability. For those, open contact.txt or reach Dylan on LinkedIn.",
  refuse: "I can only answer questions about Dylan and the work in this portfolio. Try: ask what is parahealth",
  meta: "I answer from the text of this portfolio only. Code picks the passages, one model call writes the answer, and a validator checks it against those passages before you see it.",
  notFound: "I couldn't find that in the portfolio. Try asking about a project by name, or type ls.",
  busy: "ask is resting right now. Try again in a little while.",
  off: "ask isn't switched on yet.",
};

const INJECTION: RegExp[] = [
  /\b(ignore|disregard|forget|override|bypass)\b.*\b(instructions?|rules?|prompts?|previous|prior|above|guidelines?|system)\b/,
  /\byou are now\b/,
  /\bact as\b/,
  /\bpretend (to be|you)\b/,
  /\b(role-?play|jailbreak|developer mode|dan mode)\b/,
  /\b(system|hidden|initial) (prompt|message|instructions?)\b/,
  /\b(repeat|print|reveal|show|output|display|echo)\b.*\b(prompt|instructions|rules|text above|everything above|above)\b/,
  /\bfrom now on\b/,
  /\bnew (instructions?|rules?|task)\b/,
  /\b(do not|don'?t) follow\b/,
  /\bforget (everything|all|that)\b/,
  /\bwhat were you (told|instructed)\b/,
  /\b(this|the following|the below|below|following) (article|text|passage|paragraph|essay|document|code|story)\b|\bthe following\b/,
  /<[^>]*>|```|\bjavascript:/,
];

/** Imperative requests for something other than a portfolio question. */
const OFF_TOPIC_COMMAND = /^(write|generate|compose|draft|translate|solve|calculate|compute|code|tell me a (joke|story)|sing|say)\b/;

/**
 * Deflected topics, phrased so they do not fire on project text
 * ("the app works offline", "available offline"). Shared with the answer validator.
 */
const DEFLECT_TOPIC: RegExp[] = [
  /\bemploy(er|ers|ed|ment)\b/,
  /\bwork(s|ed|ing)? (at|for)\b/,
  /\bworked (before|previously)\b/,
  /\b(based|located) (in|out of|near)\b/,
  /\b(lives?|resides?|residing|relocat\w*) (in|at|near|to)\b/,
  /\b(his|dylan'?s|dylan’s) (city|country|hometown|location)\b/,
  /\bavailable (for|to) (hire|work|new|freelance|roles?|contract)\b/,
  /\bopen to (work|new|opportunit\w*|roles?|hire|relocat\w*|offers)\b/,
  /\b(his|dylan'?s) availability\b/,
  /\b(hire|hiring|hirable)\b/,
  /\bfor hire\b/,
  /\b(salary|salaries|compensation|hourly rate|day rate)\b/,
  /\bhow old\b|\b(his|dylan'?s) age\b|\b\d+ years old\b/,
  /\b(go|went|goes) to (school|college|university)\b|\b(studied|graduated|attended)\b|\b(his|dylan'?s) (degree|university|college|school)\b/,
  /\b(his|dylan'?s|dylan’s) (current |previous |past |former |day )?jobs?\b|\bday job\b|\bwork history\b|\bwho pays\b/,
  /\b(his|dylan'?s|dylan’s) (rates?|pay|linkedin)\b/,
  /\blooking for (a |new )?(job|work|roles?|opportunit\w*)\b|\b(free|available) for freelance\b/,
  /\bphone( number)?\b/,
  /\b(his|dylan'?s) e-?mail\b|\be-?mail address\b/,
  /\b(home|street|mailing) address\b|\b(his|dylan'?s) address\b/,
];

/** Question shapes only meaningful when asked of the portfolio owner. */
const DEFLECT_QUESTION: RegExp[] = [
  /\bwhere\b.*\b(he|his|him|dylan|she)\b.*\b(work|works|worked|working|based|located|live|lives|study|studied)\b/,
  /\bwhere (is|was) (he|dylan|she) from\b/,
  /\bwhat (city|country|state|town)\b/,
  /\b(what|which) compan(y|ies)\b.*\b(he|his|dylan)\b/,
  /\btime ?zone\b.*\b(he|his|dylan)\b/,
  /\b(contact|reach|email|message) (him|dylan)\b/,
];

const META: RegExp[] = [
  /\bhow (does|do) (ask|this (command|bot|assistant|thing|work))\b/,
  /\bhow (was|is) (this|the) (site|website|portfolio|page) (built|made|created)\b/,
  /\bhow do you work\b/,
  /\bare you (an? )?(ai|bot|llm|robot|human|real|chatgpt|claude)\b/,
  /\bwho (made|built|wrote) (you|this (site|bot))\b/,
  /\bwhat (model|llm) (are you|do you use|is this)\b/,
];

export function touchesDeflectTopic(text: string): boolean {
  const t = text.toLowerCase();
  return DEFLECT_TOPIC.some((r) => r.test(t));
}

export function classify(q: string): Intent {
  const t = q.toLowerCase().trim();
  const bare = t.replace(/^(please|can you|could you|would you|will you)\s+/, "");
  if (INJECTION.some((r) => r.test(t)) || OFF_TOPIC_COMMAND.test(bare)) return { kind: "refuse" };

  const projects = detectProjects(q);
  if (projects.length === 0 && (touchesDeflectTopic(t) || DEFLECT_QUESTION.some((r) => r.test(t)))) {
    return { kind: "deflect" };
  }
  if (META.some((r) => r.test(t))) return { kind: "meta" };
  return { kind: "answer", projects };
}
