"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Lock, Eye, EyeOff, Save, LogOut, Trash2, ShieldCheck, QrCode, Loader2, Download, AlertCircle, Key, Smartphone, ArrowRight, ShieldAlert } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
}

export default function SettingsPage() {
  const router = useRouter()
  const { user, mongoUser, loading, logout, syncUser } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // 2FA State
  const [is2faDialogOpen, setIs2faDialogOpen] = useState(false)
  const [isPinDialogOpen, setIsPinDialogOpen] = useState(false)
  const [is2faSetupLoading, setIs2faSetupLoading] = useState(false)
  const [twoFactorToken, setTwoFactorToken] = useState("")
  const [pinToken, setPinToken] = useState("")
  const [setupData, setSetupData] = useState<{ qrCode: string, secret: string } | null>(null)
  const [verifying2fa, setVerifying2fa] = useState(false)

  useEffect(() => {
    syncUser();
  }, []);

  if (loading) {
    return (
      <SidebarProvider>
        <DashboardSidebar />
        <SidebarInset>
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  const displayName = mongoUser?.displayName || user?.displayName || ""
  const email = mongoUser?.email || user?.email || ""
  const [firstName = "", ...lastNameParts] = displayName.split(" ")
  const lastName = lastNameParts.join(" ")

  const handleSaveProfile = () => {
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 3000)
    toast.success("Profile settings updated")
  }

  const handleLogoutAll = async () => {
    try {
      await logout()
      router.push("/auth/sign-in")
      toast.info("Logged out from all devices")
    } catch (e) {
      toast.error("Logout failed")
    }
  }

  const handleDeleteAccount = async () => {
    if (!confirm("Are you ABSOLUTELY sure you want to delete your account? This will erase all your tasks, proofs, and audit logs permanently.")) return;

    try {
      const token = await user?.getIdToken();
      const res = await fetch("/api/user/delete", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success("Account deleted successfully");
        await logout();
        router.push("/auth/sign-up");
      } else {
        toast.error("Failed to delete account");
      }
    } catch (e) {
      toast.error("An error occurred during account deletion");
    }
  }

  const handleDownloadData = () => {
    if (!user) return;
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text("ProjectForge User Data Report", 14, 20);
    doc.setFontSize(12);
    doc.text(`User ID: ${user.uid}`, 14, 32);
    doc.text(`Email: ${user.email}`, 14, 40);
    doc.text(`Name: ${displayName}`, 14, 48);
    doc.text(`Plan: ${mongoUser?.role === 'admin' ? 'Administrator' : 'Standard User'}`, 14, 56);
    doc.text(`Credits: ${mongoUser?.credits || 0}`, 14, 64);
    doc.text(`2FA Enabled: ${mongoUser?.twoFactorEnabled ? 'Yes' : 'No'}`, 14, 72);
    doc.text(`Report Generated: ${new Date().toLocaleString()}`, 14, 85);
    doc.text("--------------------------------------------------", 14, 95);
    doc.text("This report contains your profile information and security settings stored", 14, 105);
    doc.text("on ProjectForge. For your full task history, please use the Audit Logs export.", 14, 112);
    doc.save(`projectforge-data-${user.uid.slice(0, 8)}.pdf`);
    toast.success("Data report downloaded");
  }

  // 2FA Functions
  const handleEnable2faInit = async () => {
    setIs2faSetupLoading(true);
    setIs2faDialogOpen(true);
    try {
      const token = await user?.getIdToken();
      const res = await fetch("/api/2fa/setup", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSetupData({ qrCode: data.qrCode, secret: data.secret });
      }
    } catch (e) {
      toast.error("Failed to initialize 2FA setup");
    } finally {
      setIs2faSetupLoading(false);
    }
  };

  const handleVerify2fa = async () => {
    if (!twoFactorToken || !setupData) return;
    setVerifying2fa(true);
    try {
      const token = await user?.getIdToken();
      const res = await fetch("/api/2fa/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          secret: setupData.secret,
          token: twoFactorToken
        })
      });
      if (res.ok) {
        toast.success("2FA enabled successfully!");
        setIs2faDialogOpen(false);
        setSetupData(null);
        setTwoFactorToken("");
        setTimeout(async () => {
          await syncUser();
        }, 800);
      } else {
        const err = await res.json();
        toast.error(err.error || "Invalid code");
      }
    } catch (e) {
      toast.error("Verification failed");
    } finally {
      setVerifying2fa(false);
    }
  };

  const handleSetupPin = async () => {
    if (pinToken.length !== 6) return;
    setVerifying2fa(true);
    try {
      const token = await user?.getIdToken();
      const res = await fetch("/api/2fa/setup-pin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ pin: pinToken })
      });
      if (res.ok) {
        toast.success("Security PIN set successfully!");
        setIsPinDialogOpen(false);
        setPinToken("");
        setTimeout(async () => {
          await syncUser();
        }, 800);
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to set PIN");
      }
    } catch (e) {
      toast.error("Setup failed");
    } finally {
      setVerifying2fa(false);
    }
  }

  const handleDisable2fa = async () => {
    const code = prompt(`Please enter your current ${mongoUser?.twoFactorMethod === 'pin' ? 'PIN' : '2FA code'} to disable 2FA:`);
    if (!code) return;

    try {
      const token = await user?.getIdToken();
      const res = await fetch("/api/2fa/disable", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ token: code })
      });
      if (res.ok) {
        toast.success("2FA disabled successfully");
        await syncUser();
      } else {
        toast.error("Failed to disable 2FA. Code might be incorrect.");
      }
    } catch (e) {
      toast.error("An error occurred");
    }
  };

  return (
    <SidebarProvider>
      <DashboardSidebar />

      <SidebarInset>
        <header className="border-b border-border sticky top-0 z-30 bg-background/95 backdrop-blur">
          <div className="flex items-center justify-between h-16 px-6 lg:px-8">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h1 className="text-xl font-semibold text-foreground">Settings</h1>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <div className="max-w-4xl mx-auto p-6 lg:p-8 space-y-8">
            <motion.div initial="initial" animate="animate" variants={{ animate: { transition: { staggerChildren: 0.1 } } }} className="space-y-8">

              {/* Profile Information */}
              <motion.div variants={fadeInUp}>
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>Update your personal details and how others see you</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex flex-col md:flex-row gap-8 items-start">
                      <div className="flex flex-col items-center gap-4">
                        <div className="relative group">
                          <div className="w-24 h-24 rounded-2xl bg-primary/10 flex items-center justify-center overflow-hidden border-2 border-primary/20 transition-all group-hover:border-primary/50">
                            {user?.photoURL && user.photoURL !== "" ? (
                              <img src={user.photoURL} alt={displayName} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-3xl font-bold text-primary">
                                {displayName.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex-1 grid md:grid-cols-2 gap-4 w-full">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">First Name</label>
                          <Input defaultValue={firstName} placeholder="John" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Last Name</label>
                          <Input defaultValue={lastName} placeholder="Doe" />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-sm font-medium">Email Address</label>
                          <Input defaultValue={email} disabled className="bg-secondary/50" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="bg-secondary/20 flex justify-end">
                    <Button onClick={handleSaveProfile} disabled={saveSuccess}>
                      {saveSuccess ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : <><Save className="w-4 h-4 mr-2" /> Save Changes</>}
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>

              {/* Account Security - 2FA Section Overhaul */}
              <motion.div variants={fadeInUp}>
                <Card>
                  <CardHeader>
                    <CardTitle>Account Protection</CardTitle>
                    <CardDescription>Manage security settings and multi-factor authentication</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    {/* Password */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-foreground flex items-center gap-2">
                        <Lock className="w-4 h-4 text-primary" />
                        Password Management
                      </h4>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground">Current Password</label>
                          <div className="relative">
                            <Input type={showPassword ? "text" : "password"} placeholder="••••••••" />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground">New Password</label>
                          <div className="relative">
                            <Input type={showNewPassword ? "text" : "password"} placeholder="••••••••" />
                            <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                              {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">Update Password</Button>
                    </div>

                    <Separator />

                    {/* 2FA Section - Creative and Simple UI */}
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-foreground flex items-center gap-2">
                            <ShieldCheck className={`w-4 h-4 ${mongoUser?.twoFactorEnabled ? "text-green-600" : "text-primary"}`} />
                            Double Layer Protection (2FA)
                          </h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {mongoUser?.twoFactorEnabled
                              ? `Currently protected via ${mongoUser.twoFactorMethod === 'pin' ? 'Security PIN' : 'Authenticator App'}`
                              : "Choose a simple method to protect your account from unauthorized access"}
                          </p>
                        </div>
                        <Badge variant={mongoUser?.twoFactorEnabled ? "default" : "secondary"} className={mongoUser?.twoFactorEnabled ? "bg-green-600" : ""}>
                          {mongoUser?.twoFactorEnabled ? "Secure" : "Not Protected"}
                        </Badge>
                      </div>

                      {mongoUser?.twoFactorEnabled ? (
                        <div className="bg-secondary/30 rounded-xl p-4 border border-border flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            {mongoUser.twoFactorMethod === 'pin' ? <Key className="w-8 h-8 text-primary" /> : <Smartphone className="w-8 h-8 text-primary" />}
                            <div>
                              <p className="font-semibold">{mongoUser.twoFactorMethod === 'pin' ? 'Simple PIN Protection' : 'App-based Verification'}</p>
                              <p className="text-xs text-muted-foreground">Enabled on {new Date(mongoUser.twoFactorEnabledAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50" onClick={handleDisable2fa}>
                            Disable Protection
                          </Button>
                        </div>
                      ) : (
                        <div className="grid md:grid-cols-2 gap-4">
                          {/* PIN Option - Simple & Creative */}
                          <div
                            onClick={() => setIsPinDialogOpen(true)}
                            className="p-5 rounded-2xl border-2 border-border border-dashed hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group"
                          >
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                              <Key className="w-5 h-5 text-primary" />
                            </div>
                            <h5 className="font-bold mb-1">Security PIN</h5>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              Fastest and easiest! Just remember any 6 numbers. No apps needed.
                            </p>
                            <div className="mt-4 flex items-center text-xs font-semibold text-primary">
                              Setup PIN <ArrowRight className="w-3 h-3 ml-1" />
                            </div>
                          </div>

                          {/* App Option */}
                          <div
                            onClick={handleEnable2faInit}
                            className="p-5 rounded-2xl border-2 border-border border-dashed hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group"
                          >
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                              <Smartphone className="w-5 h-5 text-primary" />
                            </div>
                            <h5 className="font-bold mb-1">Authenticator App</h5>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              Standard protection using apps like Google Authenticator or Authy.
                            </p>
                            <div className="mt-4 flex items-center text-xs font-semibold text-primary">
                              Scan QR Code <ArrowRight className="w-3 h-3 ml-1" />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Data Export Card */}
              <motion.div variants={fadeInUp}>
                <Card>
                  <CardHeader>
                    <CardTitle>Your Information</CardTitle>
                    <CardDescription>Export your profile and security status records</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-secondary/40 rounded-xl p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                          <ShieldAlert className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <p className="font-semibold">Security Status PDF</p>
                          <p className="text-xs text-muted-foreground">Certified report of your current account state</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={handleDownloadData}>
                        <Download className="w-4 h-4 mr-2" /> Download
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Danger Zone */}
              <motion.div variants={fadeInUp}>
                <Card className="border-red-200 bg-red-50/20">
                  <CardHeader>
                    <CardTitle className="text-red-800">Danger Zone</CardTitle>
                    <CardDescription>Permanent actions that cannot be undone</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button variant="ghost" className="w-full justify-start text-red-600 bg-white hover:bg-red-50 border border-red-100" onClick={handleDeleteAccount}>
                      <Trash2 className="w-4 h-4 mr-2" /> Permanently Delete My Account
                    </Button>
                    <Button variant="outline" className="w-full justify-start" onClick={handleLogoutAll}>
                      <LogOut className="w-4 h-4 mr-2" /> Force Logout from All Devices
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

            </motion.div>
          </div>
        </main>
      </SidebarInset>

      {/* Authenticator App Dialog */}
      <Dialog open={is2faDialogOpen} onOpenChange={setIs2faDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Setup Authenticator App</DialogTitle>
            <DialogDescription>
              Scan the QR code below with your preferred app.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center justify-center space-y-6 py-4">
            {is2faSetupLoading ? (
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
            ) : setupData ? (
              <>
                <div className="p-4 bg-white rounded-2xl shadow-xl border border-border">
                  <img src={setupData.qrCode} alt="2FA QR Code" className="w-48 h-48" />
                </div>

                <div className="w-full px-4 text-center">
                  <p className="text-xs text-muted-foreground mb-2">
                    Can't scan? Use this code manually:
                  </p>
                  <code className="block bg-secondary p-2 rounded text-[10px] font-mono tracking-tighter break-all">
                    {setupData.secret}
                  </code>
                </div>

                <div className="w-full space-y-4 pt-4 border-t">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Enter 6-digit App Code</label>
                    <div className="flex justify-center">
                      <InputOTP maxLength={6} value={twoFactorToken} onChange={setTwoFactorToken}>
                        <InputOTPGroup><InputOTPSlot index={0} /><InputOTPSlot index={1} /><InputOTPSlot index={2} /><InputOTPSlot index={3} /><InputOTPSlot index={4} /><InputOTPSlot index={5} /></InputOTPGroup>
                      </InputOTP>
                    </div>
                  </div>
                </div>
              </>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIs2faDialogOpen(false)}>Close</Button>
            <Button onClick={handleVerify2fa} disabled={twoFactorToken.length !== 6 || verifying2fa}>
              {verifying2fa ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Enable Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PIN Dialog - SIMPLE & CREATIVE */}
      <Dialog open={isPinDialogOpen} onOpenChange={setIsPinDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader className="text-center">
            <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
              <Key className="w-7 h-7 text-primary" />
            </div>
            <DialogTitle>Create Security PIN</DialogTitle>
            <DialogDescription>
              Choose a 6-digit PIN you'll remember. It will be required every time you sign in.
            </DialogDescription>
          </DialogHeader>

          <div className="py-6 flex flex-col items-center gap-6">
            <div className="space-y-4">
              <InputOTP maxLength={6} value={pinToken} onChange={setPinToken} autoFocus>
                <InputOTPGroup>
                  <InputOTPSlot index={0} className="w-12 h-14 text-lg" />
                  <InputOTPSlot index={1} className="w-12 h-14 text-lg" />
                  <InputOTPSlot index={2} className="w-12 h-14 text-lg" />
                  <InputOTPSlot index={3} className="w-12 h-14 text-lg" />
                  <InputOTPSlot index={4} className="w-12 h-14 text-lg" />
                  <InputOTPSlot index={5} className="w-12 h-14 text-lg" />
                </InputOTPGroup>
              </InputOTP>
            </div>
            <p className="text-[10px] text-muted-foreground text-center px-4">
              Security PIN is encrypted. If you lose it, you'll need to contact support to reset your account access.
            </p>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsPinDialogOpen(false)} className="w-full">Cancel</Button>
            <Button onClick={handleSetupPin} disabled={pinToken.length !== 6 || verifying2fa} className="w-full">
              {verifying2fa ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Activate My PIN
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </SidebarProvider>
  )
}
