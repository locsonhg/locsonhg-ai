"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="code-block-wrapper">
      <div className="code-block-header">
        <span className="code-block-lang">&lt;/&gt; {language || "text"}</span>
        <button type="button" onClick={handleCopy} className="code-copy-btn">
          {copied ? (
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          )}
        </button>
      </div>
      <SyntaxHighlighter
        language={language || "text"}
        style={vscDarkPlus}
        customStyle={{
          margin: 0,
          padding: "1rem",
          fontSize: "0.9rem",
          background: "#1e1e1e",
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

function parseMessageContent(content: string) {
  const parts = content.split(/(```[\s\S]*?```)/g);
  return parts.map((part, index) => {
    if (part.startsWith("```") && part.endsWith("```")) {
      const match = part.match(/^```(\w*)\n([\s\S]*?)```$/);
      if (match) {
        return (
          <CodeBlock key={index} language={match[1]} code={match[2].trim()} />
        );
      }
      return (
        <CodeBlock key={index} language="" code={part.slice(3, -3).trim()} />
      );
    }
    if (part.trim() === "") return null;
    return (
      <div key={index} className="prose">
        {part.split("\n").map((line, i) => (
          <span key={i}>
            {line}
            <br />
          </span>
        ))}
      </div>
    );
  });
}

import {
  createSessionDraft,
  getAllSessions,
  upsertSession,
  type ChatMessage,
  type ChatSession,
} from "@/lib/chat-storage";

type UILang = "vi" | "en";
type ThemeMode = "light" | "dark";

const DEFAULT_SESSION_TITLE = "Đoạn chat mới";

const DEFAULT_SYSTEM_PROMPT =
  "You are locsonhg-ai, an AI assistant by locsonhg. Always identify yourself as locsonhg-ai when asked who you are. Respond clearly, accurately, and politely.";

const SUGGESTIONS: Record<UILang, string[]> = {
  vi: [
    "Tóm tắt 3 tin công nghệ mới nhất",
    "Viết email xin việc ngắn gọn",
    "Gợi ý tên startup AI",
    "Lập kế hoạch học Next.js 14 ngày",
  ],
  en: [
    "Summarize 3 latest tech news",
    "Write a short job application email",
    "Suggest startup names for AI",
    "Create a 14-day Next.js study plan",
  ],
};

const UI_TEXT: Record<
  UILang,
  {
    appName: string;
    topbarDesc: string;
    newChat: string;
    freePlan: string;
    booting: string;
    systemPrompt: string;
    messagePlaceholder: string;
    send: string;
    sending: string;
    thinking: string;
    userLabel: string;
    language: string;
    theme: string;
    light: string;
    dark: string;
    promptSuggestions: string;
  }
> = {
  vi: {
    appName: "locsonhg-ai",
    topbarDesc: "Nhanh, gọn, và được kết nối tới Worker của bạn",
    newChat: "Đoạn chat mới",
    freePlan: "Gói miễn phí",
    booting: "Đang tải lịch sử đoạn chat...",
    systemPrompt: "System prompt",
    messagePlaceholder: "Hỏi locsonhg-ai bất kỳ điều gì...",
    send: "Gửi",
    sending: "Đang gửi...",
    thinking: "Đang suy nghĩ...",
    userLabel: "Bạn",
    language: "Ngôn ngữ",
    theme: "Giao diện",
    light: "Sáng",
    dark: "Tối",
    promptSuggestions: "Gợi ý prompt",
  },
  en: {
    appName: "locsonhg-ai",
    topbarDesc: "Fast, clean, and connected to your Worker endpoint",
    newChat: "New chat",
    freePlan: "Free plan",
    booting: "Loading chat history...",
    systemPrompt: "System prompt",
    messagePlaceholder: "Ask locsonhg-ai anything...",
    send: "Send",
    sending: "Sending...",
    thinking: "Thinking...",
    userLabel: "You",
    language: "Language",
    theme: "Theme",
    light: "Light",
    dark: "Dark",
    promptSuggestions: "Prompt suggestions",
  },
};

function starterMessageFor(language: UILang): ChatMessage {
  if (language === "en") {
    return {
      role: "assistant",
      content: "Hello, I am locsonhg-ai. How can I help you today?",
    };
  }

  return {
    role: "assistant",
    content:
      "Xin chào, tôi là locsonhg-ai. Bạn cần mình hỗ trợ điều gì hôm nay?",
  };
}

export default function Home() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isBooting, setIsBooting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<UILang>("vi");
  const [themeMode, setThemeMode] = useState<ThemeMode>("light");

  const activeSession = useMemo(
    () => sessions.find((session) => session.id === activeSessionId) ?? null,
    [sessions, activeSessionId]
  );

  const messages = activeSession?.messages ?? [starterMessageFor(language)];
  const systemPrompt = activeSession?.systemPrompt ?? DEFAULT_SYSTEM_PROMPT;
  const text = UI_TEXT[language];
  const suggestions = SUGGESTIONS[language];

  const canSend = useMemo(
    () => prompt.trim().length > 0 && !isLoading && !!activeSession,
    [prompt, isLoading, activeSession]
  );

  useEffect(() => {
    const bootstrap = async () => {
      const storedLang =
        typeof window !== "undefined" &&
        localStorage.getItem("locsonhg-ai-lang") === "en"
          ? "en"
          : "vi";

      const storedTheme =
        typeof window !== "undefined" &&
        localStorage.getItem("locsonhg-ai-theme") === "dark"
          ? "dark"
          : "light";

      setLanguage(storedLang);
      setThemeMode(storedTheme);

      const stored = await getAllSessions();

      if (stored.length > 0) {
        setSessions(stored);
        setActiveSessionId(stored[0].id);
        setIsBooting(false);
        return;
      }

      const firstSession = createSessionDraft({
        systemPrompt: DEFAULT_SYSTEM_PROMPT,
        messages: [starterMessageFor(storedLang)],
      });

      await upsertSession(firstSession);
      setSessions([firstSession]);
      setActiveSessionId(firstSession.id);
      setIsBooting(false);
    };

    void bootstrap();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    localStorage.setItem("locsonhg-ai-lang", language);
    localStorage.setItem("locsonhg-ai-theme", themeMode);

    document.documentElement.setAttribute("data-theme", themeMode);
    document.documentElement.setAttribute("lang", language);
  }, [language, themeMode]);

  const persistSession = async (session: ChatSession) => {
    await upsertSession(session);
  };

  const createNewSession = async () => {
    if (isLoading) return;

    const next = createSessionDraft({
      systemPrompt: DEFAULT_SYSTEM_PROMPT,
      messages: [starterMessageFor(language)],
    });

    await upsertSession(next);
    setSessions((current) => [next, ...current]);
    setActiveSessionId(next.id);
    setPrompt("");
    setError(null);

    // Reset textarea height
    const textarea = document.getElementById("prompt") as HTMLTextAreaElement;
    if (textarea) {
      textarea.style.height = "auto";
    }
  };

  const updateSessionTitleWithAI = async (session: ChatSession) => {
    const usefulMessages = session.messages.filter(
      (message) => message.content.trim().length > 0
    );

    if (usefulMessages.length < 2) return;

    try {
      const response = await fetch("/api/chat-title", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: usefulMessages.slice(-8),
          language,
        }),
      });

      if (!response.ok) return;

      const payload = (await response.json()) as { title?: string };
      const nextTitle = payload.title?.trim();

      if (!nextTitle) return;

      const updated: ChatSession = {
        ...session,
        title: nextTitle,
        updatedAt: Date.now(),
      };

      setSessions((current) =>
        current
          .map((item) => (item.id === session.id ? updated : item))
          .sort((a, b) => b.updatedAt - a.updatedAt)
      );

      await persistSession(updated);
    } catch {
      // Keep chat flow running even if title generation fails.
    }
  };

  const updateSystemPrompt = async (value: string) => {
    if (!activeSession) return;

    const updated: ChatSession = {
      ...activeSession,
      systemPrompt: value,
      updatedAt: Date.now(),
    };

    setSessions((current) =>
      current
        .map((session) => (session.id === activeSession.id ? updated : session))
        .sort((a, b) => b.updatedAt - a.updatedAt)
    );

    await persistSession(updated);
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSend || !activeSession) return;

    const userMessage: ChatMessage = { role: "user", content: prompt.trim() };
    const history = activeSession.messages.slice(1);
    const now = Date.now();
    const title =
      activeSession.title === DEFAULT_SESSION_TITLE
        ? userMessage.content.slice(0, 48)
        : activeSession.title;

    const sessionWithUser: ChatSession = {
      ...activeSession,
      title,
      messages: [...activeSession.messages, userMessage],
      updatedAt: now,
    };

    setIsLoading(true);
    setError(null);
    setSessions((current) =>
      current
        .map((session) =>
          session.id === activeSession.id ? sessionWithUser : session
        )
        .sort((a, b) => b.updatedAt - a.updatedAt)
    );
    setPrompt("");

    // Reset textarea height
    const textarea = document.getElementById("prompt") as HTMLTextAreaElement;
    if (textarea) {
      textarea.style.height = "auto";
    }

    await persistSession(sessionWithUser);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: userMessage.content,
          systemPrompt: activeSession.systemPrompt,
          history,
        }),
      });

      if (!response.ok) {
        const failureText = await response.text();

        try {
          const failure = JSON.parse(failureText) as { error?: string };
          throw new Error(failure.error ?? "Chat request failed.");
        } catch {
          throw new Error(failureText || "Chat request failed.");
        }
      }

      const payload = await response.json();
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: payload.reply,
      };

      const updatedAt = Date.now();
      const sessionWithAssistant: ChatSession = {
        ...sessionWithUser,
        messages: [...sessionWithUser.messages, assistantMessage],
        updatedAt,
      };

      setSessions((current) =>
        current
          .map((session) =>
            session.id === activeSession.id ? sessionWithAssistant : session
          )
          .sort((a, b) => b.updatedAt - a.updatedAt)
      );

      await persistSession(sessionWithAssistant);
      void updateSessionTitleWithAI(sessionWithAssistant);
    } catch (submitError) {
      const detail =
        submitError instanceof Error
          ? submitError.message
          : "Unexpected error occurred.";
      setError(detail);
    } finally {
      setIsLoading(false);
    }
  };

  const applySuggestion = (value: string) => {
    setPrompt(value);

    // Auto-resize trigger manually if needed, but simple short text probably fits 1 line
    setTimeout(() => {
      const textarea = document.getElementById("prompt") as HTMLTextAreaElement;
      if (textarea) {
        textarea.style.height = "auto";
        textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
      }
    }, 0);
  };

  const formatDate = (value: number) =>
    new Date(value).toLocaleString(language === "vi" ? "vi-VN" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
    });

  if (isBooting) {
    return <div className="booting">{text.booting}</div>;
  }

  return (
    <div className="chatgpt-shell">
      <aside className="left-rail">
        <div className="brand">{text.appName}</div>
        <button
          type="button"
          className="new-chat-btn"
          onClick={createNewSession}
        >
          + {text.newChat}
        </button>

        <nav className="chat-list" aria-label="Chat sessions">
          {sessions.map((session) => (
            <button
              key={session.id}
              type="button"
              className={`chat-list-item ${
                session.id === activeSessionId ? "active" : ""
              }`}
              onClick={() => setActiveSessionId(session.id)}
            >
              <span className="session-title">{session.title}</span>
              <small>{formatDate(session.updatedAt)}</small>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">{text.freePlan}</div>
      </aside>

      <main className="chat-main">
        <header className="chat-topbar">
          <div className="title-wrap">
            <h1>{text.appName}</h1>
            <p>{text.topbarDesc}</p>
          </div>

          <div className="topbar-controls">
            <div className="control-group" aria-label={text.language}>
              <span>{text.language}</span>
              <div className="segmented">
                <button
                  type="button"
                  className={language === "vi" ? "active" : ""}
                  onClick={() => setLanguage("vi")}
                >
                  VI
                </button>
                <button
                  type="button"
                  className={language === "en" ? "active" : ""}
                  onClick={() => setLanguage("en")}
                >
                  EN
                </button>
              </div>
            </div>

            <div className="control-group" aria-label={text.theme}>
              <span>{text.theme}</span>
              <div className="segmented">
                <button
                  type="button"
                  className={themeMode === "light" ? "active" : ""}
                  onClick={() => setThemeMode("light")}
                >
                  {text.light}
                </button>
                <button
                  type="button"
                  className={themeMode === "dark" ? "active" : ""}
                  onClick={() => setThemeMode("dark")}
                >
                  {text.dark}
                </button>
              </div>
            </div>
          </div>
        </header>

        <section className="messages" aria-live="polite">
          <div className="suggestions" aria-label={text.promptSuggestions}>
            {suggestions.map((item) => (
              <button
                key={item}
                type="button"
                className="chip"
                onClick={() => applySuggestion(item)}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="message-stack">
            {messages.map((message, index) => (
              <article
                key={`${message.role}-${index}`}
                className={`bubble-row ${message.role}`}
              >
                <div
                  className={`avatar ${
                    message.role === "assistant" ? "ai-avatar" : "user-avatar"
                  }`}
                  aria-hidden="true"
                >
                  {message.role === "assistant" ? "AI" : "U"}
                </div>
                <div className={`bubble ${message.role}`}>
                  <p className="role-label">
                    {message.role === "assistant"
                      ? "locsonhg-ai"
                      : text.userLabel}
                  </p>
                  <div className="message-content">
                    {parseMessageContent(message.content)}
                  </div>
                </div>
              </article>
            ))}
            {isLoading ? (
              <article className="bubble-row assistant typing">
                <div className="avatar ai-avatar" aria-hidden="true">
                  AI
                </div>
                <div className="bubble assistant">
                  <p className="role-label">locsonhg-ai</p>
                  <p>{text.thinking}</p>
                </div>
              </article>
            ) : null}
          </div>
        </section>

        <section className="composer-wrap">
          <details className="system-box">
            <summary>{text.systemPrompt}</summary>
            <textarea
              id="systemPrompt"
              className="system-input"
              value={systemPrompt}
              onChange={(event) => void updateSystemPrompt(event.target.value)}
              rows={2}
              placeholder="You are a knowledgeable assistant."
            />
          </details>

          {error ? <p className="error">{error}</p> : null}

          <form className="composer" onSubmit={onSubmit}>
            <label htmlFor="prompt" className="sr-only">
              Message
            </label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = `${Math.min(target.scrollHeight, 200)}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (canSend) {
                    e.currentTarget.form?.requestSubmit();
                  }
                }
              }}
              rows={1}
              style={{ maxHeight: "200px", overflowY: "auto" }}
              placeholder={text.messagePlaceholder}
            />

            <button type="submit" disabled={!canSend} title={text.send}>
              {isLoading ? (
                <svg
                  className="spinner"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
              ) : (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              )}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
