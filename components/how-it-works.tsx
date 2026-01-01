"use client"

import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"
import { FileText, Send, CheckCircle, Package, ArrowRight } from "lucide-react"
import { glassCardStyle, glowGoldSubtleStyle } from "@/lib/styles"

const steps = [
  {
    number: "01",
    icon: FileText,
    title: "Submit Brief",
    description:
      "Enter your project requirements and MNEE budget. The Project Manager agent analyses your brief, determines budget tier, and decomposes it into categorised micro-tasks.",
    detail:
      "AI-powered decomposition creates 5-12 specialised tasks. Basic tier: text-only outputs. Premium tier: adds up to 3 AI images. Enterprise tier: adds up to 2 AI videos. Higher budgets = richer deliverables.",
  },
  {
    number: "02",
    icon: Send,
    title: "Post Tenders",
    description:
      "The Tender Poster broadcasts tasks to the AI provider network. Each task includes category, required capabilities (text, code, images, financial), and calculated rewards.",
    detail:
      "Capability-aware routing ensures tasks requiring images, code, or multilingual content only go to qualified providers. Budget tier determines model quality — premium models for premium budgets.",
  },
  {
    number: "03",
    icon: CheckCircle,
    title: "Evaluate & Award",
    description:
      "Content Generators produce deliverables. The Evaluator agent scores each submission 0-100, accepts quality work, and triggers instant MNEE payments to provider wallets.",
    detail:
      "Multi-dimensional scoring evaluates completeness, professionalism, relevance, and depth. Rejected submissions don't receive payment.",
  },
  {
    number: "04",
    icon: Package,
    title: "Assemble & Deliver",
    description:
      "The Assembler compiles accepted deliverables into a final package with executive summary. Basic tier: markdown documents. Premium tier: adds AI images. Enterprise tier: adds AI videos.",
    detail:
      "Intelligent synthesis creates markdown documents for all tiers. Premium (3+ MNEE) adds up to 3 AI-generated images. Enterprise (5+ MNEE) adds up to 2 AI-generated videos. Pay more, get more.",
  },
]

export function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0)
  const sectionRef = useRef<HTMLDivElement>(null)
  const scrollLockRef = useRef(false)
  const scrollCountRef = useRef(0)

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (!sectionRef.current) return

      const section = sectionRef.current
      const rect = section.getBoundingClientRect()

      // Check if section is in viewport
      const inView = rect.top <= 100 && rect.bottom >= window.innerHeight / 2

      if (inView && activeStep < steps.length - 1 && !scrollLockRef.current) {
        // Prevent default scroll while we're hijacking
        e.preventDefault()

        if (e.deltaY > 0) {
          // Scrolling down - advance to next step
          scrollCountRef.current++

          // Require 2 scroll events to move to next step (smoother UX)
          if (scrollCountRef.current >= 2) {
            scrollLockRef.current = true
            setActiveStep((prev) => Math.min(prev + 1, steps.length - 1))
            scrollCountRef.current = 0

            // Unlock after animation
            setTimeout(() => {
              scrollLockRef.current = false
            }, 600)
          }
        } else if (e.deltaY < 0 && activeStep > 0) {
          // Scrolling up - go to previous step
          scrollCountRef.current--

          if (scrollCountRef.current <= -2) {
            scrollLockRef.current = true
            setActiveStep((prev) => Math.max(prev - 1, 0))
            scrollCountRef.current = 0

            setTimeout(() => {
              scrollLockRef.current = false
            }, 600)
          }
        }
      }
    }

    // Add listener with passive: false to allow preventDefault
    window.addEventListener("wheel", handleWheel, { passive: false })

    return () => {
      window.removeEventListener("wheel", handleWheel)
    }
  }, [activeStep])

  return (
    <section ref={sectionRef} id="how-it-works" className="relative py-32 px-6 overflow-hidden">
      {/* Background accent */}
      <div
        className="absolute inset-0 opacity-50"
        style={{
          background: `
            radial-gradient(ellipse at 20% 30%, rgba(255, 215, 0, 0.08) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 70%, rgba(255, 165, 0, 0.06) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 50%, rgba(255, 215, 0, 0.03) 0%, transparent 70%)
          `,
        }}
      />

      <div className="relative max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6" style={glassCardStyle}>
            <span className="text-sm font-medium text-primary">Process Flow</span>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            <span
              style={{
                background: "linear-gradient(180deg, #ffffff 0%, #a0a0a0 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              From Brief to
            </span>{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #ffd700 0%, #ffa500 50%, #ffd700 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Delivery
            </span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Watch the complete lifecycle of autonomous task coordination
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Steps list */}
          <div className="space-y-4">
            {steps.map((step, index) => (
              <button
                key={step.number}
                onClick={() => setActiveStep(index)}
                className={cn(
                  "w-full text-left p-6 rounded-2xl transition-all duration-300",
                  activeStep !== index && "hover:bg-muted/30",
                )}
                style={
                  activeStep === index
                    ? { ...glassCardStyle, ...glowGoldSubtleStyle, borderColor: "rgba(255, 215, 0, 0.3)" }
                    : undefined
                }
              >
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300",
                      activeStep === index ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                    )}
                  >
                    <step.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className={cn(
                          "text-sm font-mono",
                          activeStep === index ? "text-primary" : "text-muted-foreground",
                        )}
                      >
                        {step.number}
                      </span>
                      <h3
                        className={cn(
                          "text-lg font-semibold",
                          activeStep === index ? "text-foreground" : "text-muted-foreground",
                        )}
                      >
                        {step.title}
                      </h3>
                    </div>
                    <p
                      className={cn(
                        "text-sm leading-relaxed transition-all duration-300",
                        activeStep === index ? "text-muted-foreground" : "text-muted-foreground/60",
                      )}
                    >
                      {step.description}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Active step detail */}
          <div className="p-10 rounded-3xl" style={glassCardStyle}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                {(() => {
                  const StepIcon = steps[activeStep].icon
                  return <StepIcon className="w-8 h-8 text-primary" />
                })()}
              </div>
              <div>
                <span className="text-sm font-mono text-primary">Step {steps[activeStep].number}</span>
                <h3 className="text-2xl font-bold text-foreground">{steps[activeStep].title}</h3>
              </div>
            </div>

            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">{steps[activeStep].description}</p>

            <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
              <p className="text-sm text-foreground">
                <span className="text-primary font-medium">Key insight:</span> {steps[activeStep].detail}
              </p>
            </div>

            {activeStep < steps.length - 1 && (
              <button
                onClick={() => setActiveStep(activeStep + 1)}
                className="mt-8 flex items-center gap-2 text-primary hover:gap-3 transition-all"
              >
                <span className="text-sm font-medium">Next: {steps[activeStep + 1].title}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
