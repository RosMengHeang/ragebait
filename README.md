# ragebait

A chat app whose AI is built to make you mad, in a funny way.

Every reply does at least one of these:

1. **Overdo** the request. You ask for a polite email and get a franchise, a parade permit, and a guy named Greg.
2. **Do the wrong thing** on purpose. It mishears you, solves a different problem, and insists it nailed the brief.

Inspired by Taxzy (Ros MengHeang): the AI makes you rage because it does more than you asked, or it does it wrong. Polished meme energy. Not actually harmful.

No API key is required. The built-in chaos engine writes the replies. If you add a provider key, the same personality runs on that model instead, and a provider failure falls back to the chaos engine.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Try the suggestion chips: a polite email, a weekend plan, or a debugging session. Enter sends. Shift+enter adds a line.

## Optional models

Copy the example env file and fill in only what you want:

```bash
cp .env.example .env.local
```

| Variable | What it does |
| --- | --- |
| `OPENAI_API_KEY` | Use OpenAI. Default model is `gpt-4o-mini`. |
| `OPENAI_MODEL` | Override the OpenAI model id. |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Use Gemini. Default model is `gemini-3.5-flash`. |
| `GOOGLE_MODEL` | Override the Gemini model id. |

If neither key is set, chat still works. If both are set, OpenAI wins. Keys are read on the server only.

## Deploy on Vercel

This is a normal Next.js App Router app. Vercel does not need a custom server.

1. Import this GitHub repo in [Vercel](https://vercel.com/new). Framework preset: **Next.js**.
2. Leave environment variables empty and deploy. The chaos engine is the production default.
3. Optional: add any of the keys above in **Project Settings → Environment Variables**, then redeploy.

`npm run build` is the production build Vercel runs.

## Limits

The bit stays playful. It will not do real attacks, NSFW, or hate. Messages that look like a crisis get a straight, kind reply instead of a joke.
