import { Suspense } from "react"
import MyTasksContent from "./my-tasks-content"

export default function MyTasksPage() {
  return (
    <Suspense fallback={null}>
      <MyTasksContent />
    </Suspense>
  )
}
