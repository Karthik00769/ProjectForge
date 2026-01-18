import { Card, CardContent } from "@/components/ui/card"

export default function CreateCustomTemplateLoading() {
  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-8">
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4 animate-pulse">
            <div className="h-6 bg-muted rounded w-1/2"></div>
            <div className="h-10 bg-muted rounded"></div>
            <div className="h-10 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
