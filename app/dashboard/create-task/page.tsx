"use client"

import type React from "react"
import { useState } from "react"
import { motion } from "framer-motion"
import { Upload, CheckCircle2, AlertCircle, Copy, Share2, FileText, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
}

export default function CreateTaskPage() {
  const router = useRouter()
  // Form state
  const [taskTitle, setTaskTitle] = useState("")
  const [taskDescription, setTaskDescription] = useState("")
  const [category, setCategory] = useState("")
  const [deadline, setDeadline] = useState("")
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [verificationStep, setVerificationStep] = useState(0)
  const [verificationComplete, setVerificationComplete] = useState(false)
  const [verificationStatus, setVerificationStatus] = useState<"verified" | "flagged" | null>(null)
  const [integrityScore, setIntegrityScore] = useState(0)
  const [shareLink, setShareLink] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)

  const verificationSteps = [
    { name: "File Hashing", icon: "🔐" },
    { name: "Metadata Capture", icon: "📋" },
    { name: "Integrity Check", icon: "✓" },
    { name: "AI Validation", icon: "🤖" },
  ]

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = e.dataTransfer.files
    if (files && files[0]) {
      const file = files[0]
      if (file.type === "application/pdf" || file.type.startsWith("image/")) {
        setUploadedFile(file)
      }
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFile(e.target.files[0])
    }
  }

  const startVerification = async () => {
    if (!uploadedFile) return

    setIsVerifying(true)
    setVerificationStep(0)
    setVerificationComplete(false)

    // Simulate verification steps
    for (let i = 0; i < verificationSteps.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setVerificationStep(i + 1)
    }

    // Simulate final results
    await new Promise((resolve) => setTimeout(resolve, 500))
    const isVerified = Math.random() > 0.2
    setVerificationStatus(isVerified ? "verified" : "flagged")
    setIntegrityScore(Math.floor(Math.random() * 40) + 60)
    setVerificationComplete(true)
    setIsVerifying(false)
    setShareLink(`https://projectforge.io/verify/${Math.random().toString(36).substr(2, 9)}`)
  }

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareLink)
  }

  return (
    <SidebarProvider>
      <DashboardSidebar />

      <SidebarInset>
        <header className="border-b border-border sticky top-0 z-30 bg-background/95 backdrop-blur">
          <div className="flex items-center justify-between h-16 px-6 lg:px-8">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h1 className="text-xl font-semibold text-foreground">Create Task & Verify Proof</h1>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <div className="p-6 lg:p-8 max-w-4xl">
            <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-8">
              {/* Task Creation Section */}
              <motion.div variants={fadeInUp}>
                <Card>
                  <CardHeader>
                    <CardTitle>Task Details</CardTitle>
                    <CardDescription>Create a new task and upload proof of work</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Task Title */}
                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">Task Title</label>
                        <Input
                          placeholder="e.g., Complete project setup"
                          value={taskTitle}
                          onChange={(e) => setTaskTitle(e.target.value)}
                          disabled={isVerifying || verificationComplete}
                        />
                      </div>

                      {/* Task Description */}
                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">Description</label>
                        <Textarea
                          placeholder="Describe the task in detail..."
                          value={taskDescription}
                          onChange={(e) => setTaskDescription(e.target.value)}
                          disabled={isVerifying || verificationComplete}
                          className="min-h-24"
                        />
                      </div>

                      {/* Category & Deadline */}
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-foreground mb-2 block">Category (Optional)</label>
                          <Select
                            value={category}
                            onValueChange={setCategory}
                            disabled={isVerifying || verificationComplete}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="development">Development</SelectItem>
                              <SelectItem value="design">Design</SelectItem>
                              <SelectItem value="documentation">Documentation</SelectItem>
                              <SelectItem value="testing">Testing</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-foreground mb-2 block">Deadline (Optional)</label>
                          <Input
                            type="date"
                            value={deadline}
                            onChange={(e) => setDeadline(e.target.value)}
                            disabled={isVerifying || verificationComplete}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* File Upload Section */}
              <motion.div variants={fadeInUp}>
                <Card>
                  <CardHeader>
                    <CardTitle>Upload Proof</CardTitle>
                    <CardDescription>Drag and drop or select image and PDF files</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                      className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                        dragActive
                          ? "border-primary bg-primary/5"
                          : uploadedFile
                            ? "border-green-300 bg-green-50"
                            : "border-border bg-background"
                      }`}
                    >
                      {uploadedFile ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-center">
                            <FileText className="w-10 h-10 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{uploadedFile.name}</p>
                            <p className="text-sm text-muted-foreground">{(uploadedFile.size / 1024).toFixed(2)} KB</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setUploadedFile(null)}
                            disabled={isVerifying || verificationComplete}
                          >
                            Change File
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center justify-center">
                            <Upload className="w-10 h-10 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">Drag and drop your file here</p>
                            <p className="text-sm text-muted-foreground">or click to select</p>
                          </div>
                          <input
                            type="file"
                            accept=".pdf,image/*"
                            onChange={handleFileInput}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            disabled={isVerifying || verificationComplete}
                          />
                          <Button variant="outline" size="sm" asChild>
                            <span>Select File</span>
                          </Button>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">Supported formats: PDF, PNG, JPG, GIF</p>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Verification Flow Section */}
              {uploadedFile && (
                <motion.div variants={fadeInUp}>
                  <Card>
                    <CardHeader>
                      <CardTitle>Verification Process</CardTitle>
                      <CardDescription>Real-time proof-of-work verification steps</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {/* Step Indicators */}
                        <div className="space-y-4">
                          {verificationSteps.map((step, index) => (
                            <div key={index} className="flex items-center gap-4">
                              <div
                                className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                                  index < verificationStep
                                    ? "bg-green-100 text-green-700"
                                    : index === verificationStep
                                      ? "bg-blue-100 text-blue-700"
                                      : "bg-muted text-muted-foreground"
                                }`}
                              >
                                {index < verificationStep ? "✓" : step.icon}
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-foreground">{step.name}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {index < verificationStep && "Complete"}
                                  {index === verificationStep && "In progress..."}
                                  {index > verificationStep && "Waiting"}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Progress Bar */}
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-foreground">Overall Progress</span>
                            <span className="text-sm text-muted-foreground">{((verificationStep / 4) * 100) | 0}%</span>
                          </div>
                          <Progress value={(verificationStep / 4) * 100} className="h-2" />
                        </div>

                        {/* Verification Button */}
                        {!verificationComplete && (
                          <Button
                            onClick={startVerification}
                            disabled={isVerifying || !uploadedFile || !taskTitle}
                            className="w-full"
                            size="lg"
                          >
                            {isVerifying ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Verifying...
                              </>
                            ) : (
                              <>
                                <Upload className="w-4 h-4 mr-2" />
                                Start Verification
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Results Section */}
              {verificationComplete && verificationStatus && (
                <motion.div variants={fadeInUp}>
                  <Card>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle>Verification Result</CardTitle>
                          <CardDescription>Your proof-of-work has been analyzed</CardDescription>
                        </div>
                        <Badge variant={verificationStatus === "verified" ? "default" : "destructive"}>
                          {verificationStatus === "verified" ? "Verified" : "Flagged"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {/* Status Alert */}
                        {verificationStatus === "verified" ? (
                          <Alert>
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <AlertDescription className="text-green-700">
                              Your proof-of-work has been verified successfully. All integrity checks passed.
                            </AlertDescription>
                          </Alert>
                        ) : (
                          <Alert>
                            <AlertCircle className="h-4 w-4 text-orange-600" />
                            <AlertDescription className="text-orange-700">
                              Your submission has been flagged for review. Please check the details below.
                            </AlertDescription>
                          </Alert>
                        )}

                        {/* Integrity Score */}
                        <div className="bg-secondary/50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-foreground">Integrity Score</span>
                            <span className="text-2xl font-bold text-primary">{integrityScore}%</span>
                          </div>
                          <Progress value={integrityScore} className="h-2" />
                          <p className="text-xs text-muted-foreground mt-2">
                            {integrityScore >= 90
                              ? "Excellent integrity - No issues detected"
                              : integrityScore >= 70
                                ? "Good integrity - Minor inconsistencies found"
                                : "Low integrity - Please review the flagged items"}
                          </p>
                        </div>

                        {/* Explanation */}
                        <div>
                          <h4 className="font-medium text-foreground mb-2">Analysis Details</h4>
                          <div className="space-y-2 text-sm text-muted-foreground">
                            <p>✓ File format validation passed</p>
                            <p>✓ Metadata consistency verified</p>
                            <p>✓ File integrity hash confirmed</p>
                            {verificationStatus === "flagged" && <p>⚠ AI analysis detected potential modifications</p>}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Actions Section */}
              {verificationComplete && (
                <motion.div variants={fadeInUp}>
                  <Card
                    className={
                      verificationStatus === "verified"
                        ? "border-green-200 bg-green-50/50"
                        : "border-orange-200 bg-orange-50/50"
                    }
                  >
                    <CardHeader>
                      <CardTitle className={verificationStatus === "verified" ? "text-green-700" : "text-orange-700"}>
                        {verificationStatus === "verified" ? "Verification Successful" : "Verification Flagged"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Shareable Link */}
                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">Shareable Proof Link</label>
                        <div className="flex gap-2">
                          <Input value={shareLink} readOnly className="text-xs" />
                          <Button variant="outline" size="icon" onClick={copyShareLink} title="Copy to clipboard">
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Share this link to verify your proof with others
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button className="flex-1" onClick={() => router.push("/dashboard/tasks")}>
                          Save Verified Task
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1 bg-transparent"
                          onClick={() => router.push("/dashboard/audit-logs")}
                        >
                          View Audit Log
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => navigator.clipboard.writeText(shareLink)}>
                          <Share2 className="w-4 h-4" />
                        </Button>
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
