# Admin CSRF Protection — Design Spec

**Date:** 2026-07-01
**Stack:** Next.js 14 (App Router) + iron-session + Vercel
**Status:** Draft design, pending implementation

---

## 1. Overview

Add explicit CSRF protection for cookie-authenticated admin mutations.

The admin section now authenticates with an `httpOnly` iron-session cookie named
`fifa2026-admin`. That is the right direction, but cookie authentication introduces
classic CSRF risk: a malicious site can try to cause the admin's browser to send
requests to this app while the admin cookie is present.

Current JSON `fetch` calls get some incidental protection from CORS preflight, but
that is not a deliberate security boundary. This spec adds a small server-side
same-origin check for unsafe HTTP methods before any admin mutation is executed.

---

## 2. Goal

Prevent cross-site pages from triggering admin state-changing actions using the
logged-in admin's browser/cookie.

A request to an admin mutation should be accepted only if:

1. It carries a valid admin session cookie, and
2. Its `Origin` or `Referer` proves it came from this app's own origin.

---

## 3. Scope

### In scope

Add CSRF/same-origin validation to cookie-authenticated admin mutation routes:

| Route | Method | Reason |
|---|---:|---|
| `app/api/admin/results/route.ts` | `POST` | Saves group/knockout actual results |
| `app/api/admin/results/route.ts` | `DELETE` | Deletes actual result rows by type |
| `app/api/admin/settings/route.ts` | `POST` | Updates submission deadline |
| `app/api/admin/logout/route.ts` | `POST` | Clears admin session cookie; protect against logout CSRF |

Add a reusable helper:

| File | Change |
|---|---|
| `lib/csrf.ts` | New helper for same-origin checks on unsafe methods |

Add tests:

| File | Change |
|---|---|
| `__tests__/csrf.test.ts` | Unit tests for same-origin helper |

### Out of scope

- Rate limiting.
- Supabase Row-Level Security.
- Full synchronizer-token CSRF implementation.
- Middleware-level admin route gating.
- Absolute admin session lifetime.
- Changing player-facing routes.
- Changing `GET /api/admin/results`.
- Changing `GET /api/admin/sync-espn`.

`GET /api/admin/sync-espn` does **not** persist results or write to Supabase in the
current code. It only fetches ESPN data, maps it, and returns JSON; the admin UI
then applies the response to in-memory editor state. Therefore it is not part of
this CSRF mutation spec. Nuance: like other admin-authenticated GETs, it does
refresh the admin session cookie because `isAdminRequest()` uses sliding expiry.
If we want strict no-side-effect GET semantics, that should be handled in a
separate session-refresh design that applies consistently to all admin GET routes.

---

## 4. Current behavior

### Admin auth

`lib/session.ts` provides:

- `getAdminSession()` — reads the encrypted `fifa2026-admin` cookie.
- `isAdminRequest()` — authorizes only when `session.isAdmin === true`, and re-saves the session
  to refresh the 30-day TTL.

Admin UI requests rely on browser cookies after login. The client no longer sends
`x-admin-password` headers.

### Admin mutation calls

`app/admin/page.tsx` currently calls admin mutation endpoints with same-origin relative URLs:

```ts
fetch('/api/admin/results', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(...),
})
```

and similar for `DELETE /api/admin/results`, `POST /api/admin/settings`, and
`POST /api/admin/logout`.

These browser requests should naturally include an `Origin` header matching the app origin.
The CSRF helper will enforce that.

---

## 5. Design

### 5.1 Same-origin helper

Create `lib/csrf.ts`.

The helper should:

1. Ignore safe methods: `GET`, `HEAD`, `OPTIONS`.
2. For unsafe methods (`POST`, `PUT`, `PATCH`, `DELETE`):
   - Prefer the `Origin` header.
   - Fall back to the `Referer` header if `Origin` is absent.
   - Accept only if the parsed header origin matches an allowed origin.
   - Reject malformed or missing headers.
3. Return a `NextResponse` on failure, or `null` on success, so route handlers can use it inline.

Proposed API:

