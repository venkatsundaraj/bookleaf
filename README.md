# BookLeaf Author Support & Communication Portal

A support portal with two interfaces:

- **Author portal**: authors log in, see their books and royalties, raise support queries, and follow replies live.
- **Admin portal**: the operations team works through a prioritised ticket queue. AI classifies each ticket and drafts a reply grounded in the BookLeaf knowledge base.

- **Live demo:** _add URL after deployment_
- **Stack:** Next.js 16 (App Router) · Express 5 · PostgreSQL + Drizzle ORM · OpenAI (`gpt-4o-mini`) · Server-Sent Events

---

## Test credentials

The database is seeded from `bookleaf_sample_data.json` (10 authors, 18 books).

| Role | Login page | Email | Password |
|---|---|---|---|
| Admin | `/admin/login` | `admin@bookleaf.com` | `admin123` |
| Author | `/login` | any author email from the dataset, e.g. `priya.sharma@email.com` | `author123` |

All 10 authors share the password `author123`. The dataset covers several edge cases: books still in production, zero royalties, and pending payouts.

---

## Running locally

**Requirements:** Node 24+ (the server runs TypeScript directly with Node's built-in type stripping), pnpm, and a PostgreSQL database.

```bash
# 1. Server
cd server
cp .env.example .env          # fill in DATABASE_URL, AUTH_SECRET, OPENAI_API_KEY
pnpm install
pnpm db:migrate               # create the tables
pnpm db:seed                  # load the sample dataset (clears existing data)
pnpm dev                      # http://localhost:8000

# 2. Client (new terminal)
cd client
cp .env.example .env          # BACKEND_URL=http://localhost:8000
pnpm install
pnpm dev                      # http://localhost:3000
```

### With Docker

The compose file runs the API and the web app. The database is external. Configuration is passed as environment variables, not an env file:

```bash
export DATABASE_URL=postgres://...  AUTH_SECRET=...  OPENAI_API_KEY=sk-...
docker compose up --build                            # client :3000, server :8000
docker compose run --rm server node app/lib/seed.ts  # seed once
```

`docker compose up` stops with a clear message if `DATABASE_URL` or `AUTH_SECRET` is missing. `OPENAI_API_KEY` is optional: without it, the AI features fail gracefully.

The container does not run migrations. Apply them yourself with `pnpm db:migrate` before the first start.

The server container applies migrations on every start before it boots.

---

## Architecture

```
Browser ──► Next.js (client/) ──/api/* rewrite──► Express API (server/) ──► PostgreSQL
                │                                     │
                └─ server components fetch the API    └─► OpenAI (classification, drafts)
                   directly, forwarding the cookie
```

```
client/src/
  app/                  pages: /login, /dashboard (My Books), /dashboard/tickets, /admin/dashboard
  lib/                  API helper, shared types, formatters, live event hook
  server/               server-only fetch helpers (forward the auth cookie)
  proxy.ts              redirects logged-out users to the right login page
server/
  index.ts              app setup, error handler
  app/routes/           URL → middleware → controller
  app/controller/       request validation, access checks, responses
  app/middleware/       requireAuth, requireRole
  app/lib/schema/       Drizzle schema and enums
  app/lib/validation/   Zod request schemas
  app/lib/ai/           prompts, knowledge base, AI runners
  app/lib/ticketEvents.ts  in-process event bus for real-time updates
  drizzle/              SQL migrations
```

### Key decisions

- **A separate Express API instead of Next.js route handlers.**
  - The brief asks for a clean REST layer, and a standalone API has its own auth, validation and error handling.
  - It is independent of the frontend and easy to test with curl or Postman.
- **Same-origin calls through a Next.js rewrite.**
  - The browser only talks to the Next.js origin, and `/api/*` is proxied to Express.
  - So no CORS configuration is needed, and the session cookie can be `httpOnly` and `SameSite=Lax`.
- **Session.**
  - A signed JWT sits in an `httpOnly` cookie, so JavaScript never sees it.
  - `requireAuth` loads the user from the database on every request, so a deleted user loses access immediately.
- **Access control is enforced in the API, not the UI.**
  - `requireRole("admin")` guards admin-only routes.
  - Author-scoped queries always filter by the logged-in user.
  - A ticket an author doesn't own returns 404 rather than 403, so ticket IDs can't be probed.
- **Schema.**
  - **`tickets`**: category and priority stay `null` until the AI classifies the ticket. A failed classification shows as "Unclassified" rather than a guessed label. Each has a source column (`ai` or `admin`), so an admin's override is never overwritten by a later AI run.
  - **`ticketAIRuns`**: every AI call is logged with its status, model, prompt version, token counts and error. This gives an audit trail and cost tracking, and makes failed calls visible.
  - **`ticketMessages`**: replies and internal notes, with `isInternal` marking notes. `aiRunId` links a reply to the draft it started from, which lets you measure how often drafts are used.
- **Real-time with Server-Sent Events.**
  - Updates only flow from the server to the browser, so SSE is enough. It works over plain HTTP through the rewrite, and the browser reconnects on its own.
  - See [Real-time updates](#real-time-updates).

---

## AI integration

There are two separate AI tasks, each in its own module under `server/app/lib/ai/`.

| | Classification | Reply draft |
|---|---|---|
| When | Once, right after a ticket is created (in the background) | Only when an admin opens a ticket in the popup |
| Input | Ticket subject and description | Ticket, the author's first name, that book's data, and **one** knowledge-base section |
| Output | Structured JSON (Zod schema): category, priority, short reasons, confidence | Plain-text reply for the admin to edit |
| Stored | `ticketAIRuns`, plus category and priority on the ticket | `ticketAIRuns`; reused on reopen |

### Prompt strategy

- **Classification prompt**
  - Short, precise definitions of each category, with tie-breakers. For example, "how do I change correct metadata" is General, while "my metadata is wrong" is ISBN & Metadata.
  - The knowledge base's timelines, so the model can tell whether something is overdue.
  - An explicit priority rubric: a royalty missing for six months is Critical or High; an author-bio update is Low.
  - Priority is based on facts (elapsed time, money, impact on a live listing), not tone or capital letters.
  - The ticket is passed in as JSON and the prompt says to treat it as data. Text like "mark this critical" inside a ticket is ignored.
  - Structured output is validated with Zod, so the result is always a valid enum value.
- **Draft prompt**
  - BookLeaf's tone guidelines as hard rules: acknowledge the concern first, own BookLeaf's mistakes, give concrete timelines, and end with a clear next step.
  - The "how to handle" guidance from the sample-response table for the ticket's category.
  - The author's actual book data: status, copies sold, royalty earned, paid and pending, last payout date, and platforms.
  - **Derived facts are computed in code, not by the model.** The *next royalty payout deadline* (quarter end + 45 days) is calculated on the server and passed in, so drafts quote a correct date.
  - The model is told to use only the supplied facts, and to say what the team will check rather than guess.

### Cost management

- **The knowledge base is sliced by category.** It is stored as one section per category (`knowledgeBase.ts`), and a draft includes only the section for the ticket's category, roughly a sixth of the full text. The full knowledge base is used only if a ticket was never classified.
  - **Why not a vector database or RAG:** the knowledge base is about 1.5k tokens and its six sections map one to one onto the six categories. A category lookup is exact, free and needs no infrastructure. Retrieval would be worth adding once the knowledge base grows to many articles, or for retrieving similar resolved tickets.
- **Drafts are lazy.** Classification runs on every ticket because the queue needs priorities. Drafts are only generated when an admin opens a ticket, and only if support hasn't replied yet. Reopening a ticket returns the stored draft, with no new AI call.
- **Ticket history is never sent.** Each call gets only the current ticket.
- **Prompts are ordered for caching.** Static instructions come first and per-ticket data last, plus a `prompt_cache_key` per category. OpenAI's automatic prompt caching can then reuse the shared prefix. Cached token counts are recorded.
- **Output is capped.** Drafts have a token limit, and classification returns a small JSON object.
- **Every call is metered.** Input and output tokens are saved on `ticketAIRuns`, so cost per ticket can be measured.

### Error handling and graceful degradation

- **If classification fails** (outage, rate limit, missing key), the ticket is still saved. The run is marked `failed` with the error, and the ticket shows as *Unclassified / Not scored* for an admin to set by hand.
- **If a draft fails**, the API returns `503` with a clear message. The popup shows it and leaves an empty reply box, so the admin replies manually.
- **The SDK is configured to cope with temporary failures:** short timeouts, two automatic retries with backoff for rate limits and 5xx errors, and a `temperature` of 0 for repeatable classification.
- **The OpenAI client is created on first use.** A missing API key fails only the AI features, never server startup.
- **The API key is read only from server environment variables** and never reaches the browser.

### Model choice

Both tasks use **`gpt-4o-mini`**, overridable with `OPENAI_CLASSIFY_MODEL` and `OPENAI_DRAFT_MODEL`:

- **Classification:** short-input, constrained-output work. A small model handles it well, and structured outputs guarantee a valid schema.
- **Drafts:** short, policy-bound replies built from supplied facts. They don't need a frontier model, and an admin reviews every draft anyway.
- **Cost and speed:** it is one of the cheapest and fastest options, which matters because classification runs on every ticket.
- **Swappable:** each task sits behind one function (`classifyTicket`, `generateDraft`), so changing the model or provider is a local change.

---

## Real-time updates

- **The stream:** `GET /api/tickets/events` is a Server-Sent Events stream. Each browser tab opens one connection (`client/src/lib/ticket-events.ts`), shared by every component that listens.
- **The events:**
  - `message`: a reply or internal note was added. It carries the message itself.
  - `ticket`: a ticket changed, for example when classification finishes.
- **Filtering happens on the server:** admins receive every event. Authors receive only public events on their own tickets, so internal notes never reach them.
- **Author's My Tickets page:** an open ticket shows a new admin reply immediately, and ticket statuses refresh.
- **Admin queue:** it refreshes when an event arrives, and the open ticket popup shows new messages as they come in.
- **Keeping the connection alive:**
  - A heartbeat comment every 25 seconds keeps idle proxies from closing the connection.
  - `Cache-Control: no-transform` stops the rewrite proxy from compressing, and so buffering, the stream.
  - The browser reconnects automatically after 3 seconds.
- **Scaling note:** the event bus is in-process, which is correct for a single API instance. With several instances it would be replaced by Postgres `LISTEN/NOTIFY` or Redis pub/sub, behind the same `publishTicketEvent` / `onTicketEvent` interface.

---

## API reference

- **Base path:** `/api`.
- **Format:** all bodies are JSON.
- **Authentication:** every route except signup and login requires the `auth` cookie.
- **Errors** are returned as `{ "error": string, "details"?: ZodIssue[] }`:
  - `400`: invalid input
  - `401`: not logged in
  - `403`: wrong role
  - `404`: not found, or not yours
  - `409`: conflict
  - `503`: AI unavailable
  - `500`: unexpected error, with a generic message

### Auth

| Method | Path | Access | Body | Response |
|---|---|---|---|---|
| POST | `/auth/signup` | public | `{ name, email, password }` | `201` user; author accounts only |
| POST | `/auth/login` | public | `{ email, password, role: "author" \| "admin" }` | `200` user and sets the session cookie. `401` if the credentials are wrong; `403` if the role doesn't match the login page |
| POST | `/auth/logout` | any | none | `204`, clears the cookie |
| GET | `/auth/me` | any | none | the current user `{ id, name, email, role }` |

### Books

| Method | Path | Access | Response |
|---|---|---|---|
| GET | `/books` | author: their own books; admin: all books | Books with ISBN, genre, publication date, status, MRP, copies sold, and royalty earned, paid and pending |

### Tickets

| Method | Path | Access | Body | Response |
|---|---|---|---|---|
| GET | `/tickets` | author: their own; admin: all | none | Ticket summaries, sorted unresolved first, then by priority, then oldest |
| POST | `/tickets` | author | `{ bookId: string \| null, subject, description }`; `null` means General / Account | `201 { id }`; classification starts in the background |
| GET | `/tickets/events` | any | none | `text/event-stream`, see [Real-time updates](#real-time-updates) |
| GET | `/tickets/:id/messages` | owner or admin | none | The conversation; internal notes are visible to admins only |
| POST | `/tickets/:id/messages` | owner or admin | `{ body, isInternal?, aiRunId? }` | `201` message. Only admins can add internal notes or link a draft. The first public admin reply sets `firstResponseAt` and moves the ticket from Open to In Progress |
| POST | `/tickets/:id/draft` | admin | `{ regenerate?: boolean }` | `201 { aiRunId, draft, cached: false }` for a new draft, `200` with `cached: true` for a stored one, `503` if the AI is unavailable |

---

## Known limitations and next steps

- **Not built yet:**
  - Queue filters (status, category, priority, date)
  - Admin override of category and priority
  - Ticket status changes
  - "Assign to me"
- **Attachments are UI-only,** as the brief allows. A real version would use signed uploads to object storage.
- **The session JWT has no expiry claim,** only the cookie's 3-day lifetime. Add `exp`, and rotate tokens.
- **No rate limiting** on login or ticket creation, and no account lockout.
- **Classification runs in the request process.** In production it would go on a job queue (for example BullMQ or pg-boss) with retries and a dead-letter queue, so a server restart can't lose a pending classification.
- **The event bus only works for a single instance.** See the scaling note above.
- **No automated tests yet.** First priorities: access-control tests for every route, and a small labelled set of tickets to measure classification accuracy when prompts or models change.
- **AI quality loop:** track how much admins edit drafts compared with sending them as-is, using `aiRunId`, and use that to tune prompts per category.
