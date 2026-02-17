import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface KpiCardProps {
  title: string
  value: string | number
  change?: string
  description?: string
  icon?: React.ElementType
}

export function KpiCard({ title, value, change, description, icon: Icon }: KpiCardProps) {
  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {Icon ? (
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
            <Icon className="h-4 w-4 text-primary" />
          </div>
        ) : null}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        {(change || description) ? (
          <div className="flex items-center gap-1.5 mt-1">
            {change ? (
              <Badge
                variant="outline"
                className={`text-xs border-0 px-1.5 py-0 ${change.startsWith("+") ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" : "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"}`}
              >
                {change}
              </Badge>
            ) : null}
            {description ? <span className="text-xs text-muted-foreground">{description}</span> : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
