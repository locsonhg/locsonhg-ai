import { NextRequest, NextResponse } from "next/server";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type WorkerRequestPayload = {
  prompt: string;
  systemPrompt?: string;
  history?: ChatMessage[];
};

const IDENTITY_SYSTEM_PROMPT =
  "You are locsonhg-ai, an AI assistant created by locsonhg. If the user asks your name or identity, always answer that you are locsonhg-ai.";

type JsonLike = Record<string, unknown>;

function pickReplyFromJson(data: JsonLike): string | null {
  const candidates = [
    "reply",
    "text",
    "response",
    "message",
    "result",
    "output",
  ];

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

export async function POST(request: NextRequest) {
  const workerUrl = process.env.WORKER_URL;
  const workerApiKey = process.env.WORKER_API_KEY;

  if (!workerUrl || !workerApiKey) {
    return NextResponse.json(
      { error: "Missing WORKER_URL or WORKER_API_KEY in environment." },
      { status: 500 }
    );
  }

  let payload: WorkerRequestPayload;

  try {
    payload = (await request.json()) as WorkerRequestPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!payload.prompt || typeof payload.prompt !== "string") {
    return NextResponse.json(
      { error: "The field 'prompt' is required." },
      { status: 400 }
    );
  }

  const combinedSystemPrompt = [
    IDENTITY_SYSTEM_PROMPT,
    payload.systemPrompt?.trim() ?? "",
  ]
    .filter(Boolean)
    .join("\n\n");

  const workerResponse = await fetch(workerUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${workerApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt: payload.prompt,
      systemPrompt: combinedSystemPrompt,
      history: payload.history ?? [],
    }),
  });

  const contentType = workerResponse.headers.get("content-type") ?? "";
  const raw = await workerResponse.text();

  if (!workerResponse.ok) {
    return NextResponse.json(
      { error: `Worker error (${workerResponse.status}): ${raw}` },
      { status: workerResponse.status }
    );
  }

  if (contentType.includes("application/json")) {
    try {
      const data = JSON.parse(raw) as JsonLike;
      const reply = pickReplyFromJson(data);

      if (reply) {
        return NextResponse.json({ reply });
      }

      return NextResponse.json({ reply: raw });
    } catch {
      return NextResponse.json({ reply: raw });
    }
  }

  return NextResponse.json({ reply: raw });
}
