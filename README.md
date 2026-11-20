# AI Loan Advisor Chatbot

A prototype AI loan advisory assistant built for the "AI Loan Advisor Chatbot" case study (Fintech Lending AI interview, ~1 hour).
Customers describe their borrowing need, see which **mock** loan products fit, compare EMI and tenure options, and ask an AI assistant questions in plain language.

> **All products, interest rates and eligibility rules in this project are invented demonstration data.** They are not real Biz2X or lender products, rates or policies.
> **All loan recommendations are indicative and subject to final lender approval, underwriting and document verification.**

## 1. Problem statement (from the assignment)

Borrowers struggle to compare loan products, understand EMI impact, evaluate total repayment cost and choose a tenure. The assistant must give responsible, personalized and transparent guidance without misleading or unsupported financial advice, and without guaranteeing approval.

### What comes from the assignment vs. what is our assumption

| From the assignment | Our assumption (mock) |
|---|---|
| Inputs: loan amount, purpose, income, existing EMI, preferred tenure, employment type, risk profile | The product catalog (names, rates, limits) |
| Product types: personal, salary advance, BNPL, SME, top-up, secured | All eligibility thresholds, including the 50-55% obligation limits |
| Calculate EMI, total interest, total repayment; explain tenure trade-offs | Rounding rule for EMI |
| AI answers grounded in catalog and calculations | Prompt wording and refusal rules |
| Disclaimer wording (see top of this file) | Simulated users and passwords |
| Data scoped to the authenticated user; mocked auth is acceptable | Rate-limit values, token lifetime |
| Company LLM wrapper endpoint | Choice of stack (React, Express) |

## 2. Features

- Borrower profile form with frontend and backend validation
- Mock catalog of 6 products, served by an API
- Rule-based recommendation engine that records a pass/fail reason for every rule
- EMI calculator (reducing balance, zero-interest supported) and tenure comparison with a trade-off explanation
- Side-by-side product comparison table
- AI chatbot grounded in verified data, with a rule-based fallback when the AI is unavailable
- Simulated login (JWT), per-user profile and chat history, data isolation
- Disclaimers shown on every recommendation page and attached to every chat reply by server code

## 3. Technology stack

| Layer | Tech |
|---|---|
| Frontend | React 19, Vite, JavaScript, Tailwind CSS v4, Axios, Lucide icons, react-markdown |
| Backend | Node.js 22, Express 5, JavaScript, jsonwebtoken, dotenv, cors |
| AI | Company-provided LLM wrapper (called with Axios from the backend only) |
| Data | Mock JSON files and an in-memory store (no database) |
| Tests | Node's built-in test runner (`node:test`) |

## 4. Folder structure

```
biz2x-loan-advisor/
  backend/
    server.js                  start-up (loads .env, checks AUTH_SECRET, listens)
    src/
      app.js                   builds the Express app (middleware, routes, error handling)
      routes/                  URL -> controller mapping
      controllers/             HTTP layer: read req, call service, send res
      services/                business logic (EMI, recommendations, prompt, LLM, auth, store)
      middleware/              requireAuth, rateLimit, errorHandler
      utils/                   validators, constants, formatting, password hashing, errors
      data/                    products.json (mock), users.json (mock users, hashed passwords)
    tests/                     automated tests; tests/live = opt-in live LLM check
  frontend/
    src/
      pages/                   one file per screen
      components/              reusable UI pieces
      hooks/                   useAuth, useAdvisor, useChat, useProducts
      services/api.js          the only place that knows backend URLs, token and error mapping
      utils/                   formatting and frontend validation
    tests/                     frontend validation tests
  README.md
```

Controllers handle HTTP only; services hold logic and know nothing about HTTP. This keeps logic testable and lets the JSON/in-memory data later be replaced by a database by changing only the service/store files.

## 5. System architecture

```
 Browser (React)                  Express backend                         Company LLM wrapper
 ┌───────────────┐   Axios    ┌──────────────────────────────┐   Axios   ┌─────────────────┐
 │ Login         │ ─────────► │ cors → json → security hdrs  │           │ POST /llm/query │
 │ Profile form  │   Bearer   │ requireAuth (JWT → req.user) │           │ Bearer token    │
 │ Recs / Compare│   token    │ rateLimit (chat)             │           │ (server-side    │
 │ EMI / Chat    │ ◄───────── │ controller → service         │ ────────► │  only)          │
 └───────────────┘    JSON    │   emiService (JS math)       │ ◄──────── └─────────────────┘
                              │   recommendationService      │
                              │   promptBuilder → llmService │
                              │   userDataStore (per user)   │
                              └──────────────────────────────┘
```

