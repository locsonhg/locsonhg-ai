import { NextRequest, NextResponse } from "next/server";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type TitleRequestPayload = {
  messages?: ChatMessage[];
  language?: "vi" | "en";
};

type JsonLike = Record<string, unknown>;

function pickTextFromJson(data: JsonLike): string | null {
  const candidates = ["title", "reply", "text", "response", "message"];

  for (const key of candidates) {
    const value = data[key];
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  if (
    typeof data.message === "object" &&
    data.message !== null &&
    "content" in data.message
  ) {
    const nested = data.message as Record<string, unknown>;
    if (typeof nested.content === "string" && nested.content.trim()) {
      return nested.content;
    }
  }

  return null;
}

function normalizeTitle(raw: string): string {
  const clean = raw
    .replace(/^["'`\s]+|["'`\s]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!clean) return "Doan chat moi";
  if (clean.length <= 60) return clean;
  return `${clean.slice(0, 57).trim()}...`;
}

function defaultTitle(language: "vi" | "en") {
  return language === "en" ? "New chat" : "Doan chat moi";
}

export async function POST(request: NextRequest) {
  const workerUrl = process.env.WORKER_URL;
  const workerApiKey = process.env.WORKER_API_KEY;

  if (!workerUrl || !workerApiKey) {
    return NextResponse.json(
      { error: "Missing WORKER_URL or WORKER_API_KEY in environment." },
      { status: 500 }
    );
  }

  let payload: TitleRequestPayload;

  try {
    payload = (await request.json()) as TitleRequestPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const messages = (payload.messages ?? []).filter(
    (item) => item && typeof item.content === "string" && item.content.trim()
  );
  const language = payload.language === "en" ? "en" : "vi";

  if (messages.length === 0) {
    return NextResponse.json({ title: defaultTitle(language) });
  }

  const conversation = messages
    .slice(-8)
    .map((item) => `${item.role}: ${item.content}`)
    .join("\n");

  const titlePrompt =
    language === "en"
      ? [
          "Generate a concise English chat title from this conversation.",
          "Rules:",
          "- Max 7 words",
          "- No quotes",
          "- No punctuation at the end",
          "- Focus on the main intent",
          "Conversation:",
          conversation,
        ].join("\n")
      : [
          "Generate a concise Vietnamese chat title from this conversation.",
          "Rules:",
          "- Max 7 words",
          "- No quotes",
          "- No punctuation at the end",
          "- Focus on the main intent",
          "Conversation:",
          conversation,
        ].join("\n");

  const workerResponse = await fetch(workerUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${workerApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt: titlePrompt,
      systemPrompt:
        language === "en"
          ? "You create short, accurate English titles for chat sessions."
          : "You create short, accurate Vietnamese titles for chat sessions.",
      history: [],
    }),
  });

  const raw = await workerResponse.text();

  if (!workerResponse.ok) {
    return NextResponse.json(
      { error: `Worker error (${workerResponse.status}): ${raw}` },
      { status: workerResponse.status }
    );
  }

  let extracted = raw;
  const contentType = workerResponse.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    try {
      const data = JSON.parse(raw) as JsonLike;
      extracted = pickTextFromJson(data) ?? raw;
    } catch {
      extracted = raw;
    }
  }

  return NextResponse.json({ title: normalizeTitle(extracted) });
}
