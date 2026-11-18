/**
 * Words the answer validator accepts without grounding, beyond COMMON_WORDS and the corpus vocabulary.
 * Lowercase, mid-sentence use only: a capitalized sentence-initial word is never satisfied by this list
 * (validate.ts). Built bottom-up (Task 11 fix round 2) from the words that caused a word-grounding rejection
 * in the cached live-model answers, plus the generic software words a reviewer named.
 *
 * Admission rule: a word is here only if it is
 *  (a) a function word, auxiliary, pronoun, preposition, conjunction, determiner (no quantifiers) or
 *      discourse word ("along", "according", "specifically"); or
 *  (b) a generic verb, adjective or noun about software or explanation that cannot by itself assert a new
 *      fact about the person or about a project's status ("database", "architecture", "request", "stores").
 * Never admitted, whatever a false rejection costs: names of places, companies, products or people; family,
 * home, education, employment, money, funding, award, legal, medical, certification or regulatory words;
 * market or comparison claims (competitors, leading, best, popular, customers, clients, market); time claims
 * (year, month, recently, launched, since); sexual, violent, drug, gambling, insulting or profane words;
 * greetings and filler (hello, thanks, sorry, okay, please, lol). tests/unit/ask/validate.test.ts enforces
 * the excluded categories.
 *
 * Rejected words from the cached answers that were NOT admitted, and why: status, title, specialty,
 * specialization (employment); credit, insurance, medicine, address (money, medical, contact); impressive,
 * notable, achievement, rival (evaluation and market claims); fail, damage (project status); desire, belief,
 * drawn, unfamiliar (statements about the person); warrants, decode (unclear, injection-adjacent); and names
 * (SQL-based, JavaScript, FastAPI, SSE, GPT-4, ...), which must come from the cited text.
 */
const FUNCTION_AND_DISCOURSE = `
  along according accordingly additionally also although among another any apart aside because besides beyond
  both despite either else elsewhere essentially even except explicitly further hence however instead itself
  likewise meanwhile moreover namely neither nevertheless nonetheless nor otherwise per rather regardless
  respectively similarly specifically still such then thereby therefore these those though through
  throughout thus together toward towards typically unless unlike upon versus via whereas whether which while
  within without yet
`;

const SOFTWARE_AND_EXPLANATION = `
  access action actions adapter add added adds api apis app application applications approach
  architecture architectures argument attempt attempts automated automatic automatically automation backend
  background batch browser bug bugs build builds built button buttons cache cached capability capable chosen
  client-side code combine combined combining command commands compute computed config configuration configure
  connection connections container content data database databases dataset debug default delete deploy
  deployed deployment describe described design designed detail detect detected develop developed device
  devices display displayed document documented documents download downloads edit editor element enable
  enabled endpoint endpoints engine enter entry error errors event events example execute export feature
  features field fields file files filter filters flow format formats framework frameworks frontend function
  functions generate generated generic give gives given handle handled handler handles implement implementation implemented
  index indexed indicate indicates input inputs install installed instance integration interface item items
  key keys language languages layer layers layout library limit limits link list load loaded local
  logic logs lookup manual mention mentioned mentions method methods mobile mode modes module modules network
  node object objects offline online operation option options outcome outcomes output outputs package page
  pages parameter parse parsed path perform performed performs pipeline platform plugin process processed
  processes protect protected protection protects query queries queue read reads rebuilt record request
  requests response responses result reversible irreversible route routes rule run runs save saved schema
  screen screens script search server server-side servers service session sessions setting settings setup
  single source specific step steps storage store stored stores stream structure structured switch switches
  sync syntax system task technical technologies technology template test tested text tool treat treats
  type typed unsupported incorrect update updated upload user users uses value values variable version view
  views web website widget window workflow write written appear appears appearing optimize optimizes
  situation situations sprint guesswork weigh weighed attempt discuss person
`;

export const ALLOW_WORDS: string[] = [...new Set(`${FUNCTION_AND_DISCOURSE} ${SOFTWARE_AND_EXPLANATION}`.split(/\s+/).filter(Boolean))].sort();
