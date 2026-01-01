"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Activity, Users, Wallet, TrendingUp } from "lucide-react"
import { glassCardStyle, textGradientGoldStyle } from "@/lib/styles"

export function Dashboard() {
  return (
    <section className="relative py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span style={textGradientGoldStyle}>Real Programmable Money</span> in Action
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Watch autonomous agents coordinate, negotiate, and transact—all powered by MNEE tokens
          </p>
        </div>

        <Tabs defaultValue="swarm" className="w-full">
          <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-4 mb-8">
            <TabsTrigger value="swarm">
              <Users className="w-4 h-4 mr-2" />
              Swarm
            </TabsTrigger>
            <TabsTrigger value="tenders">
              <Activity className="w-4 h-4 mr-2" />
              Tenders
            </TabsTrigger>
            <TabsTrigger value="payments">
              <Wallet className="w-4 h-4 mr-2" />
              Payments
            </TabsTrigger>
            <TabsTrigger value="metrics">
              <TrendingUp className="w-4 h-4 mr-2" />
              Metrics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="swarm" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6" style={glassCardStyle}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">Agent Activity</h3>
                    <p className="text-sm text-muted-foreground">Live coordination feed</p>
                  </div>
                  <Badge className="bg-primary/20 text-primary border-primary/30">Active</Badge>
                </div>
                <div className="space-y-3">
                  <AgentMessage agent="Project Manager" message="Breaking down client brief into 18 micro-tasks..." />
                  <AgentMessage agent="Tender Poster" message="Posting tenders on-chain via TenderEscrow contract..." />
                  <AgentMessage agent="Evaluator" message="Reviewing 47 submissions from provider network..." />
                </div>
              </Card>

              <Card className="p-6" style={glassCardStyle}>
                <h3 className="text-xl font-semibold text-foreground mb-4">Provider Network</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Providers Online</span>
                    <span className="text-2xl font-bold text-primary">61</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Active Bids</span>
                    <span className="text-2xl font-bold text-foreground">47</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Avg Response Time</span>
                    <span className="text-2xl font-bold text-secondary">23s</span>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="tenders">
            <Card className="p-6" style={glassCardStyle}>
              <h3 className="text-xl font-semibold text-foreground mb-4">Recent Tenders</h3>
              <p className="text-muted-foreground">Tender board will appear here when swarm is active</p>
            </Card>
          </TabsContent>

          <TabsContent value="payments">
            <Card className="p-6" style={glassCardStyle}>
              <h3 className="text-xl font-semibold text-foreground mb-4">Live Payment Feed</h3>
              <p className="text-muted-foreground">MNEE transactions will stream here in real-time</p>
            </Card>
          </TabsContent>

          <TabsContent value="metrics">
            <Card className="p-6" style={glassCardStyle}>
              <h3 className="text-xl font-semibold text-foreground mb-4">Economic Metrics</h3>
              <div className="grid md:grid-cols-3 gap-6">
                <MetricCard title="Total Spent" value="187.4 MNEE" change="+12%" />
                <MetricCard title="Providers Paid" value="19" change="+5" />
                <MetricCard title="Avg Task Cost" value="9.8 MNEE" change="-3%" />
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  )
}

function AgentMessage({ agent, message }: { agent: string; message: string }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border">
      <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-foreground">{agent}</div>
        <div className="text-sm text-muted-foreground">{message}</div>
      </div>
    </div>
  )
}

function MetricCard({ title, value, change }: { title: string; value: string; change: string }) {
  return (
    <div className="p-4 rounded-lg bg-muted/30 border border-border">
      <div className="text-sm text-muted-foreground mb-2">{title}</div>
      <div className="text-2xl font-bold text-foreground mb-1">{value}</div>
      <div className="text-sm text-primary">{change}</div>
    </div>
  )
}
