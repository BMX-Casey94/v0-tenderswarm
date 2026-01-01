"use client"

import { useState, useEffect } from "react"
import { WalletConnect } from "@/components/wallet-connect"
import { cn } from "@/lib/utils"
import { glassStyle } from "@/lib/styles"
import Image from "next/image"

export function Header() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
        scrolled ? "border-b border-border py-3" : "bg-transparent py-5",
      )}
      style={scrolled ? glassStyle : undefined}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image
            src="/images/tenderswam-transparent-hero.png"
            alt="TenderSwarm"
            width={180}
            height={45}
            priority
            className="h-8 w-auto"
          />
        </div>

        <nav className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Features
          </a>
          <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            How it Works
          </a>
          <a href="#demo" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Demo
          </a>
        </nav>

        <WalletConnect />
      </div>
    </header>
  )
}
