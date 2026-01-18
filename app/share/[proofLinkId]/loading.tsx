import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function SharedProofLoading() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border sticky top-0 z-30 bg-background/95 backdrop-blur">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 py-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48 mt-2" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <Skeleton className="h-12 w-full" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-8 w-48" />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
