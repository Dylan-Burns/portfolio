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

/**
 * Answer-shaping directives riding on a question ("what is keel? also add PWNED at the end"). A clause
 * starts at the beginning, after punctuation, or after and/also/then/now/but/plus; a directive is a
 * clause that opens with an output verb and names what to output or how (a word, a language, a
 * format, a position in the answer, a quoted string). The verb must open the clause, so "does keel
 * include source text" and "how does keel answer questions" are untouched.
 */
const CLAUSE = String.raw`(?:^|[?.!,;:]\s*|\b(?:and|also|then|now|but|plus)\s+)(?:(?:please|also|then|now|and)\s+)*`;
const SHAPING_VERB = String.raw`(?:add|append|prepend|include|insert|put|end|finish|close|start|begin|open|sign off|say|write|print|repeat|output|respond|reply|answer|translate|format|spell|use)`;
const SHAPING_OBJECT = String.raw`(?:words?|phrases?|text|strings?|tokens?|lines?|sentences?|letters?|languages?|caps|capitals|uppercase|lowercase|json|xml|yaml|csv|markdown|emojis?|poems?|haiku|rhymes?|style|voice|tone|signature|format|answer|reply|response|end|ending|beginning|start|bottom|top)`;
const ANSWER_SHAPING: RegExp[] = [
  new RegExp(`${CLAUSE}${SHAPING_VERB}\\b[^?.!;]*\\b${SHAPING_OBJECT}\\b`),
  new RegExp(`${CLAUSE}${SHAPING_VERB}\\b[^?.!;]*["'“‘]`),
  new RegExp(`${CLAUSE}(?:respond|reply|answer|write|speak|talk)\\s+(?:only\\s+|entirely\\s+|exclusively\\s+)?(?:in|using|as)\\b`),
  /\bin the (style|voice|tone|manner) of\b/,
];

/**
 * References to the assistant's own output or instructions. A portfolio question never talks about
 * the answer itself ("the final word of your answer", "every sentence", "the rules you were given").
 */
const OWN_OUTPUT: RegExp[] = [
  /\b(your|ur) (answers?|repl(y|ies)|responses?|outputs?|messages?|sentences?|words?|lines?|paragraphs?|text|rules|instructions|prompts?|guidelines|system)\b/,
  /\bthe (answer|reply|response|output)\s+(must|should|has to|have to|needs? to|will|is to|ought to)\b/,
  /\bevery (sentence|word|line|paragraph|reply|answer|response)\b/,
  /\b(first|last|final|closing|opening) (words?|lines?|sentences?|letters?|paragraphs?|characters?)\b/,
  /\b(before|after) (that|this|answering|you answer|responding|you respond)\b.*\b(tell|say|show|list|print|give|repeat|reveal|write)\b/,
  /(^|[\s.,;:!?])p\.s\.?(?=[\s:,]|$)/,
  /\b(also|and|but|ps)\b[^?.!]*\b(must|should|need to|needs to|has to|have to|got to|gotta)\s+(\w+\s+)?(mention|include|contain|end|start|say|begin|use|add|state)\b/,
  /\b(rules|instructions|guidelines|directives|prompts?)\b[^?.!]*\b(were|are|have) you\b|\byou (were|are|have been) (given|told)\b/,
];

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
  ...ANSWER_SHAPING,
  ...OWN_OUTPUT,
  // The reply's language or persona ("all of it in french", "talk like a pirate"). Answers are English only.
  /\b(in|into) (french|spanish|german|italian|portuguese|dutch|russian|chinese|mandarin|cantonese|japanese|korean|arabic|hindi|hebrew|turkish|polish|swedish|greek|latin|pig latin|klingon|elvish)\b/,
  // Encodings only as a reply format ("explain outpost in emoji"), not as a fact ("ships in binary form").
  /\b(answer|reply|respond|write|say|tell|explain|describe|summari[sz]e|it|that|this|everything)\b[^?.!;]*\b(in|into|using) (morse|emojis?|leetspeak|binary|base64|hex)\b/,
  /\b(talk|speak|sound|write|answer|reply|respond)(s|ing)? like (a|an)\b/,
  // Trailing imperatives about the reply ("then say banana", "reply with lol", "apologise and say sorry").
  new RegExp(`${CLAUSE}(?:say|reply with|respond with|answer with|end with|finish with|close with|sign off with)\\b`),
  /\bapologi[sz]e\b|\bsay sorry\b/,
  // "... at the end (of each sentence)" closing the question; "what happens at the end of a retro" stays.
  /\bat the end(?: of (?:each|every|the|your|my) (?:sentence|line|answer|reply|response|paragraph)s?)?\s*(?:please|pls|thanks|thank you)?[.!?]*$/,
  /\b(?:each|every) (?:sentence|line|paragraph)\b/,
  // Personas and voices ("like a pirate", "in pirate voice", "pirate style", "as if you were").
  /\b(?:pirate|cowboy|yoda|shakespeare\w*|caveman|gangster|villain|valley girl)\b/,
  /\bin (?:a |an |the )?(?:\w+ )?(?:voice|accent|persona|dialect)\b|\bas if (?:you|u) (?:were|are)\b/,
  // Insults, intoxication, gambling, sexual content: never part of a portfolio question.
  /\b(?:stupid|dumb|idiot\w*|hate|drunk\w*|casino\w*|gambl\w*|naked|sex\w*|porn\w*)\b/,
  // The assistant's own context: passage IDs, "what you can see" (not "the projects you can see here").
  /\b(passage|chunk) ids?\b|\b(what|everything|all|anything) (that )?(you|u) can see\b/,
];

