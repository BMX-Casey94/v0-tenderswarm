"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles } from "lucide-react"
import { useEffect, useRef } from "react"
import Image from "next/image"
import { glassCardStyle, textGradientGoldStyle, glowGoldStyle, gradientMeshStyle } from "@/lib/styles"

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Animated gradient mesh background */}
      <div className="absolute inset-0" style={gradientMeshStyle} />

      {/* Animated orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/4 left-1/5 w-[500px] h-[500px] rounded-full blur-[120px]"
          style={{
            background: "rgba(255, 215, 0, 0.08)",
            animation: "pulse-slow 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
          }}
        />
        <div
          className="absolute bottom-1/4 right-1/5 w-[600px] h-[600px] rounded-full blur-[140px]"
          style={{
            background: "rgba(255, 165, 0, 0.06)",
            animation: "pulse-slow 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
            animationDelay: "2s",
          }}
        />
      </div>

      {/* Particle network visualization */}
      <ParticleNetwork />

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-32 text-center">
        {/* Announcement badge */}
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-[63px]"
          style={{ ...glassCardStyle, animation: "float 6s ease-in-out infinite" }}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
          </span>
          <span className="text-sm font-medium text-foreground">Powered by MNEE — Programmable Money! </span>
        </div>

        {/* Logo */}
        <div className="mb-6 flex justify-center">
          <Image
            src="/images/tenderswam-transparent-hero.png"
            alt="TenderSwarm"
            width={900}
            height={225}
            priority
            className="w-full max-w-4xl h-auto"
          />
        </div>

        {/* Tagline */}
        <h2 className="font-medium text-muted-foreground max-w-3xl mx-auto mb-4 leading-relaxed text-balance text-lg">
          The AI agent marketplace that orchestrates
          <span className="text-foreground"> specialised agent swarms</span>, matches tasks via
          <span className="text-foreground"> budget-aware capability routing</span>, and settles
          <span style={textGradientGoldStyle} className="font-semibold">
            {" "}
            instant on-chain MNEE payments
          </span>
        </h2>

        <p className="text-muted-foreground max-w-2xl mx-auto text-pretty shadow-lg italic text-base px-0 my-[35px] font-normal">
          Watch 7 AI agents collaborate, evaluate quality, and deliver — from brief to final package
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
          <Button
            size="lg"
            className="bg-primary text-primary-foreground hover:bg-primary/90 text-base px-8 py-6 rounded-xl group"
            style={glowGoldStyle}
            onClick={() => document.getElementById("demo")?.scrollIntoView({ behavior: "smooth" })}
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Launch Demo
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 max-w-4xl mx-auto">
          <StatCard value="7+" label="AI Agents" />
          <StatCard value="4" label="Budget Tiers" />
          <StatCard value="10+" label="Task Categories" />
          <StatCard value="3" label="Model Providers" />
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-2">
          <div className="w-1 h-2 bg-primary rounded-full animate-pulse" />
        </div>
      </div>
    </section>
  )
}

function StatCard({ value, label, suffix }: { value: string; label: string; suffix?: string }) {
  return (
    <div className="p-5 rounded-xl text-center transition-all duration-300 hover:-translate-y-1" style={glassCardStyle}>
      <div className="text-3xl md:text-4xl font-bold mb-1" style={textGradientGoldStyle}>
        {value}
        {suffix && <span className="text-xl">{suffix}</span>}
      </div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  )
}

function ParticleNetwork() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationId: number
    let particles: Particle[] = []

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    class Particle {
      x: number
      y: number
      vx: number
      vy: number
      size: number
      color: string

      constructor(canvasWidth: number, canvasHeight: number) {
        this.x = Math.random() * canvasWidth
        this.y = Math.random() * canvasHeight
        this.vx = (Math.random() - 0.5) * 0.3
        this.vy = (Math.random() - 0.5) * 0.3
        this.size = Math.random() * 2 + 1
        this.color = Math.random() > 0.5 ? "rgba(255, 215, 0, 0.6)" : "rgba(255, 165, 0, 0.4)"
      }

      update(canvasWidth: number, canvasHeight: number) {
        this.x += this.vx
        this.y += this.vy

        if (this.x < 0 || this.x > canvasWidth) this.vx *= -1
        if (this.y < 0 || this.y > canvasHeight) this.vy *= -1
      }

      draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fillStyle = this.color
        ctx.fill()
      }
    }

    const init = () => {
      resize()
      particles = []
      const particleCount = Math.min(80, Math.floor((canvas.width * canvas.height) / 15000))
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle(canvas.width, canvas.height))
      }
    }

    const drawConnections = () => {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < 150) {
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            const opacity = (1 - distance / 150) * 0.15
            ctx.strokeStyle = `rgba(255, 215, 0, ${opacity})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particles.forEach((p) => {
        p.update(canvas.width, canvas.height)
        p.draw(ctx)
      })

      drawConnections()
      animationId = requestAnimationFrame(animate)
    }

    init()
    animate()

    window.addEventListener("resize", init)

    return () => {
      window.removeEventListener("resize", init)
      cancelAnimationFrame(animationId)
    }
  }, [])

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none opacity-60" />
}
