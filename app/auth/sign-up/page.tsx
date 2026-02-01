"use client"

import type React from "react"
import { useState } from "react"
import { motion } from "framer-motion"
import { Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup } from "firebase/auth"
import { auth, googleProvider } from "@/lib/firebase"

export default function SignUpPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [agreeToTerms, setAgreeToTerms] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handlePostSignIn = async (user: any, displayName?: string, photoURL?: string) => {
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/auth/sync?t=${Date.now()}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          displayName: displayName || user.displayName,
          photoURL: photoURL || user.photoURL
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.user.twoFactorEnabled) {
          router.push("/auth/sign-in");
        } else {
          // Check for redirect parameter
          const urlParams = new URLSearchParams(window.location.search);
          const redirectPath = urlParams.get("redirect");
          router.push(redirectPath ? decodeURIComponent(redirectPath) : "/dashboard");
        }
      } else {
        // Fallback redirect handling
        const urlParams = new URLSearchParams(window.location.search);
        const redirectPath = urlParams.get("redirect");
        router.push(redirectPath ? decodeURIComponent(redirectPath) : "/dashboard");
      }
    } catch (e) {
      console.error("Auth sync error", e);
      // Fallback redirect handling
      const urlParams = new URLSearchParams(window.location.search);
      const redirectPath = urlParams.get("redirect");
      router.push(redirectPath ? decodeURIComponent(redirectPath) : "/dashboard");
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!agreeToTerms) {
      setError("You must agree to the terms and conditions")
      return
    }

    setIsLoading(true)

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      await updateProfile(userCredential.user, { displayName: fullName })
      await handlePostSignIn(userCredential.user, fullName)
    } catch (err: any) {
      console.error(err)
      if (err.code === "auth/email-already-in-use") {
        setError("This email is already in use.")
      } else if (err.code === "auth/weak-password") {
        setError("Password should be at least 6 characters.")
      } else {
        setError(err.message || "Failed to create account.")
      }
      setIsLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    setIsLoading(true)
    setError("")
    try {
      const userCredential = await signInWithPopup(auth, googleProvider)
      await handlePostSignIn(userCredential.user)
    } catch (err: any) {
      console.error(err)
      if (err.code === "auth/cancelled-popup-request" || err.code === "auth/popup-closed-by-user") {
        setIsLoading(false)
        return
      }
      setError(err.message || "Failed to sign up with Google.")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-8 sm:py-12 relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-60 sm:w-80 h-60 sm:h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-60 sm:w-80 h-60 sm:h-80 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-sm relative z-10">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">ProjectForge</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Create your account to get started</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl sm:text-2xl">Join ProjectForge</CardTitle>
            <CardDescription className="text-sm">Start verifying your work with confidence</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <Alert variant="destructive"><AlertDescription className="text-sm">{error}</AlertDescription></Alert>}

              <div className="space-y-2">
                <label htmlFor="fullName" className="text-sm font-medium">Full name</label>
                <Input 
                  id="fullName" 
                  type="text" 
                  placeholder="John Doe" 
                  value={fullName} 
                  onChange={(e) => setFullName(e.target.value)} 
                  disabled={isLoading} 
                  required 
                  className="h-10 sm:h-11"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">Email address</label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="you@example.com" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  disabled={isLoading} 
                  required 
                  className="h-10 sm:h-11"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">Password</label>
                <div className="relative">
                  <Input 
                    id="password" 
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    disabled={isLoading} 
                    required 
                    className="h-10 sm:h-11 pr-10"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)} 
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition" 
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-start gap-3 py-2">
                <Checkbox id="terms" checked={agreeToTerms} onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)} disabled={isLoading} />
                <label htmlFor="terms" className="text-xs sm:text-sm text-muted-foreground leading-relaxed cursor-pointer">
                  I agree to the <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link> and <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
                </label>
              </div>

              <Button type="submit" className="w-full h-10 sm:h-11" disabled={isLoading || !agreeToTerms}>
                {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating account...</> : "Create Account"}
              </Button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
                <div className="relative flex justify-center text-xs uppercase text-muted-foreground"><span className="bg-card px-2">Or sign up with</span></div>
              </div>

              <Button type="button" variant="outline" className="w-full h-10 sm:h-11 bg-transparent" disabled={isLoading} onClick={handleGoogleSignUp}>
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                <span className="text-sm">Sign up with Google</span>
              </Button>
            </form>

            <p className="text-center text-xs sm:text-sm text-muted-foreground mt-6">
              Already have an account? <Link href="/auth/sign-in" className="text-primary hover:underline">Sign in</Link>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
