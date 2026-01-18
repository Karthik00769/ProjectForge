// Immutable audit log data types
export interface AuditLogEntry {
  id: string
  userId: string // Only show logs for logged-in user
  action: "task_created" | "file_uploaded" | "task_verified" | "task_flagged" | "verification_started"
  taskId: string
  taskName: string
  stepId?: string
  stepName?: string
  proofType?: "pdf" | "photo" | "document"
  proofHash?: string // SHA-256 hash for integrity verification
  fileMetadata?: {
    name: string
    size: number
    type: string
    uploadedDate: string
  }
  timestamp: string // ISO 8601 format
  integrityStatus: "verified" | "pending" | "flagged"
  integrityCheckDetails?: {
    hashMatch: boolean
    metadataValid: boolean
    aiValidationResult?: boolean
  }
  // IMMUTABLE - these logs cannot be edited, deleted, or hidden
  readonly: true
}

export const generateProofHash = (fileName: string, size: number, timestamp: string): string => {
  // Simulated SHA-256 hash for demo purposes
  return `sha256_${Buffer.from(`${fileName}${size}${timestamp}`).toString("hex").slice(0, 16)}`
}
