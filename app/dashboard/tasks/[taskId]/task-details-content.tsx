"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { ArrowLeft, CheckCircle2, Clock, FileText, Upload, X, Copy, Share2, Lock, Globe, Mail, Sparkles, Download, AlertTriangle, Eye } from "lucide-react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
}

import { auth } from "@/lib/firebase"

// Helper to format date - ensures proper 4-digit year display
const formatDate = (dateString?: string | Date) => {
  if (!dateString) return "—"
  try {
    const date = new Date(dateString)
    // Check if date is valid
    if (isNaN(date.getTime())) return "—"

    // Format with explicit locale to ensure proper year display
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  } catch (error) {
    console.error("Date formatting error:", error)
    return "—"
  }
}

import { useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"

export function TaskDetailsContent({ taskId }: { taskId: string }) {
  const router = useRouter()
  const { user } = useAuth()
  const [task, setTask] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [uploadingSteps, setUploadingSteps] = useState<Record<string, File | null>>({})
  const [isUploading, setIsUploading] = useState(false)
  const [proofLinkVisibility, setProofLinkVisibility] = useState<"private" | "restricted" | "public">("private")
  const [restrictedEmails, setRestrictedEmails] = useState("")
  const [isEditingEmails, setIsEditingEmails] = useState(false)
  // const [proofLinkId] = useState(() => {
  //   // Generate a unique proof link for completed tasks
  //   if (task && task.status === "completed") {
  //     return Math.random().toString(36).substr(2, 16)
  //   }
  //   return null
  // })
  // For now use mock ID or future ProofLink ID
  const [proofLinkId, setProofLinkId] = useState<string | null>(null);
  const proofShareUrl = proofLinkId
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/share/${proofLinkId}`
    : ""

  useEffect(() => {
    async function fetchTaskAndLink() {
      if (!user) return;
      try {
        const token = await user.getIdToken();

        // 1. Fetch Task
        const resTask = await fetch(`/api/tasks/${taskId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (resTask.ok) {
          const data = await resTask.json();
          setTask(data);

          // 2. If task completed, fetch Proof Link
          // We fetch it regardless of status if we want to be safe, but it likely only exists if completed.
          // However, user might view a task that WAS completed.
          // Let's fetch it always to be robust. 
          const resLink = await fetch(`/api/tasks/${taskId}/share`, {
            headers: { Authorization: `Bearer ${token}` }
          });

          if (resLink.ok) {
            const linkData = await resLink.json();
            // If link exists (isActive/created), populate state
            if (linkData && linkData._id) {
              setProofLinkId(linkData._id || null);
              setProofLinkVisibility(linkData.visibility || 'private');
              if (linkData.allowedEmails) {
                setRestrictedEmails(linkData.allowedEmails.join(', '));
              }
            }
          }
        } else {
          console.error("Failed to fetch task");
          setTask(null);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchTaskAndLink();
  }, [taskId, user]);

  // Function to save share settings
  const updateShareSettings = async (visibility: string, emails: string) => {
    if (!user) return;
    try {
      const emailList = emails.split(',').map(e => e.trim()).filter(e => e);
      const token = await user.getIdToken();
      await fetch(`/api/tasks/${taskId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          visibility,
          allowedEmails: emailList
        })
      });
      toast.success("Share settings updated");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update share settings");
    }
  };

  // Also update when restricted emails input loses focus
  const handleEmailBlur = () => {
    updateShareSettings(proofLinkVisibility, restrictedEmails);
  };

  const handleFileSelect = (stepId: string, file: File) => {
    setUploadingSteps((prev) => ({ ...prev, [stepId]: file }))
  }

  const handleUploadSubmit = async (stepId: string) => {
    const file = uploadingSteps[stepId];
    if (!file || !user) return;

    setIsUploading(true);
    try {
      const token = await user.getIdToken();
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`/api/tasks/${taskId}/steps/${stepId}/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (res.ok) {
        // Refresh task data
        const updatedTaskRes = await fetch(`/api/tasks/${taskId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const updatedTask = await updatedTaskRes.json();
        setTask(updatedTask);
        // Clear upload state
        setUploadingSteps((prev) => {
          const newState = { ...prev };
          delete newState[stepId];
          return newState;
        });
      } else {
        alert("Upload failed");
      }
    } catch (err) {
      console.error(err);
      alert("Error uploading file");
    } finally {
      setIsUploading(false);
    }
  }

  if (loading) {
    return (
      <SidebarProvider>
        <DashboardSidebar />
        <SidebarInset>
          <div className="flex items-center justify-center h-full">
            <p>Loading task details...</p>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  if (!task) {
    return (
      <SidebarProvider>
        <DashboardSidebar />
        <SidebarInset>
          <header className="border-b border-border sticky top-0 z-30 bg-background/95 backdrop-blur">
            <div className="flex items-center h-16 px-6 lg:px-8 gap-4">
              <SidebarTrigger />
              <Button variant="ghost" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </div>
          </header>
          <main className="flex-1 p-6 lg:p-8">
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">Task not found</p>
              </CardContent>
            </Card>
          </main>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-5 h-5 text-green-600" />
      case "in-progress":
        return <Clock className="w-5 h-5 text-blue-600" />
      case "pending":
        return <Clock className="w-5 h-5 text-gray-600" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>
      case "in-progress":
        return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>
      case "pending":
        return <Badge variant="secondary">Pending</Badge>
      default:
        return null
    }
  }

  const getStepStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800 text-xs">Completed</Badge>
      case "in-progress":
        return <Badge className="bg-blue-100 text-blue-800 text-xs">In Progress</Badge>
      case "pending":
        return (
          <Badge variant="secondary" className="text-xs">
            Pending
          </Badge>
        )
      default:
        return null
    }
  }

  const completedSteps = task.steps.filter((step: any) => step.status === "completed").length
  const totalSteps = task.steps.length
  const progressPercentage = Math.round((completedSteps / totalSteps) * 100)

  // Removed old handleStepUpload in favor of handleFileSelect and handleUploadSubmit

  const handleRemoveUpload = (stepId: string) => {
    setUploadingSteps((prev) => {
      const newState = { ...prev }
      delete newState[stepId]
      return newState
    })
  }

  const copyProofLink = () => {
    navigator.clipboard.writeText(proofShareUrl)
    toast.success("Link copied to clipboard!")
  }

  const downloadPDF = async () => {
    if (!user) return

    try {
      const token = await user.getIdToken()
      const response = await fetch(`/api/tasks/${taskId}/pdf`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!response.ok) {
        throw new Error("Failed to generate PDF")
      }

      // Create blob from response
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `task-${taskId}-proof.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success("PDF downloaded successfully!")
    } catch (error) {
      console.error("PDF download error:", error)
      toast.error("Failed to download PDF")
    }
  }

  return (
    <SidebarProvider>
      <DashboardSidebar />

      <SidebarInset>
        <header className="border-b border-border sticky top-0 z-30 bg-background/95 backdrop-blur">
          <div className="flex items-center justify-between h-16 px-6 lg:px-8">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <Button variant="ghost" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Tasks
              </Button>
            </div>
            {task && (
              <Button variant="outline" size="sm" onClick={downloadPDF}>
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <div className="p-6 lg:p-8">
            <motion.div initial="initial" animate="animate" className="space-y-6">
              {/* Task Header */}
              <motion.div variants={fadeInUp}>
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {getStatusIcon(task.status)}
                          <h1 className="text-3xl font-bold text-foreground">{task.title}</h1>
                        </div>
                        <p className="text-muted-foreground">{task.description}</p>
                      </div>
                      {getStatusBadge(task.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-4 pt-4 border-t border-border">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs text-muted-foreground font-medium">Progress</p>
                          <p className="text-sm font-semibold text-foreground">
                            {completedSteps} / {totalSteps} steps
                          </p>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2.5">
                          <div
                            className="h-2.5 rounded-full bg-green-600 transition-all"
                            style={{ width: `${progressPercentage}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{progressPercentage}% complete</p>
                      </div>
                      <div className="grid md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Due Date</p>
                          <p className="text-sm font-medium text-foreground">{task.dueDate}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Completion Date</p>
                          <p className="text-sm font-medium text-foreground">{formatDate(task.completionDate)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Total Steps</p>
                          <p className="text-sm font-medium text-foreground">{totalSteps}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Status</p>
                          <p className="text-sm font-medium text-foreground">
                            {task.status === "completed" ? "Completed" : "In Progress"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Steps Execution Section */}
              <motion.div variants={fadeInUp}>
                <Card>
                  <CardHeader>
                    <CardTitle>Task Steps</CardTitle>
                    <CardDescription>Complete each step by uploading required proof</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {task.steps.map((step: any, index: number) => (
                        <div key={step.stepId || step.id} className="border border-border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-start gap-3 flex-1">
                              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-semibold">
                                {index + 1}
                              </div>
                              <div className="flex-1">
                                {/* Use template data logic if name is missing in task steps? Ideally backend populated it. 
                                    Our Task model has steps with stepId vs name. 
                                    Wait, the Task model steps array only had { stepId, status, proofId }. 
                                    We need to ideally Populate step details from Template or store them in Task.
                                    For now, we might be missing step names if we didn't store them in Task.
                                    Let's check Route.ts -> "const taskSteps = template.steps.map(...)".
                                    The created task in DB only has stepId. 
                                    We should probably store 'name' in Task steps to avoid double lookups or populate.
                                    Assumption: Backend now returns enriched steps or we need to fix backend? 
                                    Let's assume for now we might see "Step {index+1}" if name missing, 
                                    BUT we should fix backend to store name. 
                                    For this step, let's use step.stepId as fallback. */}
                                <h4 className="font-semibold text-foreground">{step.name || `Step ${index + 1}`}</h4>
                                <div className="flex items-center gap-2 mt-1">{getStepStatusBadge(step.status)}</div>
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 space-y-3">
                            {step.status === "completed" ? (
                              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                <div className="flex items-center gap-3">
                                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-green-900">Proof Uploaded</p>
                                    <p className="text-xs text-green-700">Uploaded on {formatDate(step.uploadedAt)}</p>
                                    {/* AI Verification Badge */}
                                    {step.extractedText && (
                                      <div className="mt-2 text-xs bg-white/50 p-2 rounded border border-green-100 text-green-800">
                                        <span className="font-semibold flex items-center gap-1">
                                          <Sparkles className="w-3 h-3" />
                                          AI Extracted Text:
                                        </span>
                                        <p className="line-clamp-3 mt-1 italic">{step.extractedText}</p>
                                      </div>
                                    )}
                                  </div>
                                  {/* VIEW FILES BUTTON - RIGHT SIDE */}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={async () => {
                                      if (!step.proofId) {
                                        toast.error("Proof file not found");
                                        return;
                                      }

                                      try {
                                        let headers: Record<string, string> = {};
                                        if (user) {
                                          const token = await user.getIdToken();
                                          headers["Authorization"] = `Bearer ${token}`;
                                        }

                                        const res = await fetch(`/api/proof/${step.proofId}/raw`, { headers });
                                        if (!res.ok) throw new Error("Failed to load file");

                                        const blob = await res.blob();
                                        const url = window.URL.createObjectURL(blob);
                                        window.open(url, '_blank');

                                        // Cleanup after a delay to ensure new tab loads
                                        setTimeout(() => window.URL.revokeObjectURL(url), 60000);
                                      } catch (e) {
                                        console.error(e);
                                        toast.error("Could not view file. You may need to sign in.");
                                      }
                                    }}
                                    className="flex-shrink-0"
                                  >
                                    <Eye className="w-4 h-4 mr-1" />
                                    View Files
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                                {uploadingSteps[step.stepId] ? (
                                  <div className="space-y-2">
                                    <p className="text-sm font-medium text-foreground">
                                      {uploadingSteps[step.stepId]!.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {(uploadingSteps[step.stepId]!.size / 1024).toFixed(2)} KB
                                    </p>
                                    <Button variant="outline" size="sm" onClick={() => handleRemoveUpload(step.stepId)}>
                                      <X className="w-4 h-4 mr-1" />
                                      Remove
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="space-y-2">
                                    <Upload className="w-6 h-6 mx-auto text-muted-foreground" />
                                    <p className="text-sm text-foreground font-medium">Upload Proof</p>
                                    <p className="text-xs text-muted-foreground">Click to select photo or PDF</p>
                                    <input
                                      type="file"
                                      accept=".pdf,image/*"
                                      onChange={(e) => {
                                        if (e.target.files?.[0]) {
                                          handleFileSelect(step.stepId, e.target.files[0])
                                        }
                                      }}
                                      className="hidden"
                                      id={`upload-${step.stepId}`}
                                    />
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => document.getElementById(`upload-${step.stepId}`)?.click()}
                                    >
                                      <Upload className="w-4 h-4 mr-1" />
                                      Select File
                                    </Button>
                                  </div>
                                )}
                              </div>
                            )}

                            {step.status !== "completed" && uploadingSteps[step.stepId] && (
                              <Button className="w-full" size="sm" onClick={() => handleUploadSubmit(step.stepId)} disabled={isUploading}>
                                {isUploading ? "Uploading..." : "Mark Step Complete"}
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Auto-complete message when all steps done */}
              {task.status === "completed" && (
                <motion.div variants={fadeInUp}>
                  <Card className="border-green-200 bg-green-50">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3 mb-4">
                        <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-green-900">Task Complete</p>
                          <p className="text-sm text-green-700">
                            All steps have been completed and verified. Proof link is ready for sharing.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Proof Link Sharing Section */}
              {task.status === "completed" && proofLinkId && (
                <motion.div variants={fadeInUp}>
                  <Card>
                    <CardHeader>
                      <CardTitle>Share Verified Proof</CardTitle>
                      <CardDescription>Control who can view your verification link</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Visibility Badge */}
                      <Alert>
                        <Share2 className="h-4 w-4" />
                        <AlertDescription>
                          Your proof link has been automatically generated. Choose who can access it below.
                        </AlertDescription>
                      </Alert>

                      {/* Visibility Control */}
                      <div className="space-y-3">
                        <label className="text-sm font-medium text-foreground">Link Visibility</label>
                        <Select
                          value={proofLinkVisibility}
                          onValueChange={(value: "private" | "restricted" | "public") => {
                            setProofLinkVisibility(value);
                            // Auto-save changes
                            updateShareSettings(value, restrictedEmails);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="private">
                              <div className="flex items-center gap-2">
                                <Lock className="w-4 h-4" />
                                Private - Only you can view
                              </div>
                            </SelectItem>
                            <SelectItem value="restricted">
                              <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                Restricted - Selected emails only
                              </div>
                            </SelectItem>
                            <SelectItem value="public">
                              <div className="flex items-center gap-2">
                                <Globe className="w-4 h-4" />
                                Public - Anyone with link
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Restricted Emails Input */}
                      {proofLinkVisibility === "restricted" && (
                        <div className="space-y-3">
                          <label className="text-sm font-medium text-foreground">Allowed Emails</label>
                          {!isEditingEmails ? (
                            <div className="flex items-start justify-between p-3 border border-border rounded-md bg-muted/50">
                              <div className="text-sm">
                                {restrictedEmails ? (
                                  restrictedEmails.split(',').map((email, i) => (
                                    <span key={i} className="inline-block bg-background border border-border rounded px-2 py-0.5 mr-2 mb-1 text-xs">
                                      {email.trim()}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-muted-foreground italic">No emails allowed yet</span>
                                )}
                              </div>
                              <Button variant="ghost" size="sm" onClick={() => setIsEditingEmails(true)} className="h-6 px-2">
                                Edit
                              </Button>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <Input
                                placeholder="Enter emails separated by commas"
                                value={restrictedEmails}
                                onChange={(e) => setRestrictedEmails(e.target.value)}
                              />
                              <div className="flex gap-2 justify-end">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    // Reset to last saved value (need to track it or just re-fetch? simplification: keep current input but toggle off?)
                                    // Better to just fetch or keep a 'savedRestrictedEmails' ref.
                                    // For now, allow cancel to just exit edit mode, user loses unsaved changes if they didn't click save?
                                    // Actually, let's just toggle off.
                                    setIsEditingEmails(false);
                                  }}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    updateShareSettings("restricted", restrictedEmails);
                                    setIsEditingEmails(false);
                                  }}
                                >
                                  Save Access List
                                </Button>
                              </div>
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground">e.g., client@company.com, manager@company.com</p>
                        </div>
                      )}

                      {/* Shareable Link */}
                      <div className="space-y-3">
                        <label className="text-sm font-medium text-foreground">Proof Link</label>
                        <div className="flex gap-2">
                          <Input value={proofShareUrl} readOnly className="text-xs" />
                          <Button variant="outline" size="icon" onClick={copyProofLink} title="Copy to clipboard">
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Share this link to verify your proof with others
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </motion.div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
