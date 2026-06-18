"use client"
import Link from "next/link"
import { motion } from "framer-motion"
import { CheckCircle2, Lock, BarChart3, Users, Shield, ArrowRight } from "lucide-react"

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

export default function Home() {
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
          <div className="hidden md:flex gap-8">
            <a href="#how" className="text-foreground/70 hover:text-foreground transition">
              How it works
            </a>
            <a href="#why" className="text-foreground/70 hover:text-foreground transition">
              Why ProjectForge
            </a>
            <a href="#security" className="text-foreground/70 hover:text-foreground transition">
              Security
            </a>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/auth/sign-in"
              className="text-foreground/70 hover:text-foreground transition font-medium mr-2"
            >
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
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="inline-block mb-6 px-4 py-2 bg-secondary border border-border rounded-full"
            >
              <span className="text-sm text-foreground/70">Verifiable Proof of Work</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight"
            >
              Trust Through Evidence
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-xl text-foreground/70 mb-8 max-w-2xl mx-auto leading-relaxed"
            >
              No fake progress. Create custom tasks and steps, upload evidence, and use AI verification with
              confidence scores to maintain permanent, auditable records and accountable progress.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link
                href="/auth/sign-up"
                className="px-8 py-3 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition font-semibold flex items-center justify-center gap-2"
              >
                Get Started
                <ArrowRight size={18} />
              </Link>
              <Link
                href="/how-it-works"
                className="px-8 py-3 border border-border text-foreground hover:bg-secondary transition font-semibold rounded-full"
              >
                See How It Works
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how" className="py-20 px-6 lg:px-8 bg-secondary/30">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-foreground mb-4">How ProjectForge Works</h2>
            <p className="text-foreground/60 text-lg">A four-step process to establish trust and accountability</p>
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
                title: "Create Goals & Tasks",
                desc: "Create goals, generate tasks with AI, or build fully custom tasks and steps.",
              },
              {
                num: "02",
                title: "Upload Evidence",
                desc: "Submit screenshots, documents, PDFs, images, links, and other proof of completion.",
              },
              {
                num: "03",
                title: "AI Verification",
                desc: "AI analyzes uploaded evidence, generates summaries, and assigns confidence scores.",
              },
              {
                num: "04",
                title: "Accountability Record",
                desc: "Track verified progress, review evidence history, and maintain an auditable record of work.",
              },
            ].map((step, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                className="bg-card border border-border rounded-lg p-6 text-center hover:shadow-lg transition"
              >
                <div className="text-4xl font-bold text-primary mb-4">{step.num}</div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{step.title}</h3>
                <p className="text-foreground/60">{step.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Why ProjectForge Section */}
      <section id="why" className="py-20 px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-foreground mb-4">Why ProjectForge</h2>
            <p className="text-foreground/60 text-lg">Built for accountability and transparency</p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 gap-8"
          >
            {[
              {
                icon: CheckCircle2,
                title: "No Fake Progress",
                desc: "Real evidence, AI-assisted verification, and clear accountability",
              },
              {
                icon: Shield,
                title: "Tamper Detection",
                desc: "Advanced algorithms detect unauthorized modifications and validate file integrity",
              },
              {
                icon: BarChart3,
                title: "Evidence-Based Tracking",
                desc: "Track work with concrete proof, AI summaries, and confidence scoring",
              },
              {
                icon: Lock,
                title: "Secure & Transparent",
                desc: "Privacy-first design with support for custom workflows and human review",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                className="bg-card border border-border rounded-lg p-8 hover:shadow-lg transition"
              >
                <item.icon className="w-12 h-12 text-primary mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-foreground/60">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Who It's For Section */}
      <section className="py-20 px-6 lg:px-8 bg-secondary/30">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-foreground mb-4">Built for Everyone</h2>
            <p className="text-foreground/60 text-lg">Trusted by professionals across industries</p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-6"
          >
            {[
              { icon: Users, title: "Skilled Workers", desc: "Showcase your work with verifiable proof" },
              { icon: BarChart3, title: "Businesses", desc: "Monitor team progress with evidence" },
              { icon: CheckCircle2, title: "Freelancers", desc: "Build trust with clients instantly" },
              {
                icon: Shield,
                title: "Professionals",
                desc: "Document achievements and goal execution with evidence-backed, accountable progress",
              },
              {
                icon: Lock,
                title: "Students",
                desc: "Verify learning and goal execution with evidence-backed progress and accountability",
              },
              { icon: Users, title: "Enterprises", desc: "Enterprise-grade work verification" },
            ].map((item, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                className="bg-card border border-border rounded-lg p-6 text-center hover:shadow-lg transition"
              >
                <item.icon className="w-10 h-10 text-primary mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-foreground/60 text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Trust & Security Section */}
      <section id="security" className="py-20 px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-foreground mb-4">Security & Trust</h2>
            <p className="text-foreground/60 text-lg">Your data, protected at every level</p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-8"
          >
            {[
              {
                title: "Audit Logs",
                desc: "Complete history of all actions and changes, including AI verification summaries and confidence scores. AI-generated verification is designed to assist users, while final decisions remain under human control.",
                icon: BarChart3,
              },
              {
                title: "File Integrity Checks",
                desc: "Cryptographic verification of all uploads, with tamper detection and validation",
                icon: Shield,
              },
              {
                title: "Privacy-First Design",
                desc: "Your data stays yours with zero tracking; supports human review and custom verification workflows",
                icon: Lock,
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                className="bg-linear-to-br from-card to-secondary/50 border border-border rounded-lg p-8 text-center hover:shadow-lg transition"
              >
                <item.icon className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-foreground/60">{item.desc}</p>
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
          <h2 className="text-4xl font-bold mb-6">Ready to Verify Your Work?</h2>
          <p className="text-lg mb-8 opacity-90">
            Join thousands of professionals who trust ProjectForge for transparent work verification.
          </p>
          <Link
            href="/auth/sign-up"
            className="inline-block px-8 py-3 bg-primary-foreground text-primary rounded-full hover:bg-primary-foreground/90 transition font-semibold"
          >
            Get Started Free
          </Link>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="border-t border-border px-6 lg:px-8 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-semibold text-foreground mb-4">ProjectForge</h3>
              <p className="text-foreground/60 text-sm">Verifiable proof of work platform.</p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-foreground/60">
                <li>
                  <a href="#how" className="hover:text-foreground transition">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#security" className="hover:text-foreground transition">
                    Security
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 text-center text-foreground/60 text-sm">
            <p>&copy; 2025 ProjectForge. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
