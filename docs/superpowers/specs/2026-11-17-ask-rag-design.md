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
- Deterministic everywhere except the single answer call. Same question, same answer.
- Out-of-scope and deflected questions are handled by code with **zero** model calls.
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
- **The daily global cap needs shared state too**, exactly like the rate limit. Both use the
  same mechanism (see Security).

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
4. **Retrieve.** BM25 over chunks with a boost on project cards and names; if project names
   were detected, restrict to them; take the top 8 with a per-project quota so one project
   cannot crowd out a comparison. If the best score is under a floor, **refuse with no model
   call**.
5. **Assemble.** Selected chunks with their IDs, under a fixed token budget (about 1,500).
6. **Generate (the only model call).** Temperature 0, a hard output cap, and a structured
   output schema: `{ answerable: boolean, answer: string, citations: string[] }` where
   `citations` may only contain the IDs that were supplied. The system prompt is fixed.
   Retrieved text and the visitor's question are passed as delimited data, never as instructions.
7. **Validate (deterministic).** The answer is shown only if all of these hold:
   - `answerable` is true and at least one citation is present, all from the supplied set.
   - Every number, percentage and dollar figure in the answer appears in a cited chunk.
   - No URLs, email addresses, markup or code in the answer text.
   - It is under the length cap and does not touch a deflect topic.
   On any failure the reply falls back to an **extractive answer** (the top chunk quoted
   verbatim with its source) or a refusal. A failed validation never retries the model.
8. **Respond.** `{ kind: "answer" | "deflect" | "refuse" | "meta" | "busy", text, sources }`.
   `sources` are terminal file labels and section names derived from the citations by code.

### Determinism

- Stages 1 to 5 and 7 to 8 are pure functions of the question and the corpus.
- The model call uses temperature 0, a pinned model ID and a versioned prompt.
- An answer cache keyed by `(normalized question, corpusHash, promptVersion, model)` returns
  the identical reply for a repeated question. It is in-memory per instance, so it is a
  best-effort guarantee across instances; this is stated to the owner, not hidden.
- Temperature 0 is not a formal guarantee of identical output. The eval reports answer
  stability across repeated runs so the real figure is known.

### Security

Principle: the model is treated as untrusted. It has no tools, no secrets, no memory, sees only
public text, and its output is discarded unless the validator passes it.

| Threat | Control |
|---|---|
| Prompt injection in the question | Rule-based refusal of injection-shaped input; question passed as data; structured output; validator; no tools to hijack |
| Extracting the system prompt | Nothing secret is in it; validator rejects answers that are not grounded in cited chunks |
| Fabricated or off-scope claims | Score floor, `answerable` flag, citation and number validation, deflect list |
| Content injected into the page (XSS) | Server returns plain text; the terminal renders it as text nodes, never as HTML; source links are built by code from an allowlist |
| Link or contact injection | Validator rejects any URL or email in the answer |
| Cost and abuse | Per-IP rate limit, a daily global cap that flips `ask` to a "resting" reply, a hard spend cap on the provider account, input and output size caps, zero-call refusals |
| Cross-site use of the endpoint | Same-origin `Origin` check, POST and JSON only |
| Secrets exposure | Credentials are server-only; nothing sensitive is sent to the client or logged |
| Denial of service by slow requests | Request timeout, with a fixed "try again" reply |

Rate limiting needs a store shared across instances to be exact. The plan must pick one of:
a Vercel Firewall rate-limit rule on `/api/ask` (no code, platform-enforced) as the primary
control with an in-memory limiter as a second layer, or a small shared store. The builder
chooses after reading the current platform docs.

Honest limit: no design makes injection impossible. This one bounds the worst case to "the
visitor sees a refusal or a quoted passage from the public site".

### Model and provider

- Vercel AI Gateway with a plain `provider/model` string, per current platform guidance.
  First candidate: `anthropic/claude-haiku-5.5` (catalog price on 2026-11-17: $0.10 per million
  input tokens, $0.50 per million output). At roughly 2,000 tokens in and 200 out, a question
  costs on the order of $0.0003.
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
3. **A shared store.** An exact rate limit and daily cap need state shared across server
   instances. Proposed: a free-tier Redis store from the Vercel Marketplace, unless the plan's
   Firewall rate-limit rule covers it.
4. **A monthly spend cap** on the provider account. Proposed: $5.
5. **Question logging.** Proposed default: store nothing but counts. Keeping question text
   (without IP addresses) would make tuning easier after launch, but it is visitors' input,
   so it is the owner's call.
