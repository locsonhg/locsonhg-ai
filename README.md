# AI Chat Studio (Next.js)

Project chat AI using Next.js App Router, with a secure server API route that forwards requests to your Cloudflare Worker.

## 1) Install and run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## 2) Environment variables

Edit `.env` (or `.env.local`):

```bash
WORKER_URL="https://<your-worker-name>.<your-subdomain>.workers.dev"
WORKER_API_KEY="your-secret-api-key"
```

## 3) API flow

- Browser sends chat request to `POST /api/chat`.
- Next.js route `app/api/chat/route.ts` adds Bearer token from env.
- Route forwards payload to your Worker:

```json
{
  "prompt": "What is the capital of France?",
  "systemPrompt": "You are a knowledgeable assistant.",
  "history": [
    { "role": "user", "content": "Tell me about Europe." },
    {
      "role": "assistant",
      "content": "Europe is a continent with many countries."
    }
  ]
}
```

## 4) Worker call example (direct)

```ts
const res = await fetch(
  "https://<your-worker-name>.<your-subdomain>.workers.dev",
  {
    method: "POST",
    headers: {
      Authorization: "Bearer your-secret-api-key",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt: "What is the capital of France?",
      systemPrompt: "You are a knowledgeable assistant.",
      history: [
        { role: "user", content: "Tell me about Europe." },
        {
          role: "assistant",
          content: "Europe is a continent with many countries.",
        },
      ],
    }),
  }
);

const text = await res.text();
console.log(text);
```

## 5) Build check

```bash
npm run build
```
# locsonhg-ai
