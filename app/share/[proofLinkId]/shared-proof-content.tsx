"use client"

import { motion } from "framer-motion"
import { CheckCircle2, FileText, Shield } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"

import { useState, useEffect } from "react"

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
}

export function SharedProofContent({ proofLinkId }: { proofLinkId: string }) {
  const [proofData, setProofData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProof() {
      try {
        const res = await fetch(`/api/public/proof/${proofLinkId}`);
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Failed to load proof");
        }
        const data = await res.json();
        setProofData(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchProof();
  }, [proofLinkId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error || !proofData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Access Denied / Not Found</h3>
            <p className="text-muted-foreground">{error || "This proof link is invalid or private."}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const formatTimestamp = (isoString: string): string => {
    if (!isoString) return "Pending"
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
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (step.proofId) {
                                  window.open(`/api/proof/${step.proofId}/raw`, '_blank');
                                }
                              }}
                              className="flex-shrink-0"
                            >
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              View Proof
                            </Button>
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
