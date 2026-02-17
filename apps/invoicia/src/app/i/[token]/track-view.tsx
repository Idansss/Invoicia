"use client";

import { useEffect } from "react";

export function TrackView({ token }: { token: string }) {
  useEffect(() => {
    fetch(`/api/public/invoices/${token}/view`, { method: "POST" }).catch(() => {});
  }, [token]);

  return null;
}