```ts
// lib/csrf.ts
import { NextRequest, NextResponse } from 'next/server'

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

function normalizeOrigin(value: string): string | null {
  try {
    return new URL(value).origin
  } catch {
    return null
  }
}

function getAllowedOrigins(req: NextRequest): Set<string> {
  const origins = new Set<string>()

  // The actual request origin is the most important value. This supports local dev,
  // Vercel preview URLs, custom domains, and custom ports without hard-coding them.
  origins.add(req.nextUrl.origin)

  // Also allow the configured canonical app URL, when present.
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (appUrl) {
    const normalized = normalizeOrigin(appUrl)
    if (normalized) origins.add(normalized)
  }

  return origins
}

export function requireSameOrigin(req: NextRequest): NextResponse | null {
  if (SAFE_METHODS.has(req.method)) return null

  const allowedOrigins = getAllowedOrigins(req)
  const origin = req.headers.get('origin')

  if (origin) {
    const normalized = normalizeOrigin(origin)
    if (normalized && allowedOrigins.has(normalized)) return null
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const referer = req.headers.get('referer')
  if (referer) {
    const normalized = normalizeOrigin(referer)
    if (normalized && allowedOrigins.has(normalized)) return null
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

Notes:

- `Origin` is preferred because it is the standard CSRF validation header for unsafe requests.
- `Referer` fallback handles environments where `Origin` is absent.
- If both are absent on an unsafe method, reject. This intentionally blocks non-browser/curl admin
  mutations unless they explicitly provide a matching `Origin` or `Referer` header. Admin mutation
  access should happen through the browser UI.
- `req.nextUrl.origin` keeps local development flexible, including non-3000 ports.
- `NEXT_PUBLIC_APP_URL` is included as a canonical fallback/allowance, but should not be the only
  accepted origin because local preview ports and Vercel preview hosts may differ.

### 5.2 Route-handler usage

Apply the helper to each in-scope unsafe admin route before executing the mutation.

Preferred order:

1. Check admin session.
2. Check same-origin.
3. Parse body / execute mutation.

This keeps unauthenticated callers receiving `401` rather than `403`, and only reveals CSRF policy
to callers that already have a valid admin session.

Pattern:

```ts
import { isAdminRequest } from '@/lib/session'
import { requireSameOrigin } from '@/lib/csrf'

export async function POST(req: NextRequest) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const csrfError = requireSameOrigin(req)
  if (csrfError) return csrfError

  // existing mutation logic...
}
```

#### `app/api/admin/results/route.ts`

- Leave `GET` unchanged.
- Add `requireSameOrigin(req)` to `POST` after `isAdminRequest()` passes.
- Add `requireSameOrigin(req)` to `DELETE` after `isAdminRequest()` passes.

#### `app/api/admin/settings/route.ts`

- Add `requireSameOrigin(req)` to `POST` after `isAdminRequest()` passes.

#### `app/api/admin/logout/route.ts`

Current route does not need admin authorization to clear the cookie. It should still reject
cross-site logout attempts.

Pattern:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { requireSameOrigin } from '@/lib/csrf'
import { getAdminSession } from '@/lib/session'

export async function POST(req: NextRequest) {
  const csrfError = requireSameOrigin(req)
  if (csrfError) return csrfError

  const session = await getAdminSession()
  session.destroy()
  await session.save()
  return NextResponse.json({ ok: true })
}
```

Logout should not require `isAdminRequest()` because an already-expired or absent session should still
be harmless to clear. The CSRF check prevents a third-party site from forcing logout.

---

## 6. Client impact

No UI changes should be required.

Existing same-origin browser calls from `app/admin/page.tsx` should pass the check automatically:

- `POST /api/admin/results`
- `DELETE /api/admin/results`
- `POST /api/admin/settings`
- `POST /api/admin/logout`

If a local smoke test runs the app on a non-default port, it should still pass because the helper
allows `req.nextUrl.origin`, not only `NEXT_PUBLIC_APP_URL`.

Manual API calls with `curl` for admin mutations will now need to provide a valid admin cookie and
a matching origin header, for example:

