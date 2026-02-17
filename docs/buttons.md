# Invoicia Action Registry

This file maps primary UI buttons to their route or server action.

## Global navigation
- `Sidebar: Overview` -> `/app`
- `Sidebar: Invoices` -> `/invoices`
- `Sidebar: Quotes` -> `/quotes`
- `Sidebar: Customers` -> `/customers`
- `Sidebar: Products` -> `/products`
- `Sidebar: Payments` -> `/payments`
- `Sidebar: Reminders` -> `/reminders`
- `Sidebar: Templates` -> `/templates`
- `Sidebar: Compliance` -> `/compliance`
- `Sidebar: Settings` -> `/settings`
- `Sidebar: Audit Log` -> `/audit`
- `Topbar: Create` -> `/invoices/new`
- `Topbar: Notifications` -> `/reminders`
- `Topbar: Switch org` -> `setActiveOrgAction`
- `Topbar: Log out` -> `next-auth signOut`

## Quotes
- `New quote` -> `createQuoteAction` (persists `Quote` + `Customer` when needed)
- `Row click` -> `/quotes/[id]`
- `Send` -> `sendQuoteAction`
- `Convert to invoice` -> `convertQuoteAction` (creates `Invoice`, marks quote converted)
- `Void` -> `voidQuoteAction`
- `Delete draft` -> `deleteQuoteAction`
- `Quote detail: Save changes` -> `updateQuoteAction`

## Invoices
- `New invoice` -> `/invoices/new`
- `Builder: Send invoice` -> `createInvoiceAction(sendNow=true)` (persists + sends)
- `Builder: Save draft` -> `createInvoiceAction(sendNow=false)` (persists)
- `List: Send` -> `sendInvoiceFromListAction`
- `List: Void` -> `voidInvoiceFromListAction`
- `List: Download PDF` -> `/api/app/invoices/[id]/pdf`
- `List: Export XML` -> `/api/app/invoices/[id]/xml`
- `List bulk: Send reminders` -> `sendBulkRemindersAction`
- `List bulk: Mark as void` -> `voidBulkInvoicesAction`
- `List bulk: Export` -> `trackBulkExportAction` (audited request)
- `Detail: Duplicate` -> `duplicateInvoiceUiAction` (creates draft invoice)
- `Detail: Record payment` -> `recordManualPaymentUiAction`
- `Detail: Issue credit` -> `createCreditNoteUiAction`

## Customers and Products
- `Customers: Add customer` -> `createCustomerAction`
- `Products: Add product` -> `createProductAction`

## Reminders
- `Toggle rule` -> `toggleReminderRuleAction`
- `Create default policy` -> `createDefaultReminderPolicyAction`

## Templates
- `Save branding` -> `saveTemplateBrandingAction` (persists org branding)
- `Upload logo` -> `saveTemplateLogoMetadataAction` (persists logo path metadata)
- `Preview PDF` -> `getTemplatePreviewUrlAction` (opens generated preview target)

## Settings
- `Save organization changes` -> `saveOrganizationSettingsAction`
- `Update password` -> `updatePasswordSettingsAction`
- `Enable 2FA` -> `enableTwoFactorSettingsAction` (audited persistence)
- `Invite` -> `inviteTeamMemberSettingsAction` (audited persistence)
- `Team member action` -> `manageTeamMemberSettingsAction` (audited persistence)
- `Upgrade` -> `billingSettingsAction(action="upgrade")`
- `Update payment` -> `billingSettingsAction(action="payment-update")`

## Payments
- `Connect Stripe` -> `connectStripeAction` (audited persistence + route to billing)
- `Learn more` -> `openPayoutGuidanceAction` (audited persistence + route to billing)
