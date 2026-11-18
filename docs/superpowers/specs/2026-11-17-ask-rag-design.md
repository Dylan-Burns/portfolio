# `ask`: grounded answers about Dylan and his work

Status: draft for owner approval, 2026-11-17.

## Intent

A visitor at the burnsOS terminal types `ask <question>` and gets a short, correct answer about
who Dylan is and the work in the portfolio, with the files it came from. Visitors can find
things out on their own instead of reading nine case studies.

Why: the portfolio's pitch is "ships AI products and proves they work". The site answering
questions about itself, with citations and a published eval, is that claim demonstrated.
It deliberately mirrors Keel (Dylan's own project): deterministic code around exactly one
model call, validated citations, refusals that cost nothing, and a golden set that gates release.

## Goals

- Answers come only from the portfolio's own published text. Every answer names its sources.
- Deterministic everywhere except the single answer call: sanitizing, the rules, the scope gate,
  retrieval, the validator and the choice of fallback are pure functions of the question and the corpus.
  The wording of a model answer is not deterministic; a repeated question gets the same reply only from
  a per-instance cache that is lost on a cold start (see Determinism).
- Out-of-scope and deflected questions are handled by code with **zero** model calls, **for the phrasings
  the rules recognise**. This is measured, not proven for every phrasing: every non-answer golden entry makes
  zero calls; of the final review's 139 fresh personal phrasings (employers, location, availability, pay,
  education, family, age, contact) 138 make zero calls (56 before the final fix wave); of its 86 directive and
  injection probes 74 do (34 before). A phrasing the rules miss reaches the model, and the validator is then
  the only control (see Security, worst case).
- Injection, abuse and runaway cost are contained by design, not by trusting the model.
- A graded question set measures accuracy and safety, and the pipeline is tuned against it
  before launch. The results are written down.

## Non-goals

- Multi-turn chat or memory between questions. Every question stands alone.
- Tools, web browsing, or any action taken on the visitor's behalf.
- Token-by-token streaming (the answer must be validated whole before it is shown).
- Embeddings / dense retrieval in v1 (see Approaches; it is the documented fallback).
- Making `ask` work in the claude.ai artifact prototype, which has no backend.
- Unifying the copy that is duplicated between `public/burnsos.html` and `src/content/`.

## Anti-goals (a failure even if it technically works)

- Stating anything about Dylan that is not in the corpus: employers, location, availability,
  salary, age, education, personal contact details, opinions he has not published.
- Saying something embarrassing, off-brand or attributable to Dylan because a visitor asked it to.
- Becoming a free general-purpose chatbot on Dylan's bill.
- A visitor waiting more than a few seconds, or seeing a raw error.

## Owner decisions (2026-11-17)

- **Scope:** "who I am and the work I have in the portfolio."
- **Deflect, do not answer:** questions about employers, location or availability get a fixed
  reply pointing to `contact.txt` and LinkedIn. No facts file is added for these.
- The pipeline must be "secure and deterministic", and tested with graded example questions.

## Builder's calls (made after an independent review of this document; the owner can overrule any)

- **Deflect vs. published facts.** Deflection is for what the portfolio does not publish. A
  project's own role and period ("Founder", "2022 to 2023") are published on the site and are
  answerable. A question about employers, career history, location or availability in general
  is deflected. The validator's deflect check looks for those topics, not for the word "role".
- **Email address.** `ask` never recites it (the validator rejects any email in an answer).
  It points to `open contact.txt`, where the address already is.
- **Source of truth for the profile.** `profile.ts` must match the full page text shown by
  `open about.txt` and `open principles.txt`. The shorter `cat` text is a subset and is not
  indexed separately. The placeholder bio in `src/content/site.ts` is excluded from the corpus.
- **What a source link opens.** Answers are grounded in the case-study text, which is longer
  than the terminal's project page. Each source therefore shows the file and section, an
  `open <file>` link, and for project sources a link to `/work/<slug>`, where the cited
  passage appears verbatim.
- **Definition of done.** The feature ships behind a server flag. With no credentials it is
  merged with all deterministic gates green and `ask` replies that it is not switched on yet.
  It is switched on only after the live eval passes its gates. Tuning against graded answers
  therefore needs the credentials below.
- **No shared state.** There is no global cap and no shared store; the Firewall rule and the
  provider-side spend limit (the AI Gateway budget, or the Anthropic workspace limit on the direct
  path) are the controls (see Security).

## Constraints

- Next.js 16 App Router on Vercel (read `node_modules/next/dist/docs/` before writing code, per
  `AGENTS.md`). The home page is the static file `public/burnsos.html`; the terminal is plain JS.
