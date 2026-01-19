"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
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
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
}

export default function AuditLogsContent() {
  const [searchQuery, setSearchQuery] = useState("")
  const { user } = useAuth()
  const [auditEntries, setAuditEntries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchLogs() {
      if (!user) return;
      try {
        const token = await user.getIdToken();
        const res = await fetch(`/api/audit-logs?t=${Date.now()}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setAuditEntries(data);
        }
      } catch (err) {
        console.error("Failed to fetch logs", err);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      fetchLogs();

      // Real-Time Sync via SSE
      let eventSource: EventSource | null = null;

      const setupSSE = async () => {
        const token = await user.getIdToken();
        eventSource = new EventSource(`/api/sync/events?token=${token}`);

        eventSource.onmessage = (event) => {
          const data = JSON.parse(event.data);
          if (data.type === "update") {
            console.log("Real-time audit update:", data.action);
            fetchLogs();
          }
        };

        eventSource.onerror = () => {
          eventSource?.close();
          setTimeout(setupSSE, 5000);
        };
      };

      setupSSE();

      return () => {
        eventSource?.close();
      };
    }
  }, [user]);

  const filteredEntries = auditEntries.filter((entry) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      (entry.action?.toLowerCase() || "").includes(searchLower) ||
      (entry.details?.toLowerCase() || "").includes(searchLower) ||
      (typeof entry.metadata?.taskName === 'string' && entry.metadata.taskName.toLowerCase().includes(searchLower))
    )
  })

  const verifiedCount = auditEntries.filter(e =>
    e.action?.includes('VERIFIED') ||
    e.action?.includes('COMPLETED') ||
    e.metadata?.integrityCheckDetails?.hashMatch === true
  ).length;

  const flaggedCount = auditEntries.filter(e =>
    e.action?.includes('FLAGGED') ||
    e.integrityStatus === 'flagged' ||
    e.metadata?.integrityCheckDetails?.hashMatch === false
  ).length;

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

  const handleExportPDF = () => {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(18);
    doc.text("Audit Logs Report", 14, 22);

    // Metadata
    doc.setFontSize(11);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
    doc.text(`Total Entries: ${filteredEntries.length}`, 14, 36);

    // Table Data
    const tableColumn = ["Timestamp", "Action", "Details", "Proof Hash", "Integrity"];
    const tableRows = filteredEntries.map(entry => [
      new Date(entry.timestamp).toLocaleString(),
      (entry.action || "").replace(/_/g, " "),
      entry.details || "",
      entry.metadata?.fileHash
        ? String(entry.metadata.fileHash).substring(0, 16) + "..."
        : entry.entryHash
          ? String(entry.entryHash).substring(0, 16) + "..."
          : "System",
      entry.metadata?.fileHash ? "File Secured" : entry.entryHash ? "Signed" : "Logged"
    ]);

    // Generate Table
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 44,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [22, 163, 74] }, // Green header logic
    });

    // Save
    doc.save(`audit_logs_${new Date().toISOString().split('T')[0]}.pdf`);
  };

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
              <Button variant="outline" size="sm" onClick={handleExportPDF}>
                <Download className="w-4 h-4 mr-2" />
                Export PDF
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

              {flaggedCount > 0 && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-700 ml-2">
                    <span className="font-semibold">{flaggedCount} integrity failures detected</span> in your audit
                    logs. Review these items immediately for security.
                  </AlertDescription>
                </Alert>
              )}

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
                      <div className="text-3xl font-bold text-foreground">{verifiedCount}</div>
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
                      <div className="text-3xl font-bold text-foreground">{flaggedCount}</div>
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
                              <TableRow key={entry._id || entry.id}>
                                <TableCell>
                                  <Badge variant="outline">
                                    {(entry.action || "").replace(/_/g, " ")}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div>
                                    <p className="font-medium text-foreground text-sm truncate max-w-[200px]" title={entry.details}>{entry.details}</p>
                                    {entry.metadata?.stepId && (
                                      <p className="text-xs text-muted-foreground">Step: {entry.metadata.stepId}</p>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>{entry.metadata?.fileHash ? "File Proof" : "System"}</TableCell>
                                <TableCell className="font-mono text-xs">
                                  {entry.metadata?.fileHash
                                    ? String(entry.metadata.fileHash).slice(0, 12) + "..."
                                    : entry.entryHash
                                      ? String(entry.entryHash).slice(0, 12) + "..."
                                      : "—"}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {formatTimestamp(entry.timestamp)}
                                </TableCell>
                                <TableCell>
                                  {entry.integrityStatus === 'flagged' ? (
                                    <span className="text-sm font-bold text-red-600 flex items-center gap-1">
                                      <AlertCircle className="w-3 h-3" /> Flagged / Tampered
                                    </span>
                                  ) : (
                                    <span className={`text-sm font-medium ${entry.metadata?.fileHash || entry.entryHash ? "text-green-600" : "text-muted-foreground"}`}>
                                      {entry.metadata?.fileHash ? "✓ File Secured" : entry.entryHash ? "• Entry Signed" : "• Logged"}
                                    </span>
                                  )}
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
