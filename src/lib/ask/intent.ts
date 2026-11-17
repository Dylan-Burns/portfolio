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
  // Links and markdown links: answers never carry URLs, so a question that brings one is an injection.
  /\bhttps?:\/\/|\bwww\.\w|\]\(/,
  // Directives about how the assistant must behave or format its reply.
  /^(you|u) (must|will|shall|should|have to|need to|are going to)\b/,
  /\b(respond|reply|speak|talk)\b.*\b(only|all caps|uppercase|lowercase)\b|\ball caps\b/,
];

/** Imperative requests for something other than a portfolio question. */
const OFF_TOPIC_COMMAND = /^(write|generate|compose|draft|translate|solve|calculate|compute|code|tell me a (joke|story)|sing|say)\b/;

/** Arithmetic ("2+2", "7 times 6"). "/" and "-" are left out: "4/4 scenarios", "10-K". */
const ARITHMETIC = /\d\s*[+*×÷^=]\s*\d|\b\d+\s+(plus|minus|times|divided by|multiplied by)\s+\d+\b/;

/** Mentions of the portfolio owner. */
const PERSON = /\b(he|him|his|dylan|dylan'?s|dylan’s|burns)\b/;

/**
 * Off-topic shapes that only count when the question names neither Dylan nor a project:
 * how-to help for the visitor ("how do I reverse a linked list") and the assistant's own opinions.
 */
const UNANCHORED_OFF_TOPIC: RegExp[] = [
  /^(how|what'?s the best way|what is the best way|what'?s a good way) (do|can|should|would|to) (i|we|one)\b/,
  /^how (do|can|should|would) (i|we|one)\b/,
  /\b(your|ur) (opinion|opinions|view|views|thoughts?|take|favou?rite)\b|\bwhat do you think\b|\bdo you (like|prefer|think|believe|feel|recommend)\b/,
  // General-knowledge openers: trivia shares stray words with the corpus ("world", "2022"), so the
  // retrieval floor alone does not catch it.
  /^who (won|wins|invented|discovered|wrote|painted|directed|founded|sang|played|starred|is the|was the)\b/,
  /^(when|what year|in what year) (did|was|were|is|will)\b/,
  /^how (tall|far|deep|heavy|big|hot|cold|long ago)\b/,
  /^what (is|was|are) the (capital|population|height|distance|weather|temperature|date|time|meaning)\b/,
];

/**
 * Deflected topics, phrased so they do not fire on project text
 * ("the app works offline", "available offline"). Shared with the answer validator.
 */
const DEFLECT_TOPIC: RegExp[] = [
  /\b(his|dylan'?s|dylan’s) (employer|employment)\b|\bemployed (at|by)\b/,
  /\b(he|she|dylan|him)\s+(now |currently |previously )?work(s|ed|ing)? (at|for)\b/,
  /\bworked (before|previously)\b/,
  /\b(he|she|dylan) (is |was )?(based|located) (in|out of|near)\b/,
  /\b(he|she|dylan) (now |currently )?(lives?|resides?|relocated|relocating)\b/,
  /\b(his|dylan'?s|dylan’s) (city|country|hometown|location)\b/,
  /\bavailable (for|to) (hire|work|new|freelance|roles?|contract)\b/,
  /\bopen to (work|new|opportunit\w*|roles?|hire|relocat\w*|offers)\b/,
  /\b(his|dylan'?s) availability\b/,
  /\b(hire|hiring) (him|dylan)\b|\b(he|dylan) is hiring\b|\bfor hire\b|\bhirable\b/,
  /\b(salary|salaries|hourly rate|day rate)\b|\b(his|dylan'?s) compensation\b/,
  /\bhow old (is|are) (he|dylan|she)\b|\b(his|dylan'?s) age\b|\b(he|dylan|she) is \d+ years old\b/,
  /\b(go|went|goes) to (school|college|university)\b|\b(he|she|dylan) (studied|graduated|attended)\b|\b(his|dylan'?s) (degree|university|college|school)\b/,
  /\b(his|dylan'?s|dylan’s) (current |previous |past |former |day )?jobs?\b|\bday job\b|\bwork history\b|\bwho pays\b/,
  /\b(his|dylan'?s|dylan’s) (rates?|pay|linkedin)\b/,
  /\blooking for (a |new )?(job|work|roles?|opportunit\w*)\b|\b(free|available) for freelance\b/,
  /\b(his|dylan'?s|dylan’s) phone\b|\bcall (him|dylan)( at)?\b/,
  /\b(his|dylan'?s) e-?mail\b/,
  /\b(his|dylan'?s) address\b/,
];

/** Question shapes only meaningful when asked of the portfolio owner. */
const DEFLECT_QUESTION: RegExp[] = [
  /\b(tak(e|es|ing)|accept(s|ing)?)( on)? (new |more |any )?(clients?|customers?|contracts?|commissions?|gigs?|freelance|projects|work)\b/,
  /\bhow much (does|would|will|do|did) (he|dylan) (charge|cost|bill|ask|make|earn|get paid)\b/,
  /\b(he|him|dylan)\b.*\b(charges?|charging|bills?|billing|invoices?)\b|\b(his|dylan'?s) (fees?|prices?|pricing)\b/,
  /\b(universit\w*|college|degrees?|diploma|alma mater|gpa|majored|bootcamp)\b.*\b(he|his|him|dylan)\b/,
  /\b(he|his|him|dylan)\b.*\b(universit\w*|college|degrees?|diploma|alma mater|gpa|majored|bootcamp)\b/,
  /\b(did|does) (he|dylan) (attend|study|major|graduate)\b/,
  /\b(get|be|keep|stay) in touch\b|\breach out\b|\bcontact (info|information|details)\b/,
  /\bhow (can|do|should|could|would) (i|we) (reach|contact|email|message|call|find)\b/,
  /\bphone number\b/,
  /\be-?mail address\b/,
  /\b(home|street|mailing) address\b/,
  /\bwhere\b.*\b(he|his|him|dylan|she)\b.*\b(works?|worked|working|employed)\b/,
  /\bwhere\b.*\b(he|his|him|dylan|she)\b.*\b(work|works|worked|working|based|located|live|lives|study|studied)\b/,
  /\bwhere (is|was) (he|dylan|she) from\b/,
  /\bwhat (city|country|state|town)\b/,
  /\b(what|which) compan(y|ies)\b.*\b(he|his|dylan)\b/,
  /\btime ?zone\b.*\b(he|his|dylan)\b/,
  /\b(contact|reach|email|message) (him|dylan)\b/,
];

/** Personal details deflected even when a project is also named ("tell me about keel and his phone number"). */
const PERSONAL_DATA: RegExp[] = [
  /\bphone number\b|\be-?mail address\b|\b(home|street|mailing) address\b/,
  /\b(his|dylan'?s|dylan’s) (phone|e-?mail|address|linkedin|age|salary|rates?|compensation)\b/,
  /\b(salary|salaries|hourly rate|day rate)\b/,
  /\bhow old (is|are) (he|dylan)\b/,
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
  if (INJECTION.some((r) => r.test(t)) || OFF_TOPIC_COMMAND.test(bare) || ARITHMETIC.test(t)) return { kind: "refuse" };

  const projects = detectProjects(q);
  if (PERSONAL_DATA.some((r) => r.test(t))) return { kind: "deflect" };
  if (projects.length === 0 && (touchesDeflectTopic(t) || DEFLECT_QUESTION.some((r) => r.test(t)))) {
    return { kind: "deflect" };
  }
  if (META.some((r) => r.test(t))) return { kind: "meta" };
  if (projects.length === 0 && !PERSON.test(t) && UNANCHORED_OFF_TOPIC.some((r) => r.test(bare))) return { kind: "refuse" };
  return { kind: "answer", projects };
}
