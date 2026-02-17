export type OutgoingEvent =
  | "invoice.sent"
  | "invoice.viewed"
  | "invoice.paid"
  | "invoice.overdue"
  | "dispute.created"
  | "credit_note.issued";

export async function emitOutgoingWebhook(_event: OutgoingEvent, _payload: unknown) {
  void _event;
  void _payload;
  // TODO (Phase 2): store webhook endpoints per org, sign payloads, retry delivery, and expose delivery logs.
  // This is a stub to keep the event architecture explicit.
}
