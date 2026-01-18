import { Suspense } from "react"
import { TaskDetailsContent } from "./task-details-content"

export default async function TaskDetailsPage({ params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await params
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading task details...</div>}>
      <TaskDetailsContent taskId={taskId} />
    </Suspense>
  )
}
