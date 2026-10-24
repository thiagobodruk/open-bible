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
- `MODEL`: any Groq chat model. The default, `llama-3.1-8b-instant`, fits the Groq free tier. The free limits apply to your whole Groq organization, not per user, so a lighter model and per-IP limits keep one person from using everyone's share.
- `MAX_TOKENS`: the longest answer, in tokens.
- `[[ratelimits]]`: requests per IP per minute (6 by default).
- Daily limit per IP (optional): run `npx wrangler kv namespace create DAILY`, uncomment the `[[kv_namespaces]]` block in `wrangler.toml` with the id it prints, and set `DAILY_LIMIT`. Redeploy.

Set a spending limit in the Groq console as well. The Worker limits the size of each request and the length of each answer, but it cannot see your total usage.

## Troubleshooting

When a request fails with `upstream_error`, the Worker logs the status and the start of Groq's reply (never the key). See it with `npx wrangler tail` while repeating the request, or in the Cloudflare dashboard under Workers & Pages > open-bible-ai > Logs. A `401` means the key is wrong: run `npx wrangler secret put GROQ_API_KEY` again.

## Local test

```bash
cd worker
echo 'GROQ_API_KEY=your-key' > .dev.vars   # ignored by git
npx wrangler dev
```

## API

Errors are JSON like `{ "error": "rate_limited" }`: `rate_limited` (too many in a minute), `daily_limit` (the IP used its daily questions), `quota` (Groq's own limit was reached), `forbidden_origin`, `bad_request`, `upstream_error`.

`POST /ask` with `{ question, passage: { ref, version, text }, lang, history }`. The response is a stream of server-sent events in the OpenAI chat format (`data: {...}` lines ending with `data: [DONE]`).