```bash
curl -i \
  -H 'Cookie: fifa2026-admin=...' \
  -H 'Origin: http://localhost:3000' \
  -H 'Content-Type: application/json' \
  -X POST \
  --data '{...}' \
  http://localhost:3000/api/admin/results
```

---

## 7. Security properties

This design blocks:

- Cross-site form posts to admin mutations.
- Cross-site `fetch`/XHR attempts from malicious origins.
- Cross-site forced admin logout.
- Future accidental support for form-encoded admin mutations without CSRF checks.

This design does **not** block:

- XSS on the same origin. If an attacker can run JS on this app's origin, Origin/Referer CSRF checks
  do not help. XSS prevention is separate.
- A stolen admin cookie used by a script that can also send a valid same-origin request from the real
  app origin. Cookie theft/session revocation is handled by the separate absolute-session-lifetime task.
- Brute force against login. Rate limiting is a separate task.

---

## 8. Testing

### 8.1 Unit tests for `lib/csrf.ts`

Create `__tests__/csrf.test.ts`.

Test cases:

1. `GET` returns `null` even without Origin/Referer.
2. `POST` with `Origin` equal to `req.nextUrl.origin` returns `null`.
3. `DELETE` with `Origin` equal to `req.nextUrl.origin` returns `null`.
4. `POST` with cross-site `Origin` returns a `403` response.
5. `POST` with no `Origin` but same-origin `Referer` returns `null`.
6. `POST` with no `Origin` and cross-site `Referer` returns `403`.
7. `POST` with neither `Origin` nor `Referer` returns `403`.
8. `POST` with malformed `Origin` returns `403`.
9. `POST` accepts `NEXT_PUBLIC_APP_URL` origin when it differs from `req.nextUrl.origin`.

Example test shape:

```ts
import { NextRequest } from 'next/server'
import { requireSameOrigin } from '@/lib/csrf'

function makeReq(method: string, url = 'http://localhost:3000/api/admin/results', headers: HeadersInit = {}) {
  return new NextRequest(url, { method, headers })
}

describe('requireSameOrigin', () => {
  it('allows safe methods without origin headers', () => {
    expect(requireSameOrigin(makeReq('GET'))).toBeNull()
  })

  it('allows unsafe requests from the same origin', () => {
    const req = makeReq('POST', 'http://localhost:3000/api/admin/results', {
      origin: 'http://localhost:3000',
    })
    expect(requireSameOrigin(req)).toBeNull()
  })

  it('blocks unsafe requests from another origin', () => {
    const req = makeReq('POST', 'http://localhost:3000/api/admin/results', {
      origin: 'https://evil.example',
    })
    expect(requireSameOrigin(req)?.status).toBe(403)
  })
})
```

For the `NEXT_PUBLIC_APP_URL` test, isolate environment mutation carefully:

```ts
const oldAppUrl = process.env.NEXT_PUBLIC_APP_URL
process.env.NEXT_PUBLIC_APP_URL = 'https://app.example.com'
try {
  const req = makeReq('POST', 'https://preview.example.com/api/admin/results', {
    origin: 'https://app.example.com',
  })
  expect(requireSameOrigin(req)).toBeNull()
} finally {
  if (oldAppUrl === undefined) delete process.env.NEXT_PUBLIC_APP_URL
  else process.env.NEXT_PUBLIC_APP_URL = oldAppUrl
}
```

### 8.2 Route smoke tests

After implementation, manually verify:

1. Build and start with a strong admin password:

```bash
ADMIN_PASSWORD=temporary-strong-admin-password-123 npm run build
ADMIN_PASSWORD=temporary-strong-admin-password-123 npm start -- -p 3011
```

Expected: build succeeds and the app is serving at `http://localhost:3011`.
Stop the server after the smoke tests complete.

2. Header-only admin access remains blocked:

```bash
curl -i -H 'x-admin-password: temporary-strong-admin-password-123' \
  http://localhost:3011/api/admin/results
```

Expected: `401 Unauthorized`.

3. Cross-origin unsafe request with no cookie remains unauthorized:

