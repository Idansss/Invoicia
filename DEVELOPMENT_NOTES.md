# Development Notes

## Webpack vs Turbopack Issue with Supabase Middleware

### Problem
The Supabase middleware (`lib/supabase/middleware.ts`) uses features that are incompatible with webpack's Edge Runtime during development. The error occurs because the middleware uses code that requires `eval()`, which is disallowed in the Edge Runtime:

```
EvalError: Code generation from strings disallowed for this context
```

### Solution Options

#### Option 1: Use Turbopack (Recommended for Development with Auth)
Start the dev server with Turbopack instead of webpack:

```bash
pnpm dev --turbo
```

This enables full Supabase auth and route protection during development.

#### Option 2: Use Simplified Middleware (Current Setup)
For local UI development without auth protection, the `middleware.ts` has been temporarily simplified to pass through all requests. This allows webpack to work:

```typescript
// Temporary passthrough - auth protection disabled
export async function middleware(request: NextRequest) {
  return NextResponse.next()
}
```

**Trade-offs:**
- ✅ Works with webpack
- ✅ Fast for UI development
- ❌ No auth protection (can access `/app` routes without login)
- ❌ No session refresh

#### Option 3: Production Build
For production deployment, always use:

```bash
pnpm build
pnpm start
```

Production builds work correctly with the full Supabase middleware.

### Recommendation
- **Local UI development**: Use current simplified middleware with webpack (`pnpm dev`)
- **Testing auth flows**: Use Turbopack (`pnpm dev --turbo`)
- **Production**: Use production build (`pnpm build && pnpm start`)

### Switching Between Modes

To enable full auth protection, uncomment in `middleware.ts`:

```typescript
import { updateSession } from "@/lib/supabase/middleware"

export async function middleware(request: NextRequest) {
  return await updateSession(request) // Uncomment this
  // return NextResponse.next()        // Comment this
}
```

Then use `pnpm dev --turbo`.

---

## Port Configuration

The dev server may use different ports if 3000 is occupied:
- Default: `http://localhost:3000`
- If occupied: `http://localhost:3001` (or next available)

Check the terminal output for the actual port being used.

---

## Environment Variables

The `.env.local` file contains your Supabase configuration:
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: (Optional) For server-side admin operations

Never commit `.env.local` to version control.