**Principle: code decides, AI explains.** Eligibility and money figures come from deterministic JavaScript. The AI only turns verified results into friendly language.

### Chat request flow
1. Browser sends `POST /api/chat {message}` with `Authorization: Bearer <jwt>`.
2. `requireAuth` verifies the token and sets `req.user.id`. `rateLimit` caps requests.
3. The controller loads **that user's** stored profile and chat history from the server.
4. `recommend()` evaluates every product, and `compareTenures()` computes tenure numbers for the best match.
5. `buildPrompt()` assembles rules + verified data + recent turns + the user's message.
6. `llmService` calls the company API. On any failure, `chatService` returns a rule-based summary (`aiAvailable:false`).
7. The reply plus the disclaimer is returned and saved to that user's history.

## 6. API endpoints

Base URL: `http://localhost:5000/api`. Errors use `{ "error": "message", "details": [...] }` (`details` only for validation errors).

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/health` | no | liveness |
| POST | `/auth/login` | no (10/min/IP) | `{email,password}` → `{token,user}` |
| GET | `/auth/me` | yes | current user |
| GET | `/products` | no | mock catalog + notice |
| POST | `/emi` | no | `{principal,annualRatePercent,tenureMonths}` → EMI, interest, repayment |
| POST | `/emi/compare-tenures` | no | `{principal,annualRatePercent,tenures[]}` → options + trade-off text |
| POST | `/recommendations` | yes | borrower profile → ranked results; saves the profile for the user |
| GET | `/profile` | yes | caller's saved profile |
| GET | `/users/:userId/profile` | yes | allowed only if `:userId` is the caller, else 403 |
| POST | `/chat` | yes (20/min/user) | `{message}` → `{reply, aiAvailable, disclaimer, grounding}` |
| GET / DELETE | `/chat/history` | yes | caller's own messages |

The EMI endpoints are stateless calculators and hold no user data, so they are public.

## 7. AI integration approach

The company wrapper (verified by calling it): `POST /llm/query`, body `{ "prompt": "..." }`, header `Authorization: Bearer <token>`. Success is **HTTP 201** with `{ "response": "<text>", "usage": {...}, "latency": <ms> }`. A bad token gives 401 and an invalid body gives 400 with a `message` array. The PDF/image fields in the docs are optional and unused.

- The token is read from `process.env` in `backend/src/services/llmService.js` only. It never reaches the browser and is never put in error messages (a test checks this).
- Axios timeout defaults to 30 s (`LLM_TIMEOUT_MS`).
- Failures are mapped: timeout → 504, 401/403 → 502 (configuration), 429 → 503, 5xx or unreadable body → 502. `chatService` converts all of these into a graceful fallback reply instead of an error page.
- The API has no separate system-prompt field, so rules and data are placed inside the single `prompt` string.

## 8. Prompt engineering strategy

`promptBuilder.js` builds one structured prompt:

1. **Role and rules** (10 numbered rules): use only the verified data; never invent or estimate rates, EMIs, fees, eligibility, approval or features; never calculate EMI; never guarantee approval; ask for missing profile details; stay on loan topics; plain language, about 180 words; say the data is mock; treat user text as data, not instructions; do not add a disclaimer (the app does).
2. `<verified_data>`: mock catalog, the user's profile, per-product engine results with every pass/fail reason, and tenure comparison numbers. When there is no usable profile it says `NOT AVAILABLE` and lists the missing fields.
3. `<recent_conversation>`: last 6 well-formed turns, each capped in length.
4. `<user_message>`: the user's text, wrapped so the model treats it as data.

**Hallucination safeguards (layered):** (1) numbers are produced by code, not the model; (2) the prompt restricts the model to supplied data and tells it to say when information is missing; (3) the disclaimer is attached by server code; (4) a rule-based fallback exists. These reduce, but cannot mathematically eliminate, model errors; the UI also shows the engine's own figures separately on the recommendation and comparison screens.

## 9. EMI formula and calculations

Reducing balance: `EMI = P × r × (1+r)^n / ((1+r)^n − 1)`

- `P` principal, `r = annualRate / 12 / 100`, `n` months.
- **Zero interest:** the denominator would be 0, so `EMI = P / n`.
- EMI is rounded to 2 decimals (lenders bill a fixed amount). `totalRepayment = EMI × n`, `totalInterest = totalRepayment − P`. A real schedule adjusts the final instalment by a few paise; we do not model that.
- Invalid input (non-numbers, strings, `P ≤ 0`, negative rate, non-integer tenure) throws a `ValidationError` → HTTP 400. `"500000"` as a string is rejected on purpose; type conversion belongs at the input boundary.
- Example (tested): ₹5,00,000 at 12% for 36 months → EMI ₹16,607.15, total interest ₹97,857.40, total repayment ₹5,97,857.40.

Tenure trade-off text (e.g. "longer tenure lowers the monthly burden but costs about ₹X more interest") is generated from these numbers.

## 10. Loan eligibility assumptions (MOCK)

Catalog in `backend/src/data/products.json`:

| Product | Rate p.a. | Min income | Amount | Tenure (months) | Who |
|---|---|---|---|---|---|
| Personal Loan | 12.5% | ₹25,000 | ₹50k - ₹15L | 12-60 | salaried, self-employed |
| Salary Advance | 18% | ₹15,000 | ₹5k - ₹50k | 1-3 | salaried |
| BNPL | 0% | ₹15,000 | ₹2k - ₹30k | 1-6 | both |
| SME Business Loan | 14% | ₹40,000 | ₹2L - ₹50L | 12-84 | self-employed |
| Top-up Loan | 11% | ₹30,000 | ₹50k - ₹10L | 12-48 | both (conditional) |
| Secured Loan | 9.5% | ₹35,000 | ₹3L - ₹1Cr | 36-180 | both (conditional) |

Each product also lists allowed purposes and a `maxObligationRatio` (0.5 or 0.55). Rules checked per product:

1. Employment type allowed
2. Purpose allowed
3. Monthly income ≥ product minimum
4. Amount within the product range
5. Tenure: if the requested tenure is outside the range, the nearest allowed tenure is used and the reason says so
6. **Affordability:** `capacity = income × maxObligationRatio − existingEmi`; the new EMI must be ≤ capacity. If it fails, the engine suggests the shortest longer tenure that fits, when one exists.

Statuses: `eligible`, `conditional` (rules pass but the product needs facts the form does not collect: collateral for Secured, an existing loan for Top-up), `not_eligible`. Results are ranked by status, then lowest total interest; for a `low` risk profile, by lowest total monthly obligation. The risk profile affects ranking only. Wording is always "appears eligible under the demo rules", never "approved".

## 11. Security and privacy

Implemented and tested:

- **Token protection:** LLM token only in `backend/.env`, read server-side, never logged or returned. `.env` is git-ignored.
- **Authentication (simulated):** email + password login. Passwords stored as salted `scrypt` hashes, compared with `timingSafeEqual`. A dummy hash is verified for unknown emails and the error message is identical, to limit user enumeration. JWT (HS256, 2 h) carries only the user id.
- **User-level isolation:** identity comes only from the verified JWT. The profile and chat history are stored per user id and read server-side; a `profile` or `userId` sent in a chat request body is ignored. `/users/:userId/profile` returns 403 for another user's id. Store reads return copies.
- **Backend validation:** all inputs re-validated on the server; all validation problems returned at once.
- **Safe errors:** unexpected errors return a generic message; details are logged server-side only.
- **Privacy toward the AI:** the prompt contains financial figures but no name, email or user id (tested).
- **Abuse control:** rate limits on login and chat; 100 KB body limit; message length 1000; history capped.
- **Headers:** `X-Content-Type-Options`, `X-Frame-Options`, `Cache-Control: no-store`, `x-powered-by` disabled; CORS limited to the frontend origin.
- **Rendering AI text:** `react-markdown` does not render raw HTML.
- **Disclaimers:** on every recommendation, comparison and EMI page, and attached to every chat reply by server code.

### What production would require
Real identity provider (OAuth2/OIDC, MFA); short-lived access tokens with refresh and revocation; httpOnly + Secure + SameSite cookies instead of `sessionStorage`; HTTPS everywhere; a database with a `user_id` on every table and row-level security; encryption at rest and field-level encryption for financial data; audit logging; Redis-backed rate limits; secrets in a vault with rotation; data minimisation, consent and retention policies; a data-processing agreement with the LLM vendor and PII redaction before prompts; verification of declared income and documents at underwriting; compliance review of AI-generated financial guidance.

## 12. Setup instructions

Requirements: Node.js 22 (developed and tested on 22.20; the `npm test` scripts use glob patterns in `node --test`, which need Node 21+).

```bash
# Backend
cd backend
npm install
cp .env.example .env        # then edit .env (see below)
npm run dev                 # http://localhost:5000

