import { NextRequest } from 'next/server'
import { requireSameOrigin } from '@/lib/csrf'

function makeReq(
  method: string,
  url = 'http://localhost:3000/api/admin/results',
  headers: HeadersInit = {},
) {
  return new NextRequest(url, { method, headers })
}

function expectForbidden(response: Response | null) {
  expect(response).not.toBeNull()
  expect(response?.status).toBe(403)
}

describe('requireSameOrigin', () => {
  const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL

  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_APP_URL
  })

  afterEach(() => {
    if (originalAppUrl === undefined) delete process.env.NEXT_PUBLIC_APP_URL
    else process.env.NEXT_PUBLIC_APP_URL = originalAppUrl
  })

  it('allows GET without origin headers', () => {
    expect(requireSameOrigin(makeReq('GET'))).toBeNull()
  })

  it('allows POST with same-origin Origin', () => {
    const req = makeReq('POST', 'http://localhost:3000/api/admin/results', {
      origin: 'http://localhost:3000',
    })

    expect(requireSameOrigin(req)).toBeNull()
  })

  it('allows DELETE with same-origin Origin', () => {
    const req = makeReq('DELETE', 'http://localhost:3000/api/admin/results', {
      origin: 'http://localhost:3000',
    })

    expect(requireSameOrigin(req)).toBeNull()
  })

  it('blocks POST with cross-origin Origin', () => {
    const req = makeReq('POST', 'http://localhost:3000/api/admin/results', {
      origin: 'https://evil.example',
    })

    expectForbidden(requireSameOrigin(req))
  })

  it('allows POST with no Origin but same-origin Referer', () => {
    const req = makeReq('POST', 'http://localhost:3000/api/admin/results', {
      referer: 'http://localhost:3000/admin',
    })

    expect(requireSameOrigin(req)).toBeNull()
  })

  it('blocks POST with no Origin but cross-origin Referer', () => {
    const req = makeReq('POST', 'http://localhost:3000/api/admin/results', {
      referer: 'https://evil.example/attack',
    })

    expectForbidden(requireSameOrigin(req))
  })

  it('blocks POST with neither Origin nor Referer', () => {
    expectForbidden(requireSameOrigin(makeReq('POST')))
  })

  it('blocks POST with malformed Origin', () => {
    const req = makeReq('POST', 'http://localhost:3000/api/admin/results', {
      origin: 'not a valid origin',
      referer: 'http://localhost:3000/admin',
    })

    expectForbidden(requireSameOrigin(req))
  })

  it('accepts NEXT_PUBLIC_APP_URL origin when it differs from req.nextUrl.origin', () => {
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
  })
})
