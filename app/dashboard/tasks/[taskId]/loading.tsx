import { Spinner } from "@/components/ui/spinner"

export default function TaskDetailsLoading() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="text-center">
        <Spinner className="w-8 h-8 mx-auto mb-4" />
        <p className="text-muted-foreground">Loading task details...</p>
      </div>
    </div>
  )
}
