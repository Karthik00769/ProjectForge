import { Card, CardContent } from "@/components/ui/card"

export default function TemplateTaskLoading() {
  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="h-8 bg-muted rounded animate-pulse mb-4" />
          <div className="h-4 bg-muted rounded w-2/3 animate-pulse" />
        </CardContent>
      </Card>

      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="h-6 bg-muted rounded animate-pulse mb-3" />
              <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
