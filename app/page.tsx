import { Hero } from "@/components/hero"
import { LiveDashboard } from "@/components/live-dashboard"
import { Header } from "@/components/header"
import { Features } from "@/components/features"
import { HowItWorks } from "@/components/how-it-works"

export default function Home() {
  return (
    <main className="min-h-screen bg-background noise-overlay">
      <Header />
      <Hero />
      <Features />
      <HowItWorks />
      <LiveDashboard />
    </main>
  )
}
