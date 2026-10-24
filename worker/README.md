# Open Bible AI Worker

A small [Cloudflare Worker](https://developers.cloudflare.com/workers/) that sits between the app and [Groq](https://groq.com). The Groq API key is stored as a Worker secret, so it never appears in the app or in this repository.

## Deploy

```bash
cd worker
npx wrangler login
npx wrangler secret put GROQ_API_KEY   # paste the key when asked
npx wrangler deploy
```

`wrangler deploy` prints the Worker URL, for example `https://open-bible-ai.<account>.workers.dev`. Then, in the GitHub repository, go to **Settings > Secrets and variables > Actions > Variables** and create a variable named `AI_URL` with that URL, and run the Deploy workflow. The app shows the AI button only when `AI_URL` is set.

## Settings

Edit `wrangler.toml`:

- `ALLOWED_ORIGINS`: sites allowed to call the Worker from a browser. Add `http://localhost:5173` for local development.
- `MODEL`: any Groq chat model.
- `MAX_TOKENS`: the longest answer, in tokens.
- `[[ratelimits]]`: requests per IP per period.

Set a spending limit in the Groq console as well. The Worker limits the size of each request and the length of each answer, but it cannot see your total usage.

## Local test

```bash
cd worker
echo 'GROQ_API_KEY=your-key' > .dev.vars   # ignored by git
npx wrangler dev
```

## API

`POST /ask` with `{ question, passage: { ref, version, text }, lang, history }`. The response is a stream of server-sent events in the OpenAI chat format (`data: {...}` lines ending with `data: [DONE]`).