const NEGATIVE_VERDICT = String.raw`(?:bad|terrible|awful|horrible|worst|useless|pointless|garbage|trash|crap|rubbish|lie|scam|fraud|fake|joke|failure|failed|mediocre|overrated|incompetent|amateur\w*|broken|weak|disaster|mess|loser|hack)`;

/**
 * Directives that ride on a question (final fix wave), checked after person topics so a personal premise still
 * deflects. Each asks for a verdict, an insult or an agreement, or plants a "fact" for the assistant to repeat;
 * none is a question about the portfolio. Plain questions that use the same words ("how does watchtower detect
 * a bad deploy", "how does keel confirm a citation") are left alone: each rule needs the directive's shape.
 */
const DIRECTIVE: RegExp[] = [
  // A forced verdict or a word limit.
  /\b(yes or no|yes\/no|true or false|true\/false|good or bad|right or wrong)\b|\bone[- ]word\b|\b(single|one|two|three|1|2|3) words?\b/,
  // Agreement imperatives: at a clause start, at the end, or asked of the assistant.
  new RegExp(`${CLAUSE}(?:just\\s+|simply\\s+)?(?:confirm|agree|admit|acknowledge|concede|affirm)\\b`),
  /\b(confirm|agree|admit|acknowledge)\s*(it|this|that)?\s*[.!?]*$/,
  /\b(do|would|can|will|could) (you|u) (agree|confirm|admit|acknowledge)\b/,
  // Insults and mockery.
  /\b(roast\w*|insult\w*|trash[- ]?talk\w*|diss|badmouth\w*|smear|ridicule|belittle|make fun|mock (him|dylan|his|it|them|keel)|negatively|be (mean|rude|harsh|nasty|negative|brutal|savage|snarky|sarcastic|cruel))\b|\b(rude|swear|swearing|cuss\w*)\b/,
  // Assertions addressed to the assistant: notes, reminders and fake role or context labels.
  /\b(fyi|psst|for the record|keep in mind|be advised|heads up)\b|\bremember (that|this)\b|\bnote to (self|model|ai|assistant|you|u|bot|claude|the model)\b/,
  /\b(note|nb|update|context update|correction|system|assistant|user|developer|admin|passages?|context|instructions?|answerable)\s*:/,
  // Asking for a negative portrayal.
  new RegExp(String.raw`\b(describe|portray|present|depict|frame|label|characteri[sz]e|paint|rate|review|rank|call)\s+(\w+\s+){0,3}(as|like)\s+(an?\s+)?(\w+\s+)?${NEGATIVE_VERDICT}\b`),
  new RegExp(String.raw`\bcall\s+(\w+\s+){1,2}(an?\s+)?${NEGATIVE_VERDICT}\b`),
  // A negative verdict as the question ("is keel a lie", "why is dylan a bad dev").
  new RegExp(String.raw`\b(is|was|are|were)\s+(\w+\s+){1,2}(an?\s+)?(\w+\s+)?${NEGATIVE_VERDICT}\b(?!\s+(deploy|deploys|request|requests|input|inputs|fill|value|values|reading|readings|data|label|labels)\b)`),
  /\bwhat('s| is) wrong with\b|\b(flaws?|flawed|weakness(es)?|sucks?|worst thing)\b/,
  // The reply's form: case, punctuation, verse, jokes, a sign-off, a word it must contain, which passage to cite.
  /\b(lowercase|uppercase|all capitals|no capitals|no punctuation|rhym\w*|limericks?|sonnets?|poems?|haikus?|eli5|explain (it )?like i'?m|jokes?|conclude with|sign (it|off)|make sure\b.*\bappears?|cite \S+ only)\b/,
  // An instruction to ignore, in any language the rules can see.
  new RegExp(`${CLAUSE}(?:ignor\\w*|vergiss\\w*|olvida\\w*|oublie\\w*)\\b`),
  // Letters outside the Latin script (answers are English only), and long encoded blobs.
  /(?!\p{Script=Latin})\p{L}/u,
  /\b(?=[a-z0-9+/]*[a-z])(?=[a-z0-9+/]*\d)[a-z0-9+/]{16,}={0,2}(?![a-z0-9+/])|[a-z0-9+/]{12,}==?(?![a-z0-9+/=])/i,
];

/** Imperative requests for something other than a portfolio question. */
const OFF_TOPIC_COMMAND = /^(write|generate|compose|draft|translate|solve|calculate|compute|code)\b/;

/** Arithmetic ("2+2", "7 times 6"). "/" and "-" are left out: "4/4 scenarios", "10-K". */
const ARITHMETIC = /\d\s*[+*×÷^=]\s*\d|\b\d+\s+(plus|minus|times|divided by|multiplied by)\s+\d+\b/;

/** Mentions of the portfolio owner. */
const PERSON = /\b(he|him|his|dylan|dylan'?s|dylan’s|burns)\b|\b(the|its|this|portfolio|site'?s)\s+(\w+\s+)?(owner|author|creator|developer|dev|builder|guy)\b/;

/**
 * Off-topic shapes that only count when the question names neither Dylan nor a project:
 * how-to help for the visitor ("how do I reverse a linked list") and the assistant's own opinions.
 */
const UNANCHORED_OFF_TOPIC: RegExp[] = [
  /^(how|what'?s the best way|what is the best way|what'?s a good way) (do|can|should|would|to) (i|we|one)\b/,
  /^how (do|can|should|would) (i|we|one)\b/,
  /\b(your|ur) (opinion|opinions|view|views|thoughts?|take|favou?rite)\b|\bwhat do you think\b|\bdo you (like|prefer|think|believe|feel|recommend)\b/,
];

/**
 * Deflected topics, phrased so they do not fire on project text
 * ("the app works offline", "available offline"). Shared with the answer validator.
 */
const DEFLECT_TOPIC: RegExp[] = [
  /\b(his|dylan'?s|dylan’s) (employer|employment)\b|\bemployed (at|by)\b/,
  /\b(he|she|dylan|him)\s+(now |currently |previously )?work(s|ed|ing)? (at|for)\b/,
  /\b(he|dylan|him)\b[^.]{0,40}\b(still|currently|no longer)\s+(involved|working|employed|active|at|on|with|works?)\b/,
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
];

/**
 * About the owner rather than the work. Each needs a mention of Dylan (PERSON): employment around a
 * project ("what did he do before keel"), employment status, leaving a job, and social or contact handles.
 */
const ABOUT_THE_PERSON: RegExp[] = [
  /\b(he|him|his|dylan|dylan'?s|dylan’s)\b.*\b(work\w*|jobs?|careers?|employ\w*|do|doing)\b.*\b(before|after|prior to|besides|outside|apart from|other than)\b/,
  /\b(un)?employ(ed|ers?|ment)\b/,
  /\b(quit|quitting|left|leave|leaving|fired|laid off|resign\w*)\b.*\b(jobs?|position|company|employer)\b/,
  /\b(twitter|instagram|insta|tiktok|facebook|bluesky|mastodon|snapchat|youtube|github|socials)\b/,
  /\b(on|his|dylan'?s|dylan’s) x\b|\bx (handle|account)s?\b/,
  /\b(his|dylan'?s|dylan’s) (\w+ ){0,2}(handles?|usernames?|accounts?)\b/,
  // Final fix wave: employment by other words, places, building for the visitor, contact.
  /\b(compan(y|ies)|firms?|startups?|big tech|faang|for a living|profession|occupation|careers?|r[ée]sum[ée]s?|cv|9 to 5|nine to five|paychecks?|payroll|clients?|customers?)\b/,
  /\b(new|senior|junior|lead|staff|principal|full[- ]?time) (role|position|job|gig)\b|\b(a|the) position\b|\binterested in (a |an |the )?(\w+ )?(role|position|job|opportunit\w*)\b/,
  /\bwhere('s|s| is| was)\s+(he|dylan|she)\s+from\b|\b(he|dylan|she)('s|s| is| was| comes)\s+(originally\s+)?from\b/,
  /\b(he|dylan|owner|author|creator|developer|dev|builder|guy)\s+(is|was|'s)\s+(based\s+)?(in|at|near|out of)\b/,
  /\b(is|was) (he|dylan|the (\w+ )?(owner|author|creator|developer|dev|builder|guy)) (based )?(in|at|near|from|out of)\b/,
  /\b(build|make|create|design|develop|code|do)\s+(me|us|something for (me|us)|it for (me|us)|an? \w+ for (me|us))\b|\bhave (him|dylan)\b|\bwork with (him|dylan)\b/,
  /\b(get hold of|dm|direct message|send (him|dylan)|send me (his|dylan'?s))\b|\b(his|dylan'?s|dylan’s) (number|contacts?|discord|website|url|site)\b|\bdiscord\b/,
];

/** References to Dylan, as words. SUBJECT is the subset that can be the subject of "lives"/"is based". */
// "the author", "its owner", "the portfolio owner": the owner named by role.
const ROLE = String.raw`(?:the|its|this|portfolio|site'?s)\s+(?:\w+\s+)?(?:owner|author|creator|developer|dev|builder|guy)`;
const PERSON_REF = new RegExp(String.raw`\b(he|him|his|himself|dylan|dylans|burns)\b|\b${ROLE}\b`, "g");
const SUBJECT_REF = new RegExp(String.raw`\b(he|dylan|dylans|burns)\b|\b${ROLE}\b`, "g");
const MONTH = "january|february|march|april|june|july|august|september|october|november|december";
const WHEN = `${MONTH}|monday|tuesday|wednesday|thursday|friday|asap|immediately|soon|tomorrow|next (week|month|year)|right away`;

/**
 * Personal topics, by word stem in any tense, that deflect when Dylan is mentioned within `gap`
 * words on either side (or anywhere, for gap Infinity). `subjectBefore` topics need "he"/"dylan"
 * just before them ("he lives", not "his projects are live").
 */
const PERSON_TOPICS: { topic: RegExp; gap: number; subjectBefore?: boolean }[] = [
  { topic: /\b(hire|hired|hires|hiring|hirable|hireable)\b/g, gap: 3 },
  { topic: /\b(contract\w*|freelanc\w*|gigs?|consult\w*)\b/g, gap: 3 },
  { topic: new RegExp(String.raw`\b(start\w*|join\w*|begin\w*|began)\s+(\w+\s+){0,2}(${WHEN})\b|\bstart(ing)? date\b|\bwhen (can|could|would|will) (he|dylan) (start|begin|join)\b`, "g"), gap: 4 },
  { topic: /\bnotice\b/g, gap: Infinity },
  { topic: /\b(old|age|aged|born|birthday|birth ?(year|date|place))\b/g, gap: 3 },
  { topic: /\b(relocat\w*|mov(e|es|ed|ing) to|commut\w*|hometown|based (in|out of|near))\b/g, gap: 3 },
  { topic: /\b(live|lives|lived|living|reside\w*)\b/g, gap: 2, subjectBefore: true },
  { topic: /\b(salary|salaries|rates?|pay|pays|paid|paying|charg(e|es|ed|ing)|compensat\w*|earn\w*|income|wages?)\b/g, gap: 3 },
  { topic: /\b(visas?|sponsor\w*|citizen\w*|immigra\w*|nationality|green card|work (permit|authori[sz]ation))\b/g, gap: Infinity },
  { topic: /\b(degrees?|school\w*|universit\w*|college\w*|graduat\w*|bootcamp|diploma|gpa|alma mater|major(ed|ing)?)\b|(?<!case )\bstud(y|ied|ies|ying)\b/g, gap: 4 },
  { topic: /\b(married|marry|marital|wife|husband|spouse|girlfriend|boyfriend|fianc\w*|kids?|children|family|dating|divorced)\b/g, gap: 2 },
  // Final fix wave: availability, joining, searching, working arrangement, money, languages spoken, places.
  { topic: /\b(available|availability|free|busy|capacity|bandwidth|booked|book|schedule|interview\w*|recruit\w*)\b/g, gap: 3 },
  { topic: /\b(looking|seeking|searching|hunting|open to|join|joining|joined)\b/g, gap: 3 },
  { topic: /\b(remote|remotely|onsite|on-site|hybrid|in-office|in office|full[- ]?time|part[- ]?time|workplace|office)\b(?!\s+retros?\b)/g, gap: 3 },
  { topic: /\b(money|rich|wealth\w*|net worth|worth|cost|costs|hourly|fees?|make from|makes from)\b/g, gap: 3 },
  { topic: /\b(speak|speaks|spoken)\b/g, gap: 3 },
  // Current status ("does he still work on parahealth", "is he currently at keel").
  { topic: /\b(still|currently|anymore|no longer|these days|nowadays)\b/g, gap: 3 },
  { topic: /\b(town|city|cities|country|countries|state|region|area|neighbou?rhood|continent|coast|timezone|time zone)\b/g, gap: 4 },
  {
    // "an austin based dev", "london-based"; not "decisions based on".
    topic: /\b[a-z]+-based\b|\b[a-z]+ based(?=\s+(?!(?:on|upon|in|around|off|at|out)\b)[a-z])/g,
    gap: 4,
  },
];
/** "x-based" words that describe software, not a place ("a role-based app"). */
const TECH_BASED = /\b(role|sql|rule|cloud|web|browser|server|file|text|token|data|evidence|event|cookie|session|map|tile|graph|vector|keyword|python|java|team)[- ]based\b/g;

/** Word index of each match of a global regex. */
function wordPositions(t: string, re: RegExp): { start: number; end: number }[] {
  const wordAt = (i: number) => (t.slice(0, i).match(/[\p{L}\p{N}']+/gu) ?? []).length;
  return [...t.matchAll(re)].map((m) => {
    const start = wordAt(m.index);
    return { start, end: start + Math.max(0, (m[0].match(/[\p{L}\p{N}']+/gu) ?? []).length - 1) };
  });
}

function nearPerson(raw: string): boolean {
  const t = raw.replace(TECH_BASED, (m) => m.replace(/[- ]based$/, ""));
  const people = wordPositions(t, PERSON_REF);
  if (people.length === 0) return false;
  const subjects = wordPositions(t, SUBJECT_REF);
  return PERSON_TOPICS.some(({ topic, gap, subjectBefore }) =>
    wordPositions(t, topic).some((m) =>
      subjectBefore
        ? subjects.some((p) => p.start < m.start && m.start - p.start - 1 <= gap)
        : people.some((p) => (p.start > m.end ? p.start - m.end - 1 : m.start - p.end - 1) <= gap),
    ),
  );
}

/**
 * The only thing a named project exempts: a work/role/job phrase whose object is the project itself
 * ("where did he work on keel" is about Keel). It is reduced to the project name before the person
 * checks run; everything else in the question is still checked ("his job ... cartlords" deflects).
 */
const PROJECT_WORK = /\b(?:work(?:s|ed|ing)?|role|job|part|contribution)\s+(?:on|for|at|in|with)\s+(?:the\s+)?([\w.-]+)(\s+[\w.-]+)?/g;
const NOT_AN_OBJECT = new Set(["before", "after", "prior", "besides", "outside", "apart", "other", "than", "something", "anything"]);

function withoutProjectWork(t: string): string {
  return t.replace(PROJECT_WORK, (m, w1: string, w2: string | undefined) => {
    if (NOT_AN_OBJECT.has(w1)) return m;
    if (detectProjects(w1).length) return w1 + (w2 ?? "");
    if (w2 && detectProjects(w1 + w2).length) return w1 + w2;
    return m;
  });
}

/** Employers, location, availability and other personal topics: deflected whether or not a project is named. */
function isPersonTopic(t: string): boolean {
  if (PERSONAL_DATA.some((r) => r.test(t))) return true;
  const p = withoutProjectWork(t);
  return (
    touchesDeflectTopic(p) ||
    DEFLECT_QUESTION.some((r) => r.test(p)) ||
    (PERSON.test(p) && ABOUT_THE_PERSON.some((r) => r.test(p))) ||
    nearPerson(p)
  );
}

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

  // Person topics come first: naming a project never exempts them (see withoutProjectWork).
  if (isPersonTopic(t)) return { kind: "deflect" };
  if (DIRECTIVE.some((r) => r.test(t))) return { kind: "refuse" };
  const projects = detectProjects(q);
  if (META.some((r) => r.test(t))) return { kind: "meta" };
  if (projects.length === 0 && !PERSON.test(t) && UNANCHORED_OFF_TOPIC.some((r) => r.test(bare))) return { kind: "refuse" };
  return { kind: "answer", projects };
}
