import Link from "next/link"

import { Button } from "@/components/ui/button"

interface QuickAction {
  label: string
  href: string
  icon: React.ElementType
}

export function QuickActions({ actions }: { actions: QuickAction[] }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {actions.map((action) => (
        <Button
          key={action.label}
          variant="outline"
          className="h-auto flex-col gap-2 py-4 text-xs font-medium bg-transparent"
          asChild
        >
          <Link href={action.href}>
            <action.icon className="h-5 w-5 text-primary" />
            {action.label}
          </Link>
        </Button>
      ))}
    </div>
  )
}
