import { Suspense } from "react"
import AuditLogsContent from "./audit-logs-content"

export default function AuditLogsPage() {
  return (
    <Suspense fallback={null}>
      <AuditLogsContent />
    </Suspense>
  )
}
