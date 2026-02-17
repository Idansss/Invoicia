import { describe, expect, test } from "vitest";

import { validateInvoice } from "@/compliance";

describe("compliance/base validation", () => {
  test("blocks send when required fields are missing", () => {
    const result = validateInvoice(
      {
        org: { name: "", currency: "NGN" },
        customer: { name: "", email: null },
        invoice: {
          id: "inv_1",
          number: "",
          issueDate: new Date("2026-02-09T00:00:00Z"),
          currency: "NGN",
          notes: null,
        },
        lineItems: [],
      },
      "BASE",
    );

    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.code === "CUSTOMER_EMAIL_REQUIRED")).toBe(true);
    expect(result.errors.some((e) => e.code === "LINE_ITEMS_REQUIRED")).toBe(true);
  });
});