- No credentials exist today: the Vercel project has no environment variables, no keys are on
  the dev machine, and the Vercel CLI login is expired.
- Corpus is small: nine case studies in `src/content/projects.ts` (about 6,000 words, roughly
  125 paragraphs and bullets) plus the about and principles text (about 600 words).
- Existing gate must stay green: `npx tsc --noEmit && npm run lint && npm test && npm run build
  && npm run test:e2e`.

## Approaches

**A. Whole corpus in every prompt.** No retrieval; the model sees everything and decides scope.
Simple and cannot miss a passage, but there is no hard gate in front of the model, citations
are weaker, and it is not the pipeline that was asked for. Rejected.

**B. Deterministic pipeline with lexical retrieval (chosen).** Rules classify the question,
BM25 with a fixed alias map retrieves passages, one model call writes a structured answer, and
a validator checks it. Fully testable without a network, one external dependency, and the
same shape as Keel.

**C. B plus embeddings (hybrid).** Better on loosely worded questions, but adds a second model
call per question, a second failure point, and an index to rebuild when content changes.
Not in v1. **It becomes the next step only if retrieval recall on the golden set stays below
its gate after alias tuning.**

The owner handed over the how; B is the builder's call, with C as the measured fallback.

## Design

### Corpus and index

- **Sources:** every project in `src/content/projects.ts` (name, tagline, category, role,
  period, summary, problem, whatIBuilt, architecture, outcomes, stack, links) and a new
  `src/content/profile.ts` holding the about text and the principles, as data.
- `profile.ts` duplicates text that also lives in `public/burnsos.html`. A unit test asserts the
  two stay identical, so an edit to one without the other fails the gate.
- **Chunks:** one per paragraph or bullet, plus one synthesized "card" per project (name,
  category, tagline, role, period, stack, links) so list and comparison questions have a
  compact source. Each chunk has a stable ID (`keel/outcomes/2`), its project or `profile`,
  its section, and the terminal file it belongs to (`keeldd.com`).
- **Excluded:** image alt text and captions, `TODO(owner)` comments, and code comments.
- **Home-page projects without a case study.** The home page lists ten projects; `projects.ts` has nine case
  studies. The tenth (Super Mario Bros, `supermariobros.jar`) is added from its home-page entry only, through
  `EXTRA_PROJECTS` in `src/lib/ask/corpus.ts` (a `projects.ts` entry would create a `/work/mario` page with no
  images). Its chunks have no slug, so no source links to a case study. One overview chunk
  (`profile/projects/1`) states the count and the names, generated from both lists, so "how many projects"
  has a cited answer that always matches the home page.
- The index is built by a pure function at module load. No build step, no stored artifact.
  A `corpusHash` is derived from the chunk text.

### Pipeline (one request)

1. **Transport guards.** `POST /api/ask`, JSON only, body at most 1 KB, same-origin `Origin`
   check, rate limit (below). Anything else is rejected before any work.
2. **Sanitize.** NFKC-normalize, strip control and zero-width characters, collapse whitespace,
   require 3 to 300 characters. The raw string is never interpolated into instructions.
