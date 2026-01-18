export type ProofLinkVisibility = "private" | "restricted" | "public"

export interface ProofLink {
  id: string
  taskId: string
  userId: string
  linkHash: string
  visibility: ProofLinkVisibility
  restrictedEmails?: string[]
  generatedAt: string
  expiresAt?: string
}

export interface SharedProofData {
  taskId: string
  taskTitle: string
  taskDescription: string
  templateId: string
  templateName: string
  status: "completed" | "in-progress"
  completionDate: string
  steps: Array<{
    id: string
    name: string
    status: string
    uploadedFile: string | null
    uploadedDate: string | null
  }>
  auditEntries: Array<{
    id: string
    action: string
    taskName: string
    stepName?: string
    proofType?: string
    proofHash?: string
    timestamp: string
    integrityStatus: "verified" | "pending" | "flagged"
  }>
  verifiedAt: string
  integrityScore: number
}
