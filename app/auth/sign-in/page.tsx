"use client"

import type React from "react"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Eye, EyeOff, Loader2, ShieldCheck, ArrowRight } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth"
import { auth, googleProvider } from "@/lib/firebase"
import { useAuth } from "@/contexts/AuthContext"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { toast } from "sonner"
import { toastUtils } from "@/lib/toast-utils"

export default function SignInPage() {
  const router = useRouter()
  const { syncUser } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  // 2FA State
  const [show2FA, setShow2FA] = useState(false)
  const [twoFactorToken, setTwoFactorToken] = useState("")
  const [verifying2fa, setVerifying2fa] = useState(false)
  const [twoFactorMethod, setTwoFactorMethod] = useState<'totp' | 'pin'>('totp')

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
          setTwoFactorMethod(data.user.twoFactorMethod || 'totp');
          setShow2FA(true);
          setIsLoading(false);
        } else {
          // Check for redirect parameter
          const urlParams = new URLSearchParams(window.location.search);
          const redirectPath = urlParams.get("redirect");
          if (redirectPath) {
            router.push(decodeURIComponent(redirectPath));
          } else {
            router.push("/dashboard");
          }
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
    setIsLoading(true)

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      await handlePostSignIn(userCredential.user)
    } catch (err: any) {
      console.error(err)
      if (err.code === "auth/invalid-credential") {
        setError("Invalid email or password.")
      } else if (err.code === "auth/user-not-found") {
        setError("No user found with this email.")
      } else if (err.code === "auth/wrong-password") {
        setError("Incorrect password.")
      } else {
        setError(err.message || "Failed to sign in. Please try again.")
      }
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
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
      setError(err.message || "Failed to sign in with Google.")
      setIsLoading(false)
    }
  }

  const handleVerify2FA = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (twoFactorToken.length < 6) return;

    setVerifying2fa(true)
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/2fa/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ token: twoFactorToken })
      });

      if (res.ok) {
        toastUtils.auth.twoFactorRequired();
        // Check for redirect parameter
        const urlParams = new URLSearchParams(window.location.search);
        const redirectPath = urlParams.get("redirect");
        router.push(redirectPath ? decodeURIComponent(redirectPath) : "/dashboard");
      } else {
        const data = await res.json();
        toastUtils.error("Invalid verification code", {
          description: data.error || "Please check your code and try again"
        });
        setTwoFactorToken("");
      }
    } catch (e) {
      toastUtils.error("Verification failed", {
        description: "Please try again or contact support"
      });
    } finally {
      setVerifying2fa(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-8 sm:py-12 relative">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-60 sm:w-80 h-60 sm:h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-60 sm:w-80 h-60 sm:h-80 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <AnimatePresence mode="wait">
        {!show2FA ? (
          <motion.div
            key="sign-in-form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-sm relative z-10"
          >
            <div className="text-center mb-6 sm:mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">ProjectForge</h1>
              <p className="text-sm sm:text-base text-muted-foreground">Sign in to your account</p>
            </div>

            <Card className="shadow-lg">
              <CardHeader className="space-y-1">
                <CardTitle className="text-xl sm:text-2xl">Welcome Back</CardTitle>
                <CardDescription className="text-sm">Enter your credentials to access ProjectForge</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription className="text-sm">{error}</AlertDescription>
                    </Alert>
                  )}

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
                    <div className="flex items-center justify-between">
                      <label htmlFor="password" className="text-sm font-medium">Password</label>
                      <Link href="/auth/forgot-password" title="Reset your password" className="text-xs sm:text-sm text-primary hover:underline transition">Forgot password?</Link>
                    </div>
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

                  <Button type="submit" className="w-full h-10 sm:h-11" disabled={isLoading}>
                    {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Signing in...</> : "Sign In"}
                  </Button>

                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
                    <div className="relative flex justify-center text-xs uppercase text-muted-foreground"><span className="bg-card px-2">Or continue with</span></div>
                  </div>

                  <Button type="button" variant="outline" className="w-full h-10 sm:h-11 bg-transparent" disabled={isLoading} onClick={handleGoogleSignIn}>
                    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                    <span className="text-sm">Continue with Google</span>
                  </Button>
                </form>

                <p className="text-center text-xs sm:text-sm text-muted-foreground mt-6">
                  Don't have an account? <Link href="/auth/sign-up" className="text-primary hover:underline">Create one</Link>
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="2fa-form"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm relative z-10"
          >
            <Card>
              <CardHeader className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Verify Your Identity</CardTitle>
                <CardDescription>
                  {twoFactorMethod === 'pin'
                    ? "Enter your 6-digit Account Protection PIN"
                    : "Enter the code from your Authenticator app"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={twoFactorToken}
                    onChange={(val) => setTwoFactorToken(val)}
                    autoFocus
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <Button className="w-full" onClick={handleVerify2FA} disabled={twoFactorToken.length !== 6 || verifying2fa}>
                  {verifying2fa ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ArrowRight className="w-4 h-4 mr-2" /> Verify & Access</>}
                </Button>

                <button
                  onClick={() => { setShow2FA(false); auth.signOut(); }}
                  className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition"
                >
                  Back to Log In
                </button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
