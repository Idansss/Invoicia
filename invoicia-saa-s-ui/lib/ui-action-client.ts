export interface RunUiActionInput {
  type: string
  payload?: Record<string, unknown>
}

interface RunUiActionResponse {
  ok: boolean
  id?: string
  message?: string
}

export async function runUiAction(input: RunUiActionInput): Promise<RunUiActionResponse> {
  const response = await fetch("/api/actions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  })

  const body = (await response.json().catch(() => null)) as RunUiActionResponse | null

  if (!response.ok || !body?.ok) {
    throw new Error(body?.message || "Request failed")
  }

  return body
}

export function getActionErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message
  }
  return "Something went wrong"
}