```bash
curl -i -X POST \
  -H 'Origin: https://evil.example' \
  -H 'Content-Type: application/json' \
  --data '{"result_type":"group","ref_id":"A","entries":[]}' \
  http://localhost:3011/api/admin/results
```

Expected: `401 Unauthorized` because auth check happens before CSRF check.

4. Cross-origin unsafe request with a valid admin cookie is rejected by CSRF:

```bash
rm -f /tmp/fifa-admin-cookies.txt
curl -s -i -c /tmp/fifa-admin-cookies.txt \
  -H 'Content-Type: application/json' \
  --data '{"password":"temporary-strong-admin-password-123"}' \
  http://localhost:3011/api/admin/login

curl -i -b /tmp/fifa-admin-cookies.txt -X POST \
  -H 'Origin: https://evil.example' \
  -H 'Content-Type: application/json' \
  --data '{"deadline":"not-a-date"}' \
  http://localhost:3011/api/admin/settings
```

Expected: second response is `403 Forbidden`. If the CSRF check is missing or ordered too late,
this request will likely return `400 Invalid deadline`; it should never reach body validation.

5. Optional browser smoke:

- Start the app locally with a strong admin password.
- Log into `/admin`.
- Save a small admin setting or result using the UI.
- Expected: request succeeds from the same origin.

---

## 9. Acceptance criteria

Implementation is complete when:

- `lib/csrf.ts` exists and exports `requireSameOrigin(req)`.
- `POST /api/admin/results` rejects same-cookie but cross-origin requests with `403`.
- `DELETE /api/admin/results` rejects same-cookie but cross-origin requests with `403`.
- `POST /api/admin/settings` rejects same-cookie but cross-origin requests with `403`.
- `POST /api/admin/logout` rejects cross-origin logout requests with `403`.
- Same-origin admin UI actions continue to work.
- `GET /api/admin/results` behavior is unchanged.
- `GET /api/admin/sync-espn` behavior is unchanged.
- Unit tests cover same-origin allow and cross-origin deny cases.
- `npm run lint` passes.
- `ADMIN_PASSWORD=temporary-strong-admin-password-123 npm run build` passes.

---

## 10. Risks and tradeoffs

### Risk: strict header requirement may block non-browser admin scripts

This is acceptable for admin mutation endpoints. The current admin workflow is browser-based, and the
legacy `x-admin-password` header path has intentionally been removed. If future automation needs admin
writes, design a dedicated server-to-server auth mechanism rather than bypassing CSRF on browser cookies.

### Risk: privacy settings can strip `Referer`

For unsafe browser requests, `Origin` should normally be present. `Referer` is only a fallback. Requests
with neither header are rejected by design.

### Risk: `NEXT_PUBLIC_APP_URL` can be stale in preview/local environments

The helper primarily allows `req.nextUrl.origin`, so stale `NEXT_PUBLIC_APP_URL` should not break normal
same-origin UI usage.

### Tradeoff: Origin/Referer check vs CSRF token

A synchronizer token is stronger and more explicit, but requires an additional token delivery/storage path.
For this app's admin-only mutations, strict same-origin validation is a smaller, high-value first step and
matches common server-side CSRF defense for cookie-authenticated JSON APIs.

---

## 11. Implementation order

1. Create `lib/csrf.ts` with `requireSameOrigin(req)` and small internal helpers.
2. Add `__tests__/csrf.test.ts` for helper behavior.
3. Run `npm test -- --runTestsByPath __tests__/csrf.test.ts` and verify the new tests pass.
4. Add `requireSameOrigin(req)` to `POST` and `DELETE` in `app/api/admin/results/route.ts`.
5. Add `requireSameOrigin(req)` to `POST` in `app/api/admin/settings/route.ts`.
6. Add `requireSameOrigin(req)` to `POST` in `app/api/admin/logout/route.ts`.
7. Run full test/lint/build:

```bash
npm test
npm run lint
ADMIN_PASSWORD=temporary-strong-admin-password-123 npm run build
```

8. Manual browser smoke test of the admin UI.

No commit should be made until tests and build pass.