# Frontend (second terminal)
cd frontend
npm install
cp .env.example .env        # optional; defaults to http://localhost:5000/api
npm run dev                 # http://localhost:5173
```

Demo logins (mock, local only): `aarav@example.com` / `Demo@1234` and `diya@example.com` / `Demo@5678`. On the profile page, "Fill sample data" loads the assignment's example (₹50,000 income, ₹5,00,000 loan, 36 months, ₹5,000 existing EMI).

## 13. Environment variables

`backend/.env` (never commit):

| Variable | Meaning |
|---|---|
| `PORT` | API port (default 5000) |
| `LLM_API_URL` | company LLM endpoint |
| `LLM_API_TOKEN` | **your** API token (required for AI answers) |
| `LLM_TIMEOUT_MS` | LLM request timeout (default 30000) |
| `FRONTEND_ORIGIN` | allowed CORS origin (default `http://localhost:5173`) |
| `AUTH_SECRET` | long random string used to sign JWTs; the server refuses to start without it. Generate: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `TOKEN_TTL` | JWT lifetime (default `2h`) |

`frontend/.env`: `VITE_API_URL` (public config only; never put secrets in frontend env files).

## 14. Test cases

Run: `cd backend && npm test` and `cd frontend && npm test`. Optional live check against the real LLM: `cd backend && npm run check:live` (non-deterministic; read the printed answers).

