"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"

type AiVerification = {
  status?: string | null
  confidence?: number | null
  matchedSteps?: string[] | null
  missingSteps?: string[] | null
  summary?: string | null
  recommendation?: string | null
  analyzedAt?: string | null
}

export function AiVerificationSummary({ ai }: { ai: AiVerification | null | undefined }) {
  // Defensive defaults
  if (!ai) {
    return (
      <Card className="mt-3">
        <CardHeader>
          <CardTitle>AI Verification</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No analysis available.</p>
        </CardContent>
      </Card>
    )
  }

  const { status, confidence, matchedSteps, missingSteps, summary, recommendation } = ai

  if (status === "pending") {
    return (
      <Card className="mt-3">
        <CardHeader>
          <CardTitle>AI Verification</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Analysis in progress...</p>
        </CardContent>
      </Card>
    )
  }

  if (status === "analysis_failed" || status === "error") {
    return (
      <Card className="mt-3">
        <CardHeader>
          <CardTitle>AI Verification</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              <p className="text-sm">Analysis unavailable.</p>
            </AlertDescription>
          </Alert>
          {confidence != null && (
            <p className="text-xs text-muted-foreground mt-2">Confidence: {Math.round(confidence)}%</p>
          )}
        </CardContent>
      </Card>
    )
  }

  // Completed / available
  return (
    <Card className="mt-3">
      <CardHeader>
        <CardTitle>AI Verification</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {confidence != null && (
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">Confidence</span>
            <Badge className="bg-blue-100 text-blue-800">{Math.round(confidence)}%</Badge>
          </div>
        )}

        {matchedSteps && matchedSteps.length > 0 && (
          <div>
            <p className="text-sm font-medium">Matched Evidence</p>
            <ul className="list-inside list-disc mt-1 ml-4 text-sm">
              {matchedSteps.map((m, i) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
          </div>
        )}

        {missingSteps && missingSteps.length > 0 && (
          <div>
            <p className="text-sm font-medium">Missing Evidence</p>
            <ul className="list-inside list-disc mt-1 ml-4 text-sm text-amber-700">
              {missingSteps.map((m, i) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
          </div>
        )}

        {summary && (
          <div>
            <p className="text-sm font-medium">Summary</p>
            <p className="text-sm text-muted-foreground mt-1">{summary}</p>
          </div>
        )}

        {recommendation && (
          <div>
            <p className="text-sm font-medium">Recommendation</p>
            <p className="text-sm text-muted-foreground mt-1">{recommendation}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default AiVerificationSummary
