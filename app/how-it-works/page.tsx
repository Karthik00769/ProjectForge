"use client"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowRight, CheckCircle2, Upload, Shield, Lock, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 },
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
}

export default function HowItWorksPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 w-full bg-background/80 backdrop-blur-md border-b border-border z-50"
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-foreground">
            ProjectForge
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/auth/sign-in" className="text-foreground/70 hover:text-foreground transition font-medium">
              Sign In
            </Link>
            <Link
              href="/auth/sign-up"
              className="px-6 py-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition font-medium"
            >
              Get Started
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight"
            >
              How ProjectForge Works
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-xl text-foreground/70 mb-8 max-w-2xl mx-auto leading-relaxed"
            >
              See a real-world example of how ProjectForge verifies work and builds trust through evidence.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Real Example: Electrician */}
      <section className="py-20 px-6 lg:px-8 bg-secondary/30">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-block mb-4 px-4 py-2 bg-orange-100 rounded-full">
              <span className="text-sm font-semibold text-orange-700 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Real Example: Electrician Job
              </span>
            </div>
            <h2 className="text-4xl font-bold text-foreground mb-4">House Wiring Installation</h2>
            <p className="text-foreground/60 text-lg">Complete electrical work with tamper-proof verification</p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="space-y-6"
          >
            {/* Step 1: Task Creation */}
            <motion.div variants={fadeInUp}>
              <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="grid md:grid-cols-2 gap-8 p-8">
                  <div>
                    <div className="flex items-start gap-4 mb-4">
                      <div className="text-3xl font-bold text-orange-600">01</div>
                      <div>
                        <h3 className="text-2xl font-bold text-foreground mb-2">Task Created</h3>
                        <p className="text-foreground/60">Electrician defines the work scope</p>
                      </div>
                    </div>
                    <div className="bg-secondary/50 rounded-lg p-4 space-y-2">
                      <p className="text-sm">
                        <span className="font-semibold text-foreground">Job Type:</span> Electrician
                      </p>
                      <p className="text-sm">
                        <span className="font-semibold text-foreground">Task Title:</span> House Wiring Installation
                      </p>
                      <p className="text-sm">
                        <span className="font-semibold text-foreground">Description:</span> Completed electrical wiring
                        for a 2BHK house including switches, sockets, and safety checks.
                      </p>
                      <p className="text-sm">
                        <span className="font-semibold text-foreground">Deadline:</span> Jan 25, 2025
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="p-8 rounded-lg bg-orange-50">
                      <CheckCircle2 className="w-16 h-16 text-orange-600" />
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Step 2: Proof Upload */}
            <motion.div variants={fadeInUp}>
              <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="grid md:grid-cols-2 gap-8 p-8">
                  <div>
                    <div className="flex items-start gap-4 mb-4">
                      <div className="text-3xl font-bold text-blue-600">02</div>
                      <div>
                        <h3 className="text-2xl font-bold text-foreground mb-2">Proof Uploaded</h3>
                        <p className="text-foreground/60">Electrician uploads work photos with metadata</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="bg-secondary/50 rounded-lg p-3 flex items-center gap-3">
                        <span className="text-2xl">📸</span>
                        <div>
                          <p className="text-sm font-semibold text-foreground">wiring-installation-01.jpg</p>
                          <p className="text-xs text-foreground/60">2.4 MB • Uploaded 2 hours ago</p>
                        </div>
                      </div>
                      <div className="bg-secondary/50 rounded-lg p-3 flex items-center gap-3">
                        <span className="text-2xl">📸</span>
                        <div>
                          <p className="text-sm font-semibold text-foreground">switchboard-inspection.jpg</p>
                          <p className="text-xs text-foreground/60">1.8 MB • Uploaded 2 hours ago</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="p-8 rounded-lg bg-blue-50">
                      <Upload className="w-16 h-16 text-blue-600" />
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Step 3: Verification */}
            <motion.div variants={fadeInUp}>
              <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="grid md:grid-cols-2 gap-8 p-8">
                  <div>
                    <div className="flex items-start gap-4 mb-4">
                      <div className="text-3xl font-bold text-purple-600">03</div>
                      <div>
                        <h3 className="text-2xl font-bold text-foreground mb-2">Verification Complete</h3>
                        <p className="text-foreground/60">System analyzes files for integrity</p>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-green-700">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>File hash generated</span>
                      </div>
                      <div className="flex items-center gap-2 text-green-700">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Metadata captured</span>
                      </div>
                      <div className="flex items-center gap-2 text-green-700">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Integrity verified</span>
                      </div>
                      <div className="flex items-center gap-2 text-green-700">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>AI analysis passed</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="p-8 rounded-lg bg-purple-50">
                      <Shield className="w-16 h-16 text-purple-600" />
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Step 4: Audit Log */}
            <motion.div variants={fadeInUp}>
              <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="grid md:grid-cols-2 gap-8 p-8">
                  <div>
                    <div className="flex items-start gap-4 mb-4">
                      <div className="text-3xl font-bold text-green-600">04</div>
                      <div>
                        <h3 className="text-2xl font-bold text-foreground mb-2">Audit Log Generated</h3>
                        <p className="text-foreground/60">Permanent, tamper-proof record created</p>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-between gap-2 px-3 py-2 bg-green-50 rounded border border-green-200">
                        <span className="font-medium text-green-700">Task Created</span>
                        <span className="text-green-600">Jan 20 10:30 AM</span>
                      </div>
                      <div className="flex items-between gap-2 px-3 py-2 bg-green-50 rounded border border-green-200">
                        <span className="font-medium text-green-700">Proof Uploaded</span>
                        <span className="text-green-600">Jan 20 02:15 PM</span>
                      </div>
                      <div className="flex items-between gap-2 px-3 py-2 bg-green-50 rounded border border-green-200">
                        <span className="font-medium text-green-700">Verification Verified</span>
                        <span className="text-green-600">Jan 20 02:16 PM</span>
                      </div>
                      <Badge className="bg-green-200 text-green-800 mt-2">Tamper-proof</Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="p-8 rounded-lg bg-green-50">
                      <Lock className="w-16 h-16 text-green-600" />
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Step 5: Outcome */}
            <motion.div variants={fadeInUp}>
              <Card className="overflow-hidden hover:shadow-lg transition-shadow border-2 border-primary">
                <div className="grid md:grid-cols-2 gap-8 p-8">
                  <div>
                    <div className="flex items-start gap-4 mb-4">
                      <div className="text-3xl font-bold text-primary">05</div>
                      <div>
                        <h3 className="text-2xl font-bold text-foreground mb-2">Verified Proof Ready</h3>
                        <p className="text-foreground/60">Electrician can share verified credentials</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-100 text-green-800">Status: VERIFIED</Badge>
                      </div>
                      <div className="bg-secondary/50 rounded-lg p-4">
                        <p className="text-xs font-semibold text-foreground/70 mb-2">Integrity Score</p>
                        <div className="text-3xl font-bold text-primary">98%</div>
                        <p className="text-xs text-foreground/60 mt-2">No tampering detected. Files authentic.</p>
                      </div>
                      <p className="text-sm text-foreground/70">
                        <span className="font-semibold">Share as Proof:</span> Electrician can now share this verified
                        completion to resume, LinkedIn, or share with new clients for trust and credibility.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="p-8 rounded-lg bg-primary/10">
                      <CheckCircle2 className="w-16 h-16 text-primary" />
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Detailed Steps */}
      <section className="py-20 px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-foreground mb-4">The Process Explained</h2>
            <p className="text-foreground/60 text-lg">
              How ProjectForge ensures work authenticity and prevents tampering
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid md:grid-cols-4 gap-6"
          >
            {[
              {
                num: "01",
                title: "Create Your Task",
                description: "Define your project or task with clear objectives, deadlines, and category information.",
              },
              {
                num: "02",
                title: "Upload Your Proof",
                description: "Upload images, documents, videos, or any evidence files that demonstrate your work.",
              },
              {
                num: "03",
                title: "Verify Integrity",
                description: "ProjectForge analyzes your files using advanced cryptographic hashing and AI validation.",
              },
              {
                num: "04",
                title: "Get Audit Records",
                description:
                  "Receive permanent, immutable audit records that prove your work completion with confidence.",
              },
            ].map((step, i) => (
              <motion.div key={i} variants={fadeInUp}>
                <Card className="hover:shadow-lg transition-shadow h-full">
                  <CardHeader>
                    <div className="text-4xl font-bold text-primary mb-2">{step.num}</div>
                    <CardTitle className="text-lg">{step.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-foreground/60">{step.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Key Features */}
      <section className="py-20 px-6 lg:px-8 bg-secondary/30">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-foreground mb-4">Key Features</h2>
            <p className="text-foreground/60 text-lg">Everything you need for transparent work verification</p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-6"
          >
            {[
              { title: "Tamper Detection", desc: "Advanced algorithms detect any unauthorized modifications." },
              { title: "Instant Verification", desc: "Get results in seconds with our AI-powered validation system." },
              { title: "Permanent Records", desc: "Create immutable audit logs that can't be altered or deleted." },
              { title: "Easy Sharing", desc: "Share verification links with employers, clients, or teams instantly." },
              { title: "Privacy-First", desc: "Your data stays encrypted and is never shared with third parties." },
              { title: "Multi-Format Support", desc: "Upload images, PDFs, videos, and documents of all types." },
            ].map((item, i) => (
              <motion.div key={i} variants={fadeInUp}>
                <Card className="hover:shadow-lg transition-shadow h-full">
                  <CardHeader>
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-foreground/60">{item.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="py-20 px-6 lg:px-8 bg-primary text-primary-foreground text-center"
      >
        <div className="max-w-2xl mx-auto">
          <h2 className="text-4xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-lg mb-8 opacity-90">Try ProjectForge now and start verifying your work with confidence.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="secondary"
              size="lg"
              onClick={() => router.push("/dashboard/templates")}
              className="flex items-center gap-2"
            >
              Browse Templates
              <ArrowRight size={18} />
            </Button>
            <Link
              href="/auth/sign-up"
              className="px-8 py-3 bg-primary-foreground text-primary rounded-full hover:bg-primary-foreground/90 transition font-semibold inline-flex items-center justify-center gap-2"
            >
              Get Started Free
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="border-t border-border px-6 lg:px-8 py-12">
        <div className="max-w-7xl mx-auto text-center text-foreground/60 text-sm">
          <p>&copy; 2025 ProjectForge. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
