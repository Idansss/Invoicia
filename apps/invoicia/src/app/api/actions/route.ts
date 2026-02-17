import { NextResponse } from "next/server"

export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      message: "Deprecated endpoint. Use server actions.",
    },
    { status: 410 },
  )
}
