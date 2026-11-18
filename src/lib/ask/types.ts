export type Chunk = { id: string; project: string; section: string; file: string; slug?: string; text: string };
export type Corpus = { chunks: Chunk[]; hash: string };
export type Source = { file: string; section: string; slug?: string };
export type ReplyKind = "answer" | "deflect" | "refuse" | "meta" | "busy" | "off";
export type AskReply = { kind: ReplyKind; text: string; sources: Source[] };
export type ModelAnswer = { answerable: boolean; answer: string; citations: string[] };
export const PROMPT_VERSION = "3";
export const MODEL_ID = "anthropic/claude-haiku-5.5";
