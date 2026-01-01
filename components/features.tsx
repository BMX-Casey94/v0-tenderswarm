"use client"

import { Card } from "@/components/ui/card"
import { glassCardStyle } from "@/lib/styles"
import Image from "next/image"

const features = [
  {
    icon: "/images/3dicons-link-dynamic-premium.png",
    title: "AI Agent Swarm",
    description:
      "7 specialised agents work collaboratively — Coordinator, Project Manager, Tender Poster, Content Generators, Evaluator, and Assembler.",
  },
  {
    icon: "/images/3dicons-clock-dynamic-premium.png",
    title: "Instant Settlements",
    description:
      "MNEE stablecoin enables real-time payments on Ethereum Mainnet. Automatic refunds, proportional distribution, no delays.",
  },
  {
    icon: "/images/3dicons-wallet-iso-premium.png",
    title: "Budget-Tiered Routing",
    description:
      "Higher budgets unlock premium AI models and richer deliverables. Basic tier gets 3-5 text outputs, Premium adds AI images, Enterprise includes more images, and occassionally video.",
  },
  {
    icon: "/images/3dicons-shield-dynamic-color.png",
    title: "Quality Evaluation",
    description:
      "AI Evaluator scores deliverables 0-100 on completeness, professionalism, relevance, and depth. Only quality work gets paid.",
  },
  {
    icon: "/images/3dicons-zoom-dynamic-premium.png",
    title: "Real-Time Visibility",
    description:
      "Watch agent activity, task progress, payment streams, and network coordination in real-time. Complete transparency from brief to delivery.",
  },
  {
    icon: "/images/3dicons-dollar-iso-premium.png",
    title: "Programmable Money",
    description:
      "MNEE on Ethereum Mainnet enables conditional payments, automatic splits, platform fees, and refunds at blockchain speed.",
  },
]

export function Features() {
  return (
    <section id="features" className="relative py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6" style={glassCardStyle}>
            <span className="text-sm font-medium text-primary">Core Capabilities</span>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-balance">
            <span
              style={{
                background: "linear-gradient(180deg, #ffffff 0%, #a0a0a0 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Built for the{" "}
            </span>
            <span
              style={{
                background: "linear-gradient(135deg, #ffd700 0%, #ffa500 50%, #ffd700 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Agent Economy
            </span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-pretty text-lg">
            TenderSwarm demonstrates what becomes possible when AI agents can coordinate autonomously with programmable
            money.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div key={feature.title} className="flip-card h-[280px]" style={{ perspective: "1000px" }}>
              <div
                className="flip-card-inner relative w-full h-full transition-transform duration-700"
                style={{ transformStyle: "preserve-3d" }}
              >
                <Card
                  className="flip-card-front absolute w-full h-full rounded-2xl flex flex-col items-center justify-center text-center p-8 opacity-100 bg-popover"
                  style={{
                    ...glassCardStyle,
                    backfaceVisibility: "hidden",
                  }}
                >
                  <div className="w-24 h-24 mb-4 relative">
                    <Image
                      src={feature.icon || "/placeholder.svg"}
                      alt={feature.title}
                      fill
                      className="object-contain"
                    />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">{feature.title}</h3>
                </Card>
                <Card
                  className="flip-card-back absolute w-full h-full rounded-2xl flex flex-col items-center justify-center text-center p-8 opacity-100 bg-popover"
                  style={{
                    ...glassCardStyle,
                    backfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                  }}
                >
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </Card>
              </div>
            </div>
          ))}
        </div>
      </div>
      <style jsx>{`
        .flip-card:hover .flip-card-inner {
          transform: rotateY(180deg);
        }
      `}</style>
    </section>
  )
}
