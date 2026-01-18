"use client"

import { motion } from "framer-motion"
import { CheckCircle2, FileText, Shield } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
}

// Mock shared proof data
const sharedProofDataMap: Record<string, any> = {
  "1a2b3c4d5e6f7g8h": {
    taskId: "1",
    taskTitle: "API Integration Setup",
    taskDescription: "Set up REST API endpoints for user authentication with OAuth2 support",
    templateName: "Professional Services",
    status: "completed",
    completionDate: "2025-02-10",
    integrityScore: 98,
    verifiedAt: "2025-02-10T15:45:00Z",
    steps: [
      {
        id: "step-1",
        name: "Planning & Design",
        status: "completed",
        uploadedFile: "api-plan.pdf",
        uploadedDate: "2025-02-08",
      },
      {
        id: "step-2",
        name: "API Development",
        status: "completed",
        uploadedFile: "api-code.pdf",
        uploadedDate: "2025-02-09",
      },
      {
        id: "step-3",
        name: "Testing & Validation",
        status: "completed",
        uploadedFile: "test-report.pdf",
        uploadedDate: "2025-02-10",
      },
    ],
    auditEntries: [
      {
        id: "audit-001",
        action: "task_verified",
        taskName: "API Integration Setup",
        stepName: "Testing & Validation",
        proofType: "pdf",
        proofHash: "sha256_a1b2c3d4e5f6g7h8",
        timestamp: "2025-02-10T15:35:00Z",
        integrityStatus: "verified",
      },
      {
        id: "audit-002",
        action: "task_verified",
        taskName: "API Integration Setup",
        stepName: "API Development",
        proofType: "pdf",
        proofHash: "sha256_i9j0k1l2m3n4o5p6",
        timestamp: "2025-02-09T16:20:00Z",
        integrityStatus: "verified",
      },
    ],
  },
}

export function SharedProofContent({ proofLinkId }: { proofLinkId: string }) {
  const proofData = sharedProofDataMap[proofLinkId]

  if (!proofData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Proof link not found or has expired.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const formatTimestamp = (isoString: string): string => {
    const date = new Date(isoString)
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border sticky top-0 z-30 bg-background/95 backdrop-blur">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-green-600" />
            <h1 className="text-2xl font-bold text-foreground">Verified Proof of Work</h1>
          </div>
          <p className="text-muted-foreground text-sm mt-2">Immutable evidence record - Read-only view</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 lg:px-8 py-8">
        <motion.div initial="initial" animate="animate" className="space-y-6">
          {/* Verification Badge */}
          <motion.div variants={fadeInUp}>
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700 ml-2">
                <span className="font-semibold">Verified Proof</span> - All steps completed and integrity verified
              </AlertDescription>
            </Alert>
          </motion.div>

          {/* Task Details */}
          <motion.div variants={fadeInUp}>
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-2xl">{proofData.taskTitle}</CardTitle>
                    <CardDescription className="mt-2">{proofData.taskDescription}</CardDescription>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Completed</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                <div className="border-t border-border pt-4">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Template</p>
                      <p className="text-sm font-medium text-foreground">{proofData.templateName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Completion Date</p>
                      <p className="text-sm font-medium text-foreground">{proofData.completionDate}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Integrity Score</p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-green-600">{proofData.integrityScore}%</p>
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Steps Section */}
          <motion.div variants={fadeInUp}>
            <Card>
              <CardHeader>
                <CardTitle>Task Steps & Proofs</CardTitle>
                <CardDescription>Step-by-step evidence record</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {proofData.steps.map((step: any, index: number) => (
                    <div key={step.id} className="border border-border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-sm font-semibold text-green-700">
                            ✓
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-foreground">{step.name}</h4>
                            <Badge className="mt-1 bg-green-100 text-green-800 text-xs">Completed</Badge>
                          </div>
                        </div>
                      </div>

                      {step.uploadedFile && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-green-600 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-green-900">{step.uploadedFile}</p>
                              <p className="text-xs text-green-700">Uploaded on {step.uploadedDate}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Audit Log Section */}
          <motion.div variants={fadeInUp}>
            <Card>
              <CardHeader>
                <CardTitle>Immutable Audit Trail</CardTitle>
                <CardDescription>Complete evidence record - Cannot be edited or deleted</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-semibold">Action</TableHead>
                        <TableHead className="font-semibold">Step</TableHead>
                        <TableHead className="font-semibold">File</TableHead>
                        <TableHead className="font-semibold">Timestamp</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {proofData.auditEntries.map((entry: any) => (
                        <TableRow key={entry.id}>
                          <TableCell>
                            <Badge variant="default" className="capitalize">
                              {entry.action.replace(/_/g, " ")}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">{entry.stepName || "—"}</TableCell>
                          <TableCell className="font-mono text-xs">
                            {entry.proofHash ? entry.proofHash.slice(0, 12) + "..." : "—"}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatTimestamp(entry.timestamp)}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm font-medium text-green-600">✓ Verified</span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Footer Notice */}
          <motion.div variants={fadeInUp}>
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <span className="font-semibold">Read-Only Record:</span> This shared proof is a read-only, immutable
                evidence record. No modifications, deletions, or hidden edits are possible. Verified on{" "}
                {formatTimestamp(proofData.verifiedAt)}.
              </AlertDescription>
            </Alert>
          </motion.div>
        </motion.div>
      </main>
    </div>
  )
}
