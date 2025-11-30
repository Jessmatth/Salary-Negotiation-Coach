import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useScorecard } from "@/lib/api";
import { scorecardInputSchema, type ScorecardInput, type ScorecardResult } from "@shared/schema";
import { ArrowLeft, ArrowRight, TrendingUp, Loader2 } from "lucide-react";

const SENIORITY_LEVELS = [
  { value: "Junior", label: "Junior / Entry Level" },
  { value: "Mid", label: "Mid-Level" },
  { value: "Senior", label: "Senior" },
  { value: "Lead", label: "Lead / Staff" },
  { value: "Director", label: "Director" },
  { value: "VP", label: "VP" },
  { value: "C-Suite", label: "C-Suite / Executive" },
] as const;

export default function Scorecard() {
  const [, navigate] = useLocation();
  const [result, setResult] = useState<ScorecardResult | null>(null);
  const scorecard = useScorecard();

  const form = useForm<ScorecardInput>({
    resolver: zodResolver(scorecardInputSchema),
    defaultValues: {
      jobTitle: "",
      companyName: "",
      yearsExperience: 5,
      seniorityLevel: "Mid",
      location: "",
      isRemote: false,
      baseSalaryOffered: 100000,
      bonusPercent: undefined,
      equityDetails: "",
    },
  });

  const onSubmit = async (data: ScorecardInput) => {
    try {
      const res = await scorecard.mutateAsync(data);
      setResult(res);
    } catch (error) {
      console.error("Failed to calculate scorecard:", error);
    }
  };

  if (result) {
    return <ScorecardResult result={result} onBack={() => setResult(null)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <header className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-white">SalaryCoach</span>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <Link href="/" className="inline-flex items-center text-slate-400 hover:text-white mb-6 transition-colors" data-testid="link-back-home">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Offer Scorecard</h1>
            <p className="text-slate-400">Enter your offer details to see how it compares to the market</p>
          </div>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Your Offer Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="jobTitle" className="text-slate-200">Job Title *</Label>
                    <Input
                      id="jobTitle"
                      {...form.register("jobTitle")}
                      placeholder="e.g., Software Engineer"
                      className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
                      data-testid="input-job-title"
                    />
                    {form.formState.errors.jobTitle && (
                      <p className="text-red-400 text-sm">{form.formState.errors.jobTitle.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyName" className="text-slate-200">Company Name</Label>
                    <Input
                      id="companyName"
                      {...form.register("companyName")}
                      placeholder="e.g., Acme Corp"
                      className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
                      data-testid="input-company-name"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="yearsExperience" className="text-slate-200">Years of Experience *</Label>
                    <Input
                      id="yearsExperience"
                      type="number"
                      {...form.register("yearsExperience", { valueAsNumber: true })}
                      min={0}
                      max={40}
                      className="bg-slate-900 border-slate-600 text-white"
                      data-testid="input-years-experience"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-200">Seniority Level *</Label>
                    <Select
                      value={form.watch("seniorityLevel")}
                      onValueChange={(v) => form.setValue("seniorityLevel", v as any)}
                    >
                      <SelectTrigger className="bg-slate-900 border-slate-600 text-white" data-testid="select-seniority">
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        {SENIORITY_LEVELS.map((level) => (
                          <SelectItem key={level.value} value={level.value} className="text-white hover:bg-slate-700">
                            {level.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="location" className="text-slate-200">Location *</Label>
                    <Input
                      id="location"
                      {...form.register("location")}
                      placeholder="e.g., San Francisco, CA"
                      className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
                      data-testid="input-location"
                    />
                    {form.formState.errors.location && (
                      <p className="text-red-400 text-sm">{form.formState.errors.location.message}</p>
                    )}
                  </div>

                  <div className="space-y-2 flex items-end">
                    <div className="flex items-center justify-between w-full bg-slate-900 border border-slate-600 rounded-md px-4 py-2">
                      <Label htmlFor="isRemote" className="text-slate-200 cursor-pointer">Remote Position</Label>
                      <Switch
                        id="isRemote"
                        checked={form.watch("isRemote")}
                        onCheckedChange={(v) => form.setValue("isRemote", v)}
                        data-testid="switch-remote"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-700 pt-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Compensation</h3>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="baseSalaryOffered" className="text-slate-200">Base Salary Offered *</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                        <Input
                          id="baseSalaryOffered"
                          type="number"
                          {...form.register("baseSalaryOffered", { valueAsNumber: true })}
                          min={20000}
                          max={2000000}
                          className="bg-slate-900 border-slate-600 text-white pl-8"
                          data-testid="input-salary"
                        />
                      </div>
                      {form.formState.errors.baseSalaryOffered && (
                        <p className="text-red-400 text-sm">{form.formState.errors.baseSalaryOffered.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bonusPercent" className="text-slate-200">Annual Bonus %</Label>
                      <div className="relative">
                        <Input
                          id="bonusPercent"
                          type="number"
                          {...form.register("bonusPercent", { valueAsNumber: true })}
                          min={0}
                          max={100}
                          placeholder="e.g., 15"
                          className="bg-slate-900 border-slate-600 text-white pr-8 placeholder:text-slate-500"
                          data-testid="input-bonus"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">%</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 mt-4">
                    <Label htmlFor="equityDetails" className="text-slate-200">Equity/Stock Details</Label>
                    <Input
                      id="equityDetails"
                      {...form.register("equityDetails")}
                      placeholder="e.g., 10,000 RSUs over 4 years"
                      className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
                      data-testid="input-equity"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold"
                  disabled={scorecard.isPending}
                  data-testid="button-analyze-offer"
                >
                  {scorecard.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      Analyze My Offer
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

function ScorecardResult({ result, onBack }: { result: ScorecardResult; onBack: () => void }) {
  const [, navigate] = useLocation();

  const getZoneColor = (zone: string) => {
    switch (zone) {
      case "very_underpaid": return "text-red-400";
      case "underpaid": return "text-orange-400";
      case "fair": return "text-yellow-400";
      case "above_market": return "text-emerald-400";
      case "well_above_market": return "text-teal-400";
      default: return "text-slate-400";
    }
  };

  const getZoneLabel = (zone: string) => {
    switch (zone) {
      case "very_underpaid": return "Significantly Below Market";
      case "underpaid": return "Below Market";
      case "fair": return "Fair Market Rate";
      case "above_market": return "Above Market";
      case "well_above_market": return "Well Above Market";
      default: return "Unknown";
    }
  };

  const getGaugeRotation = (percentile: number) => {
    return (percentile / 100) * 180 - 90;
  };

  const formatMoney = (n: number) => `$${n.toLocaleString()}`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <header className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-white">SalaryCoach</span>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <button onClick={onBack} className="inline-flex items-center text-slate-400 hover:text-white mb-6 transition-colors" data-testid="button-back">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Adjust Details
          </button>

          <Card className="bg-slate-800/50 border-slate-700 mb-6">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <div className="relative w-48 h-24 mx-auto mb-4">
                  <svg viewBox="0 0 200 100" className="w-full h-full">
                    <path
                      d="M 10 90 A 80 80 0 0 1 190 90"
                      fill="none"
                      stroke="#334155"
                      strokeWidth="12"
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#ef4444" />
                        <stop offset="25%" stopColor="#f97316" />
                        <stop offset="50%" stopColor="#eab308" />
                        <stop offset="75%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#14b8a6" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 10 90 A 80 80 0 0 1 190 90"
                      fill="none"
                      stroke="url(#gaugeGradient)"
                      strokeWidth="12"
                      strokeLinecap="round"
                      strokeDasharray={`${(result.position.percentile / 100) * 251.2} 251.2`}
                    />
                    <circle
                      cx="100"
                      cy="90"
                      r="8"
                      fill="white"
                      style={{
                        transform: `rotate(${getGaugeRotation(result.position.percentile)}deg)`,
                        transformOrigin: "100px 90px",
                      }}
                    >
                      <animateTransform
                        attributeName="transform"
                        type="rotate"
                        from="-90 100 90"
                        to={`${getGaugeRotation(result.position.percentile)} 100 90`}
                        dur="1s"
                        fill="freeze"
                      />
                    </circle>
                  </svg>
                </div>
                
                <div className="text-5xl font-bold text-white mb-2" data-testid="text-percentile">
                  {result.position.percentile}th
                </div>
                <div className="text-lg text-slate-400 mb-2">percentile</div>
                <div className={`text-xl font-semibold ${getZoneColor(result.position.zone)}`} data-testid="text-zone">
                  {getZoneLabel(result.position.zone)}
                </div>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-4 mb-6">
                <p className="text-slate-300 text-center" data-testid="text-narrative">{result.narrative}</p>
              </div>

              <div className="grid grid-cols-5 gap-2 text-center text-sm mb-4">
                <div>
                  <div className="text-slate-500 mb-1">P10</div>
                  <div className="text-white font-medium">{formatMoney(result.marketRange.min)}</div>
                </div>
                <div>
                  <div className="text-slate-500 mb-1">P25</div>
                  <div className="text-white font-medium">{formatMoney(result.marketRange.p25)}</div>
                </div>
                <div>
                  <div className="text-emerald-400 mb-1">Median</div>
                  <div className="text-white font-medium">{formatMoney(result.marketRange.median)}</div>
                </div>
                <div>
                  <div className="text-slate-500 mb-1">P75</div>
                  <div className="text-white font-medium">{formatMoney(result.marketRange.p75)}</div>
                </div>
                <div>
                  <div className="text-slate-500 mb-1">P90</div>
                  <div className="text-white font-medium">{formatMoney(result.marketRange.max)}</div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-4 text-sm text-slate-400 mb-8">
                <span>Your offer: <span className="text-white font-medium">{formatMoney(result.input.baseSalaryOffered)}</span></span>
                <span className="text-slate-600">|</span>
                <span>
                  Difference: <span className={result.position.difference >= 0 ? "text-emerald-400" : "text-red-400"}>
                    {result.position.difference >= 0 ? "+" : ""}{formatMoney(result.position.difference)} ({result.position.differencePercent}%)
                  </span>
                </span>
              </div>

              <div className="text-center text-slate-500 text-sm mb-6">
                Based on {result.sampleSize.toLocaleString()} comparable records ({Math.round(result.confidence * 100)}% confidence)
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={() => navigate("/quiz")}
              size="lg"
              className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold"
              data-testid="button-take-quiz"
            >
              Calculate My Leverage
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              onClick={() => navigate("/scripts")}
              size="lg"
              variant="outline"
              className="flex-1 border-slate-600 text-slate-200 hover:bg-slate-800"
              data-testid="button-generate-script"
            >
              Generate Negotiation Script
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