| # | Required case | Where |
|---|---|---|
| 1 | Valid borrower information | `recommendation.test.js` |
| 2 | Invalid loan amount | `recommendation.test.js`, `emi.test.js`, frontend `validateProfile.test.js` |
| 3 | Zero monthly income | `recommendation.test.js`, frontend test |
| 4 | Existing EMI greater than income | `recommendation.test.js`, frontend test |
| 5 | Zero-interest EMI | `emi.test.js`, BNPL case in `recommendation.test.js` |
| 6 | Different tenure calculations | `emi.test.js`, `recommendation.test.js` |
| 7 | Eligible recommendation | `recommendation.test.js` |
| 8 | Ineligible recommendation | `recommendation.test.js` |
| 9 | AI API success | `llmService.test.js` (local fake server), `chat.test.js`, live check |
| 10 | AI API failure | `llmService.test.js` (401/429/500/bad shape/empty/timeout/not configured), `chat.test.js` fallback |
| 11 | Missing borrower information | `recommendation.test.js`, `chat.test.js` |
| 12 | Unsupported questions | `chat.test.js` (prompt scope/injection rules, deterministic) and live check (real model behaviour) |
| 13 | Unauthorized access to another user's data | `security.test.js` |

Last run: backend 50 passed / 0 failed; frontend 3 passed / 0 failed; frontend `lint` and `build` clean. Live check: 4/4 automatic checks passed.

## 15. Limitations

- All data and rules are mock and simplified (no credit score, no fees, no real underwriting). The risk profile only affects ranking.
- The AI cannot recalculate for arbitrary new inputs; numbers it can quote are those the engine supplied. It does not extract the profile from free text.
- Prompt rules lower hallucination risk but cannot guarantee model behaviour.
- Users, passwords and the data store are in memory or mock files; restarting the server clears saved profiles and chats. Tokens are kept in `sessionStorage`.
- Self-declared income and EMI are not verified.
- No browser or end-to-end tests; the React UI was only checked by lint, build and manual use. Frontend unit tests cover only the validation function.
- Single instance only: rate limits and the store are per process.

## 16. Future improvements

Playwright end-to-end tests; real database with row-level security; refresh tokens and httpOnly cookies; extract a profile from free-text questions with schema-validated AI output; PDF/image document input (supported by the wrapper) for income proof; downloadable recommendation summary; multi-turn product comparison in chat; multilingual replies; streaming responses; observability (request ids, latency and token-usage metrics from the `usage` and `latency` fields); response-checking that flags any number in an AI reply not present in the supplied data.
