interface PasswordStrengthProps {
  password: string
}

function getStrength(password: string): { score: 0 | 1 | 2 | 3; label: string; color: string } {
  if (!password) return { score: 0, label: "", color: "" }
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12 && /[A-Z]/.test(password) && /[0-9]/.test(password)) score++
  if (score >= 1 && /[^A-Za-z0-9]/.test(password)) score++
  if (score === 0) return { score: 1, label: "Weak", color: "bg-destructive" }
  if (score === 1) return { score: 2, label: "Fair", color: "bg-amber-500" }
  return { score: 3, label: "Strong", color: "bg-emerald-500" }
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  if (!password) return null
  const { score, label, color } = getStrength(password)

  return (
    <div className="space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3].map((level) => (
          <div
            key={level}
            className={`h-1 flex-1 rounded-full transition-colors ${level <= score ? color : "bg-border"}`}
          />
        ))}
      </div>
      <p className={`text-xs font-medium ${score === 1 ? "text-destructive" : score === 2 ? "text-amber-500" : "text-emerald-600"}`}>
        {label}
      </p>
    </div>
  )
}
