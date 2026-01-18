"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { AlertTriangle, Search, Download, CheckCircle2, AlertCircle, Clock } from "lucide-react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { AuditLogEntry } from "@/lib/audit-types"

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
}

export default function AuditLogsContent() {
  const [searchQuery, setSearchQuery] = useState("")
  const currentUserId = "user-123" // In production, get from auth context

  const auditEntries: AuditLogEntry[] = [
    {
      id: "audit-001",
      userId: currentUserId,
      action: "task_verified",
      taskId: "1",
      taskName: "API Integration Setup",
      stepId: "step-3",
      stepName: "Testing & Validation",
      proofType: "pdf",
      proofHash: "sha256_a1b2c3d4e5f6g7h8",
      fileMetadata: {
        name: "test-report.pdf",
        size: 245000,
        type: "application/pdf",
        uploadedDate: "2025-02-10T15:30:00Z",
      },
      timestamp: "2025-02-10T15:35:00Z",
      integrityStatus: "verified",
      integrityCheckDetails: {
        hashMatch: true,
        metadataValid: true,
        aiValidationResult: true,
      },
      readonly: true,
    },
    {
      id: "audit-002",
      userId: currentUserId,
      action: "file_uploaded",
      taskId: "2",
      taskName: "Design System v2",
      stepId: "step-1",
      stepName: "Design Phase",
      proofType: "photo",
      proofHash: "sha256_i9j0k1l2m3n4o5p6",
      fileMetadata: {
        name: "designs.zip",
        size: 1245000,
        type: "application/zip",
        uploadedDate: "2025-02-09T14:20:00Z",
      },
      timestamp: "2025-02-09T14:22:00Z",
      integrityStatus: "pending",
      integrityCheckDetails: {
        hashMatch: true,
        metadataValid: true,
      },
      readonly: true,
    },
    {
      id: "audit-003",
      userId: currentUserId,
      action: "task_verified",
      taskId: "5",
      taskName: "Testing Framework Setup",
      stepId: "step-3",
      stepName: "Documentation",
      proofType: "pdf",
      proofHash: "sha256_q7r8s9t0u1v2w3x4",
      fileMetadata: {
        name: "testing-guide.pdf",
        size: 567000,
        type: "application/pdf",
        uploadedDate: "2025-02-12T10:15:00Z",
      },
      timestamp: "2025-02-12T10:18:00Z",
      integrityStatus: "verified",
      integrityCheckDetails: {
        hashMatch: true,
        metadataValid: true,
        aiValidationResult: true,
      },
      readonly: true,
    },
    {
      id: "audit-004",
      userId: currentUserId,
      action: "verification_started",
      taskId: "3",
      taskName: "Database Optimization",
      stepId: "step-1",
      stepName: "Analysis",
      proofType: "pdf",
      timestamp: "2025-02-08T09:45:00Z",
      integrityStatus: "pending",
      integrityCheckDetails: {
        hashMatch: false,
        metadataValid: true,
      },
      readonly: true,
    },
    {
      id: "audit-005",
      userId: currentUserId,
      action: "task_flagged",
      taskId: "4",
      taskName: "Security Audit",
      stepId: "step-2",
      stepName: "Penetration Testing",
      proofType: "pdf",
      proofHash: "sha256_y5z6a7b8c9d0e1f2",
      fileMetadata: {
        name: "pentest-report.pdf",
        size: 890000,
        type: "application/pdf",
        uploadedDate: "2025-02-06T16:30:00Z",
      },
      timestamp: "2025-02-06T16:35:00Z",
      integrityStatus: "flagged",
      integrityCheckDetails: {
        hashMatch: false,
        metadataValid: true,
        aiValidationResult: false,
      },
      readonly: true,
    },
  ]

  const filteredEntries = auditEntries.filter((entry) => {
    const matchesSearch =
      entry.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.taskName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (entry.stepName?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
    return matchesSearch
  })

  const tamperedCount = auditEntries.filter((e) => e.integrityStatus === "flagged").length

  const formatTimestamp = (isoString: string): string => {
    const date = new Date(isoString)
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  return (
    <SidebarProvider>
      <DashboardSidebar />

      <SidebarInset>
        <header className="border-b border-border sticky top-0 z-30 bg-background/95 backdrop-blur">
          <div className="flex items-center justify-between h-16 px-6 lg:px-8">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h1 className="text-xl font-semibold text-foreground">Audit Logs</h1>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <div className="p-6 lg:p-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              <Alert className="border-blue-200 bg-blue-50">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-700 ml-2">
                  Showing your activity logs only. All entries in this audit log are immutable and cannot be edited or
                  deleted.
                </AlertDescription>
              </Alert>

              {/* Tamper Alert */}
              {tamperedCount > 0 && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-700 ml-2">
                    <span className="font-semibold">{tamperedCount} integrity failures detected</span> in your audit
                    logs. Review these items immediately for security.
                  </AlertDescription>
                </Alert>
              )}

              {/* Summary Cards */}
              <div className="grid md:grid-cols-3 gap-6">
                <motion.div variants={fadeInUp}>
                  <Card>
                    <CardHeader className="flex flex-row items-start justify-between space-y-0">
                      <div>
                        <CardTitle className="text-sm font-medium text-foreground/70">Total Entries</CardTitle>
                        <CardDescription>All recorded actions</CardDescription>
                      </div>
                      <Clock className="w-5 h-5 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-foreground">{auditEntries.length}</div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div variants={fadeInUp}>
                  <Card>
                    <CardHeader className="flex flex-row items-start justify-between space-y-0">
                      <div>
                        <CardTitle className="text-sm font-medium text-foreground/70">Verified</CardTitle>
                        <CardDescription>Passed integrity checks</CardDescription>
                      </div>
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-foreground">
                        {auditEntries.filter((e) => e.integrityStatus === "verified").length}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div variants={fadeInUp}>
                  <Card>
                    <CardHeader className="flex flex-row items-start justify-between space-y-0">
                      <div>
                        <CardTitle className="text-sm font-medium text-foreground/70">Flagged</CardTitle>
                        <CardDescription>Require attention</CardDescription>
                      </div>
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-foreground">{tamperedCount}</div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              <motion.div variants={fadeInUp}>
                <Card>
                  <CardHeader>
                    <CardTitle>Search Evidence Records</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by task name, action, or step..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Evidence Records Table */}
              <motion.div variants={fadeInUp}>
                <Card>
                  <CardHeader>
                    <CardTitle>Evidence Record</CardTitle>
                    <CardDescription>
                      Complete immutable history of all actions and proofs ({filteredEntries.length} entries)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="font-semibold">Action</TableHead>
                            <TableHead className="font-semibold">Task / Step</TableHead>
                            <TableHead className="font-semibold">Proof Type</TableHead>
                            <TableHead className="font-semibold">Proof Hash</TableHead>
                            <TableHead className="font-semibold">Timestamp</TableHead>
                            <TableHead className="font-semibold">Integrity</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredEntries.length > 0 ? (
                            filteredEntries.map((entry) => (
                              <TableRow key={entry.id}>
                                <TableCell>
                                  <Badge
                                    variant={
                                      entry.integrityStatus === "verified"
                                        ? "default"
                                        : entry.integrityStatus === "flagged"
                                          ? "destructive"
                                          : "secondary"
                                    }
                                  >
                                    {entry.action.replace(/_/g, " ")}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div>
                                    <p className="font-medium text-foreground">{entry.taskName}</p>
                                    {entry.stepName && (
                                      <p className="text-xs text-muted-foreground">{entry.stepName}</p>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>{entry.proofType || "—"}</TableCell>
                                <TableCell className="font-mono text-xs">
                                  {entry.proofHash ? entry.proofHash.slice(0, 12) + "..." : "—"}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {formatTimestamp(entry.timestamp)}
                                </TableCell>
                                <TableCell>
                                  <span
                                    className={`text-sm font-medium ${
                                      entry.integrityStatus === "verified"
                                        ? "text-green-600"
                                        : entry.integrityStatus === "flagged"
                                          ? "text-red-600"
                                          : "text-blue-600"
                                    }`}
                                  >
                                    {entry.integrityStatus === "verified" && "✓ Passed"}
                                    {entry.integrityStatus === "flagged" && "⚠ Failed"}
                                    {entry.integrityStatus === "pending" && "⏳ Pending"}
                                  </span>
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                No entries matching your search.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Immutability Notice */}
              <motion.div variants={fadeInUp}>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <span className="font-semibold">Immutable Evidence Record:</span> All audit logs are permanently
                    recorded and cannot be edited, deleted, or hidden. Integrity failures indicate potential
                    unauthorized modifications. Review flagged entries and take appropriate action.
                  </AlertDescription>
                </Alert>
              </motion.div>
            </motion.div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