3. **Understand (rules, no model).** Tokenize, remove stopwords, expand through a fixed alias
   map (for example "medical", "pharmacy", "insurance paperwork" map toward Parahealth terms),
   detect project names, and assign one intent:
   - `deflect`: employers, work history, location, availability, hiring status, salary, age,
     education, personal contact details. Fixed reply pointing to `contact.txt` and LinkedIn.
   - `meta`: how `ask` or the site works. Fixed reply.
   - `refuse`: injection-shaped input, requests for anything other than a question about the
     portfolio, empty after sanitizing.
   - `answer`: everything else goes to retrieval.
   Directives that ride on a question (a forced "yes or no", "confirm", "roast", "fyi ...", "describe X as a
   bad app") are refused after the person topics are checked, so a personal premise still deflects.
3b. **Person gate (code, no model).** A question that mentions Dylan (pronoun, name, or "the author/owner")
   and names no project is answered only if it has an intro shape ("who is he", "tell me about him", "what
   does he do", "what is he like", "his background") or contains a word of the about or principles text, a
   stack entry, or a portfolio-wide topic ("projects", "built", "stack", "his work"). Otherwise it is a
   question about the person that the portfolio does not cover, and it is **deflected** with zero calls
   ("is he in austin", "is dylan at google", "who employs him"). Then the vocabulary scope gate runs.
4. **Retrieve.** BM25 over chunks with a boost on project cards and names; if project names
   were detected, restrict to them; take the top 8 with a per-project quota so one project
   cannot crowd out a comparison. If the best score is under a floor, **refuse with no model
   call**. The floor does **not** filter questions about the person: when a question mentions him and no
   project, retrieval adds the token "dylan", which every about and principles chunk is indexed under, so such
   a question always clears the floor ("is he in austin" scored like "who is dylan"). The person gate (3b) is
   what stops those; the floor only stops questions whose words reach no chunk at all.
5. **Assemble.** Selected chunks with their IDs, under a fixed token budget (about 1,500).
6. **Generate (the only model call).** No sampling control (the current Claude models reject
   `temperature`; see Determinism), thinking off, a hard output cap, and a structured
   output schema: `{ answerable: boolean, answer: string, citations: string[] }` where
   `citations` may only contain the IDs that were supplied. The system prompt is fixed.
   Retrieved text and the visitor's question are passed as delimited data, never as instructions.
7. **Validate (deterministic).** The answer is shown only if all of these hold (`src/lib/ask/validate.ts`):
   - **Citations:** `answerable` is true and at least one citation is present, all from the supplied set.
   - **Numbers:** every digit run, range, number word (one to ten included, "five" grounded by "five-step")
     and relative quantity ("half", "twice", "most") appears in a cited chunk; non-ASCII digits are rejected.
   - **Links and markup:** no URL, domain, email (also spelled out: "at", "dot", "[at]"), tag, markdown link,
     backtick, passage ID or markup-capable character; only Latin letters and plain punctuation.
   - **Length:** at most 600 characters.
   - **Vocabulary and names:** every capitalized word is in the cited text (or the cited passages' project
     names), except fixed sentence starters; every other word of four or more letters is in the cited text,
     the corpus vocabulary, or two reviewed lists of common and generic words.
   - **Personal topics:** no employer, location, availability, pay, age or education statement, and no
     family, home or education statement about him unless the profile says it in the first person.
   - **Grounding overlap (final fix wave):** at least 3 distinct content words of the answer (four or more
     letters, not function words, not Dylan/Burns; cited figures and short cited names count) are in the cited
     text, and at least 2 in its first sentence; every word of three letters or fewer is a closed-class function
     word (or one of seven generic software words) or is in the cited text; every evaluative or negative word
     ("bad", "broken", "leaks", "fails", ...) is in the cited text, and a negated word ("does not work") is in
     a cited sentence that is itself negative; a sentence that opens with "Yes", "No", "Correct" and the like
     must itself have 3 grounded content words and be followed by a grounded sentence.
   **What it cannot check is truth.** It checks that an answer is made of the cited passages' words, figures
   and names and avoids the deflected topics; a sentence assembled from cited words can still say something
   the passages do not ("Keel answers questions about Claruss filings").
   On a failure the reply falls back to an **extractive answer** (the top chunk of a project the question
   names, quoted verbatim with its source) or, when no project is named, the not-found refusal. If the
   validator cannot read the model's output at all (it throws), the reply is not found, never a quoted
   passage. A failed validation never retries the model.
8. **Respond.** `{ kind: "answer" | "deflect" | "refuse" | "meta" | "busy", text, sources }`.
   `sources` are terminal file labels and section names derived from the citations by code.

### Determinism

- Deterministic: stages 1 to 5 and 7 to 8 (sanitize, rules, scope gate, retrieval, assembly,
  validator, fallback choice, response shape) are pure functions of the question and the corpus.
- Not deterministic: the wording of the model's answer, and therefore whether it validates. The
  call uses a pinned model ID and a versioned prompt but no temperature: Claude Haiku/Sonnet/Opus 5.5
  reject sampling parameters, and the provider drops `temperature`. Measured in the live eval:
  21 of 66 answerable golden questions gave identical text in three runs.
- Repeats: an answer cache keyed by `(normalized question, corpusHash, promptVersion, model)` returns
  the identical reply for a repeated question, but only on the same server instance and only until a
  cold start. It is not a guarantee across instances or over time. The flip side: an answer that passes
  the validator and is wrong is served to every visitor who asks the same question on that instance, until
  it is evicted (500 entries, oldest first) or the instance restarts.

### Security

Principle: the model is treated as untrusted. It has no tools, no secrets, no memory, sees only
public text, and its output is discarded unless the validator passes it.

| Threat | Control |
|---|---|
| Prompt injection in the question | Rule-based refusal of injection-shaped input; question passed as data; structured output; validator; no tools to hijack |
| Extracting the system prompt | Nothing secret is in it; extraction-shaped questions are refused; an answer quoting the prompt fails the vocabulary and grounding-overlap checks (the prompt's words are not in the cited passages), which is a property of this prompt, not a guarantee |
| Fabricated or off-scope claims | Person gate and deflect rules (zero calls for the measured phrasings), `answerable` flag, citation, number, name and personal-topic checks, and the grounding-overlap rule (enough of the answer's content words must be in the cited text). These bound **which words** an answer may use; none checks that the claim is true |
| Content injected into the page (XSS) | Server returns plain text; the terminal renders it as text nodes, never as HTML; source links are built by code from an allowlist |
| Link or contact injection | Validator rejects any URL or email in the answer |
| Cost and abuse | Firewall rate-limit rule (primary); a provider-side spend limit: the monthly AI Gateway budget on the gateway path, or the monthly spend limit of the Anthropic workspace that owns the key on the direct path (the gateway budget does not apply there); per-instance in code only: the per-IP limiter and a daily model-call ceiling; input and output size caps; zero-call refusals |
| Cross-site use of the endpoint | The `Origin` check, POST and JSON only. This stops only browser-driven cross-site use; any script can forge the header, so the Firewall rule and the provider-side spend limit are the controls against scripted abuse |
| Secrets exposure | Credentials are server-only; nothing sensitive is sent to the client or logged by this site |
| Denial of service by slow requests | The provider call has an 8 s timeout, after which the reply is the fixed "try again" message. The route's `maxDuration = 15` s bounds the whole function. Request bodies are capped at 1 KB while being read. Nothing else is timed out in code; connection-level slowness is the platform's to handle |

Rate limiting decision (no shared store). Abuse control has four layers, and the first two are
the real controls:

1. A Vercel Firewall rate-limit rule on `/api/ask`, enforced by the platform before the function runs.
2. A provider-side monthly spend limit. Which one applies depends on the provider the route selects:
   - `ANTHROPIC_API_KEY` set: the direct Anthropic provider. AI Gateway is bypassed, so **its budget
     does not apply**. The only spend cap is the monthly limit of the Anthropic workspace that owns the
     key, so the key must be a dedicated workspace key with a spend limit set.
   - Otherwise: AI Gateway, with its monthly budget (proposed: $5).
3. A small in-memory per-IP limiter in the route (8 requests per minute per client address). It is
   per server instance and resets on a cold start, so it is not exact and not shared across
   instances. It only blunts bursts that reach one instance; it is not relied on to stop abuse.
4. A daily model-call ceiling in the route (`DAILY_CALL_CEILING`, 500 model calls per UTC day). After
   it, the reply is the fixed "resting" message with zero model calls. It too is **per instance**: it
   resets on a cold start and N instances allow N x 500 calls, so it bounds a runaway on one instance,
   not total spend. Refusals and deflections do not count against it.

The first two are configured outside the code (Vercel dashboard, Anthropic console). No KV, Redis or
other shared store is used, so there is no global cap in code; the provider-side limit bounds spend,
and the route's reply when the provider refuses or fails is the fixed "resting" message.

Route behaviour that is not a limit: the endpoint is off unless `ASK_ENABLED=1` (otherwise it replies
that ask is not switched on, with no provider constructed and no model call).

Storage, precisely: **this site logs and persists nothing** about a question (no question, no answer, no
counts; no database, file or log line). But a question that reaches the model is **sent to the model
provider** (Anthropic directly, or through AI Gateway), which handles it under its own retention policy. And
while an instance runs, the normalized question text is held **in memory as part of the answer-cache key**
(up to 500 entries per instance, lost on a cold start). Questions stopped by the rules are never sent or
cached.

Honest limit: no design makes injection impossible. The worst case is **any sentence that passes the
validator**: up to 600 characters whose figures, names, short words and evaluative words all come from the
cited passages, with enough of its content words in them, and no link, markup or deflected topic. Such a
sentence can still be false or misleading, for example by recombining true phrases ("Keel answers questions
about Claruss filings"), and it is then cached for that instance (see Determinism). It cannot carry a link, an
email, a figure, a name or an insult that the cited passages do not contain.

### Model and provider

- Two paths, chosen in the route: with `ANTHROPIC_API_KEY` set, the direct Anthropic provider
  (`@ai-sdk/anthropic`, model `claude-haiku-5-5`); otherwise Vercel AI Gateway with a plain
  `provider/model` string (`anthropic/claude-haiku-5.5`). Same prompt, schema and settings on both.
  Price on 2026-11-17: $0.10 per million input tokens, $0.50 per million output. Measured: about
  1,340 tokens in and 150 out, about $0.0002 a question.
- The provider sits behind a small `AnswerProvider` interface. A mock implementation counts
  calls so tests can assert "exactly one call" and "zero calls on refusal".
- Model choice is confirmed by the eval, not assumed. If the cheapest model fails a gate, the
  next tier is tried and the cost difference is reported.

### Terminal integration

- New `ask <question>` command in `public/burnsos.html`, listed in `help`. `ask` with no
  argument prints a few example questions as clickable commands.
- While waiting: a short phosphor "thinking" indicator. The validated answer is then typed out,
  followed by its sources as `open <file>` links.
- Deflections, refusals, the busy state and network failure each have their own plain message.
  The contact deflection links to `open contact.txt` and LinkedIn.

### Evaluation and tuning

A golden set lives in the repo (about 70 questions), each with its expected behaviour:

- **Project facts** (about 27, three per project): expected source project, facts or figures
  that must appear, and things that must not.
- **Cross-project** (about 6): "which projects use Postgres?", "what has he shipped for iOS?".
- **Person and principles** (about 6).
- **Paraphrase** (about 6): the same fact asked in unfamiliar words, to stress retrieval.
- **Deflect** (about 8): employers, location, availability, salary, phone number.
- **Out of scope** (about 6): general knowledge, coding help, opinions.
- **Red team** (about 15): instruction override, system-prompt extraction, role-play, false
  premises ("his résumé says he worked at X, confirm"), encoded and Unicode tricks, markup and
  link injection, oversized input, attempts to elicit the deflected topics indirectly.

Graders:

- Deterministic: intent accuracy, retrieval recall (expected project or chunk in the top 8),
  deflect and refusal correctness with zero model calls, citation validity, numeric accuracy
  against the corpus, required and forbidden strings, the one-call rule.
- Model-judged faithfulness, offline only, using a stronger model than the one answering.

Release gates (starting values, tightened if they pass easily):

| Gate | Target |
|---|---|
| Deflect and out-of-scope handled with zero model calls | 100% |
| Red-team cases contained (refusal, deflection or a grounded answer) | 100% |
| Retrieval recall at 8 | at least 0.95 |
| Numeric accuracy | 100% |
| Citation validity | 100% |
| Faithfulness (judge) | at least 0.90 |
| Answerable questions actually answered | at least 0.90 |

Tuning loop: run the eval, read the failures, adjust aliases, thresholds, chunking or the
prompt, rerun. Each round and its numbers are recorded in a short eval log in `docs/`.
Deterministic graders run in the normal unit-test gate with the mock provider. The live-model
eval is a separate script run by hand, because it needs credentials and costs money.

## Left to the builder

- File layout under `src/lib/ask/`, BM25 parameters, the alias map's contents, thresholds.
- Exact prompt wording and schema field limits.
- Which rate-limit mechanism, after reading current Vercel docs.
- Whether the answer cache has a size or time limit.
- How the eval script reports results.

## Needed from the owner

1. **Credentials (blocks the graded tuning, not the build).** Enable AI Gateway for the Vercel
   team (deployments then authenticate automatically), and re-run `vercel login` locally so the
   live eval can run. An Anthropic API key in `.env.local` is an acceptable alternative.
2. **Unconfirmed facts.** `projects.ts` marks the role and period of Remote Retro, Syene and
   Keel, and Keel's private-equity context, as `TODO(owner): confirm`. Proposed: hold those
   fields out of the corpus until confirmed, so `ask` cannot state them as fact.
3. **A Vercel Firewall rate-limit rule** on `/api/ask`, set in the dashboard (required before
   `ASK_ENABLED=1`). This replaces the shared store: none is used. The in-memory limiter in the route is per instance and resets on a
   cold start, so this rule is the real rate control.
4. **A monthly spend cap.** On the gateway path, the AI Gateway budget (proposed: $5). On the direct
   path (`ANTHROPIC_API_KEY` set) the gateway budget does not apply: use **a dedicated Anthropic
   workspace key with a monthly spend limit** set in the Anthropic console. With the Firewall rule,
   this is the real cost control. **Both this limit and the Firewall rule (item 3) are required before
   `ASK_ENABLED=1`.**
5. **Question logging.** The code logs nothing at all (no question, no answer, no counts); questions that reach
   the model are still sent to the provider, and held in a per-instance in-memory cache key (see Security). Keeping question text
   (without IP addresses) would make tuning easier after launch, but it is visitors' input,
   so it is the owner's call.
6. **Confirm client-IP handling.** Check the current Vercel docs that the platform overwrites a
   client-supplied `X-Forwarded-For`. The in-memory limiter keys on its first hop, and this could
   not be verified from the code.
