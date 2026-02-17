# Testing Notes

Date: 2026-02-16

## Environment checks
- `pnpm check:utf8` passed.
- `pnpm --filter invoicia lint` passed (1 non-blocking warning in onboarding about react-hook-form watch memoization).
- `pnpm --filter invoicia build` passed.
- Route health:
- `GET /` -> `200`
- `GET /app` -> `307` redirect to `/sign-in` (expected protected route behavior).

## Persistence checks (real DB)
Executed a service-layer smoke test against the configured Postgres DB using:
- `createCustomer`
- `createProduct`
- `createDraftInvoice`
- `createQuoteDraft`
- `deleteQuoteDraft`

Result:
- `customerPersisted: true`
- `productPersisted: true`
- `invoicePersisted: true`
- `quotePersisted: true`
- `quoteDeleted: true`

This confirms DB persistence and post-refresh survivability at the source-of-truth layer.

## Buttons and flows verified in code
- Quotes:
- `New quote` now calls `createQuoteAction` (DB write + revalidate + refresh).
- Quote row click navigates to `/quotes/[id]`.
- Quote actions (`send`, `convert`, `void`, `delete draft`) call real server actions.
- Quote detail `/quotes/[id]` supports `save`, `send`, `convert`, `void`, `delete`.
- Invoices:
- Invoice list item actions call real actions/real export routes.
- Bulk reminders, bulk void, and bulk export request actions are wired.
- Invoice detail duplicate now creates a real duplicated draft.
- Invoice builder `Send` and `Save draft` both persist (`Send` triggers send flow after create).
- Customers and Products:
- Create dialogs call server actions and refresh list data.
- Reminders:
- Rule toggle persists via `toggleReminderRuleAction`.
- Empty policy can be initialized via `createDefaultReminderPolicyAction`.
- Templates:
- Branding save persists to organization fields.
- Logo metadata save persists `logoPath`.
- Preview opens a real preview target URL.
- Settings:
- Organization save persists to org record.
- Password update persists to user password hash.
- Team/security/billing buttons now execute server actions with persisted audit events.
- Payments:
- Connect/Learn more buttons execute server actions and navigate to billing settings.

## Remaining TODOs
- Manual browser click-through for every route/button in a logged-in session is still recommended as a final UX pass.
- Current testing here validates build correctness and DB persistence programmatically; it does not include automated browser E2E.
