import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAggregateStats } from "@/lib/api";
import { ArrowRight, BarChart3, MessageSquare, Target, TrendingUp, Shield, Zap } from "lucide-react";

export default function Home() {
  const { data: stats } = useAggregateStats();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <header className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-white">SalaryCoach</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/scorecard" className="text-slate-300 hover:text-white transition-colors" data-testid="link-scorecard-nav">
              Scorecard
            </Link>
            <Link href="/quiz" className="text-slate-300 hover:text-white transition-colors" data-testid="link-quiz-nav">
              Leverage Quiz
            </Link>
            <Link href="/scripts" className="text-slate-300 hover:text-white transition-colors" data-testid="link-scripts-nav">
              Scripts
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-4 py-2 rounded-full text-sm font-medium mb-6" data-testid="badge-data-points">
              <BarChart3 className="w-4 h-4" />
              Based on {stats?.totalRecords?.toLocaleString() || "45,000"}+ real salary data points
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Is This a <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">Good Offer</span>?
            </h1>
            
            <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
              Get instant clarity on your job offer. Compare against real market data, calculate your negotiation leverage, and generate personalized scripts.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/scorecard">
                <Button size="lg" className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-8 py-6 text-lg font-semibold shadow-lg shadow-emerald-500/25" data-testid="button-check-offer">
                  Check My Offer
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/quiz">
                <Button size="lg" variant="outline" className="border-slate-600 text-slate-200 hover:bg-slate-800 px-8 py-6 text-lg" data-testid="button-take-quiz">
                  Take Leverage Quiz
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-16">
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <Card className="bg-slate-800/50 border-slate-700 hover:border-emerald-500/50 transition-colors group">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4 group-hover:bg-emerald-500/20 transition-colors">
                  <Target className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Offer Scorecard</h3>
                <p className="text-slate-400">
                  See exactly where your offer lands compared to {stats?.uniqueRoles?.toLocaleString() || "11,000"}+ roles. Get a clear verdict: underpaid, fair, or above market.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700 hover:border-teal-500/50 transition-colors group">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center mb-4 group-hover:bg-teal-500/20 transition-colors">
                  <Zap className="w-6 h-6 text-teal-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Leverage Calculator</h3>
                <p className="text-slate-400">
                  Answer 8 quick questions to discover your negotiation power. Get a 0-100 score and tailored tactics.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700 hover:border-cyan-500/50 transition-colors group">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-4 group-hover:bg-cyan-500/20 transition-colors">
                  <MessageSquare className="w-6 h-6 text-cyan-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Script Generator</h3>
                <p className="text-slate-400">
                  Generate ready-to-send negotiation emails tuned to your leverage level and preferred tone.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="container mx-auto px-4 py-16">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-4">How It Works</h2>
              <p className="text-slate-400">Three steps to negotiate with confidence</p>
            </div>

            <div className="space-y-8">
              <div className="flex gap-6 items-start">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 text-emerald-400 font-bold">
                  1
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">Enter Your Offer Details</h3>
                  <p className="text-slate-400">Share your job title, location, experience, and the salary they offered. We'll compare it to real market data.</p>
                </div>
              </div>

              <div className="flex gap-6 items-start">
                <div className="w-10 h-10 rounded-full bg-teal-500/20 flex items-center justify-center flex-shrink-0 text-teal-400 font-bold">
                  2
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">Discover Your Leverage</h3>
                  <p className="text-slate-400">Take our 8-question quiz to calculate your negotiation power score. Learn what tactics work best for your situation.</p>
                </div>
              </div>

              <div className="flex gap-6 items-start">
                <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0 text-cyan-400 font-bold">
                  3
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">Send Your Counter</h3>
                  <p className="text-slate-400">Generate a professionally-crafted negotiation email tailored to your specific situation and leverage level.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-16">
          <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-2xl border border-emerald-500/20 p-8 md:p-12 max-w-4xl mx-auto text-center">
            <Shield className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Powered by Real Data
            </h2>
            <p className="text-slate-300 mb-6 max-w-2xl mx-auto">
              Our insights come from {stats?.totalRecords?.toLocaleString() || "45,000"}+ real salary records sourced from government databases (BLS, H1B filings) and verified market data. No guessing—just facts.
            </p>
            <Link href="/scorecard">
              <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100" data-testid="button-get-started">
                Get Started Free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-800 py-8 mt-16">
        <div className="container mx-auto px-4 text-center text-slate-500 text-sm">
          SalaryCoach helps you negotiate with confidence. Data sourced from BLS and H1B databases.
        </div>
      </footer>
    </div>
  );
}
