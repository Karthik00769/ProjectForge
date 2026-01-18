"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Lock, Eye, EyeOff, Save, LogOut, Trash2, Copy, Check } from "lucide-react"
import { useRouter } from "next/navigation"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
}

export default function SettingsPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [copied, setCopied] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const handleCopyApiKey = () => {
    navigator.clipboard.writeText("sk_live_************************")
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSaveProfile = () => {
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 3000)
  }

  const handleLogout = () => {
    router.push("/auth/sign-in")
  }

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
          <div className="p-6 lg:p-8 max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              {/* Profile Information */}
              <motion.div variants={fadeInUp}>
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>Manage your account details and basic information</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Avatar & Basic Info */}
                      <div className="flex items-center gap-6">
                        <div className="flex-1">
                          <p className="font-semibold text-foreground text-lg">John Doe</p>
                          <p className="text-muted-foreground">john@example.com</p>
                          <Badge className="mt-2">Premium Member</Badge>
                        </div>
                        <Button variant="outline">Change Avatar</Button>
                      </div>

                      <Separator />

                      {/* Form Fields */}
                      <div className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-foreground mb-2 block">First Name</label>
                            <Input defaultValue="John" />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-foreground mb-2 block">Last Name</label>
                            <Input defaultValue="Doe" />
                          </div>
                        </div>

                        <div>
                          <label className="text-sm font-medium text-foreground mb-2 block">Email Address</label>
                          <Input type="email" defaultValue="john@example.com" />
                        </div>

                        <div>
                          <label className="text-sm font-medium text-foreground mb-2 block">Organization</label>
                          <Input placeholder="Your organization name" />
                        </div>

                        {saveSuccess && (
                          <Alert>
                            <Check className="h-4 w-4 text-green-600" />
                            <AlertDescription className="text-green-700 ml-2">
                              Profile saved successfully!
                            </AlertDescription>
                          </Alert>
                        )}

                        <Button onClick={handleSaveProfile} className="w-full md:w-auto">
                          <Save className="w-4 h-4 mr-2" />
                          Save Changes
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Account Security */}
              <motion.div variants={fadeInUp}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lock className="w-5 h-5" />
                      Account Security
                    </CardTitle>
                    <CardDescription>Manage your password and security settings</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Change Password */}
                      <div className="space-y-4">
                        <h4 className="font-semibold text-foreground">Change Password</h4>

                        <div>
                          <label className="text-sm font-medium text-foreground mb-2 block">Current Password</label>
                          <div className="relative">
                            <Input type={showPassword ? "text" : "password"} placeholder="Enter current password" />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="text-sm font-medium text-foreground mb-2 block">New Password</label>
                          <div className="relative">
                            <Input type={showNewPassword ? "text" : "password"} placeholder="Enter new password" />
                            <button
                              type="button"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                            >
                              {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            Use at least 12 characters with uppercase, lowercase, numbers, and symbols
                          </p>
                        </div>

                        <Button variant="outline" className="w-full md:w-auto bg-transparent">
                          Update Password
                        </Button>
                      </div>

                      <Separator />

                      {/* Two-Factor Authentication */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-foreground">Two-Factor Authentication</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              Add an extra layer of security to your account
                            </p>
                          </div>
                          <Badge>Not Enabled</Badge>
                        </div>
                        <Button variant="outline" className="w-full md:w-auto bg-transparent">
                          Enable 2FA
                        </Button>
                      </div>

                      <Separator />

                      {/* Active Sessions */}
                      <div className="space-y-4">
                        <h4 className="font-semibold text-foreground">Active Sessions</h4>
                        <div className="bg-secondary/50 rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-foreground">Current Session</p>
                              <p className="text-xs text-muted-foreground">MacBook Pro • San Francisco, CA</p>
                            </div>
                            <Badge variant="default">Active</Badge>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Only one active session is displayed. Log out from other devices by using the logout button.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Data & Privacy Controls */}
              <motion.div variants={fadeInUp}>
                <Card>
                  <CardHeader>
                    <CardTitle>Data & Privacy</CardTitle>
                    <CardDescription>Control how your data is used and stored</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Privacy Settings */}
                      <div className="space-y-4">
                        <div className="flex items-start gap-4">
                          <Checkbox id="analytics" defaultChecked />
                          <div>
                            <label htmlFor="analytics" className="text-sm font-medium text-foreground cursor-pointer">
                              Analytics & Usage Data
                            </label>
                            <p className="text-xs text-muted-foreground mt-1">
                              Help us improve ProjectForge by sending anonymous usage data
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-4">
                          <Checkbox id="marketing" defaultChecked />
                          <div>
                            <label htmlFor="marketing" className="text-sm font-medium text-foreground cursor-pointer">
                              Marketing Communications
                            </label>
                            <p className="text-xs text-muted-foreground mt-1">
                              Receive emails about new features, updates, and special offers
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-4">
                          <Checkbox id="security" defaultChecked disabled />
                          <div>
                            <label
                              htmlFor="security"
                              className="text-sm font-medium text-foreground cursor-not-allowed opacity-60"
                            >
                              Security Alerts (Always Enabled)
                            </label>
                            <p className="text-xs text-muted-foreground mt-1">
                              Receive critical security notifications and alerts
                            </p>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Data Export & Deletion */}
                      <div className="space-y-4">
                        <h4 className="font-semibold text-foreground">Data Management</h4>

                        <div className="bg-secondary/50 rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-foreground">Download Your Data</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Export all your account data in a standard format
                              </p>
                            </div>
                            <Button variant="outline" size="sm">
                              Download
                            </Button>
                          </div>
                        </div>

                        <Alert>
                          <AlertDescription>
                            <span className="font-semibold">Privacy-First:</span> Your data is encrypted and never
                            shared with third parties. We comply with GDPR and CCPA.
                          </AlertDescription>
                        </Alert>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* API Keys */}
              <motion.div variants={fadeInUp}>
                <Card>
                  <CardHeader>
                    <CardTitle>API Keys</CardTitle>
                    <CardDescription>Manage API access for integrations</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="bg-secondary/50 rounded-lg p-4">
                        <p className="text-xs text-muted-foreground mb-2">API Key</p>
                        <div className="flex items-center gap-2">
                          <Input
                            type="password"
                            value="sk_live_************************"
                            readOnly
                            className="font-mono text-xs"
                          />
                          <Button size="icon" variant="outline" onClick={handleCopyApiKey}>
                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Keep this key secret. Regenerate if compromised.
                        </p>
                      </div>

                      <Button variant="outline" className="w-full md:w-auto bg-transparent">
                        Regenerate API Key
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Logout & Danger Zone */}
              <motion.div variants={fadeInUp}>
                <Card className="border-red-200 bg-red-50/50">
                  <CardHeader>
                    <CardTitle className="text-red-700">Logout & Account Actions</CardTitle>
                    <CardDescription>Manage your login sessions and account deletion</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Button variant="destructive" className="w-full" onClick={handleLogout}>
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout from All Devices
                      </Button>

                      <Separator />

                      <div>
                        <h4 className="font-semibold text-red-700 mb-2">Delete Account</h4>
                        <p className="text-sm text-muted-foreground mb-4">
                          Permanently delete your account and all associated data. This action cannot be undone.
                        </p>
                        <Button variant="destructive" className="w-full">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Account Permanently
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
