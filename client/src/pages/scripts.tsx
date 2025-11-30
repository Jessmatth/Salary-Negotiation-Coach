import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useScriptGenerator, useFeedback } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { scriptInputSchema, type ScriptInput, type ScriptResult } from "@shared/schema";
import { ArrowLeft, TrendingUp, Loader2, Copy, Mail, Check, RefreshCw, MessageSquare, Target, ThumbsUp, ThumbsDown } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const TONE_LABELS = {
  polite: { label: "Polite", description: "Warm, hedging language - best for low leverage" },
  professional: { label: "Professional", description: "Direct but respectful - balanced approach" },
  aggressive: { label: "Assertive", description: "Clear anchoring with deadlines - high leverage" },
} as const;

const LEVERAGE_LABELS = {
  low: { label: "Low", description: "Few alternatives, need this job", color: "text-amber-400" },
  moderate: { label: "Moderate", description: "Some options, flexible timeline", color: "text-blue-400" },
  high: { label: "High", description: "Multiple offers, strong position", color: "text-emerald-400" },
} as const;

const SCENARIO_LABELS = {
  external: "New Job Offer",
  internal_raise: "Internal Raise/Promotion", 
  retention: "Retention/Counter Offer",
} as const;

function getUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const marketMedian = params.get("marketMedian") ? Number(params.get("marketMedian")) : 100000;
  return {
    jobTitle: params.get("jobTitle") || "",
    companyName: params.get("companyName") || "",
    yearsExperience: params.get("yearsExperience") ? Number(params.get("yearsExperience")) : 5,
    location: params.get("location") || "",
    currentOffer: params.get("currentOffer") ? Number(params.get("currentOffer")) : 100000,
    bonusSummary: params.get("bonusSummary") || "",
    marketRangeLow: params.get("marketRangeLow") ? Number(params.get("marketRangeLow")) : Math.round(marketMedian * 0.85),
    marketRangeHigh: params.get("marketRangeHigh") ? Number(params.get("marketRangeHigh")) : Math.round(marketMedian * 1.15),
    marketMedian,
    leverageTier: (params.get("leverageTier") as "low" | "moderate" | "high") || "moderate",
    suggestedRangeMinPercent: params.get("suggestedRangeMinPercent") ? Number(params.get("suggestedRangeMinPercent")) : 5,
    suggestedRangeMaxPercent: params.get("suggestedRangeMaxPercent") ? Number(params.get("suggestedRangeMaxPercent")) : 15,
    scenarioType: (params.get("scenarioType") as "external" | "internal_raise" | "retention") || "external",
    askAmount: undefined as number | undefined,
  };
}

export default function Scripts() {
  const [script, setScript] = useState<ScriptResult | null>(null);
  const [editedBody, setEditedBody] = useState("");
  const [copied, setCopied] = useState(false);
  const [tone, setTone] = useState<"polite" | "professional" | "aggressive">("professional");
  const [leverageTier, setLeverageTier] = useState<"low" | "moderate" | "high">("moderate");
  const [scenarioType, setScenarioType] = useState<"external" | "internal_raise" | "retention">("external");
  const [feedbackGiven, setFeedbackGiven] = useState<boolean | null>(null);
  const scriptGenerator = useScriptGenerator();
  const feedback = useFeedback();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = "/api/login";
    }
  }, [isAuthenticated, isLoading]);

  const handleFeedback = async (isPositive: boolean) => {
    if (!script?.sessionId) return;
    try {
      await feedback.mutateAsync({
        sessionId: script.sessionId,
        feedbackType: "script",
        rating: isPositive ? "up" : "down",
      });
      setFeedbackGiven(isPositive);
    } catch (error) {
      console.error("Failed to submit feedback:", error);
    }
  };

  const form = useForm<Omit<ScriptInput, "tone" | "leverageTier" | "scenarioType">>({
    resolver: zodResolver(scriptInputSchema.omit({ tone: true, leverageTier: true, scenarioType: true })),
    defaultValues: getUrlParams(),
  });

  useEffect(() => {
    const urlParams = getUrlParams();
    if (urlParams.jobTitle) {
      form.reset(urlParams);
      setLeverageTier(urlParams.leverageTier);
      setScenarioType(urlParams.scenarioType);
    }
  }, []);

  const onSubmit = async (data: Omit<ScriptInput, "tone" | "leverageTier" | "scenarioType">) => {
    try {
      const res = await scriptGenerator.mutateAsync({ ...data, tone, leverageTier, scenarioType });
      setScript(res);
      setEditedBody(res.body);
      setFeedbackGiven(null);
    } catch (error) {
      console.error("Failed to generate script:", error);
    }
  };

  const handleToneChange = async (value: number[]) => {
    const tones = ["polite", "professional", "aggressive"] as const;
    const newTone = tones[value[0]];
    setTone(newTone);
    
    if (script) {
      try {
        const formData = form.getValues();
        const res = await scriptGenerator.mutateAsync({ ...formData, tone: newTone, leverageTier, scenarioType });
        setScript(res);
        setEditedBody(res.body);
        setFeedbackGiven(null);
      } catch (error) {
        console.error("Failed to regenerate script:", error);
      }
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(editedBody);
      setCopied(true);
      toast({ title: "Copied to clipboard!" });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({ title: "Failed to copy", variant: "destructive" });
    }
  };

  const openInEmail = async () => {
    const body = encodeURIComponent(editedBody);
    const mailtoLink = `mailto:?body=${body}`;
    
    // Try to open email client
    const link = document.createElement('a');
    link.href = mailtoLink;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Also copy to clipboard as fallback
    try {
      await navigator.clipboard.writeText(editedBody);
      toast({ 
        title: "Script copied!", 
        description: "If email didn't open, paste the script into your email manually."
      });
    } catch {
      toast({ 
        title: "Open your email app", 
        description: "Paste your script into the email body."
      });
    }
  };

  const regenerate = async () => {
    const formData = form.getValues();
    try {
      const res = await scriptGenerator.mutateAsync({ ...formData, tone, leverageTier, scenarioType });
      setScript(res);
      setEditedBody(res.body);
      setFeedbackGiven(null);
    } catch (error) {
      console.error("Failed to regenerate script:", error);
    }
  };

  const formatMoney = (n: number) => `$${n.toLocaleString()}`;

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <header className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-white">Salary Negotiation Coach</span>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <Link href="/" className="inline-flex items-center text-slate-400 hover:text-white mb-6 transition-colors" data-testid="link-back-home">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">What to Say</h1>
            <p className="text-slate-400">Generate a personalized negotiation script</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-cyan-400" />
                  Context
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-slate-200">Scenario Type</Label>
                    <Select value={scenarioType} onValueChange={(v) => setScenarioType(v as typeof scenarioType)}>
                      <SelectTrigger className="bg-slate-900 border-slate-600 text-white" data-testid="select-scenario">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="external">{SCENARIO_LABELS.external}</SelectItem>
                        <SelectItem value="internal_raise">{SCENARIO_LABELS.internal_raise}</SelectItem>
                        <SelectItem value="retention">{SCENARIO_LABELS.retention}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="jobTitle" className="text-slate-200">Job Title</Label>
                      <Input
                        id="jobTitle"
                        {...form.register("jobTitle")}
                        placeholder="e.g., Software Engineer"
                        className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
                        data-testid="input-job-title"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="companyName" className="text-slate-200">Company</Label>
                      <Input
                        id="companyName"
                        {...form.register("companyName")}
                        placeholder="e.g., Acme Corp"
                        className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
                        data-testid="input-company-name"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="yearsExperience" className="text-slate-200">Years Experience</Label>
                      <Input
                        id="yearsExperience"
                        type="number"
                        {...form.register("yearsExperience", { valueAsNumber: true })}
                        className="bg-slate-900 border-slate-600 text-white"
                        data-testid="input-years-experience"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location" className="text-slate-200">Location</Label>
                      <Input
                        id="location"
                        {...form.register("location")}
                        placeholder="e.g., San Francisco"
                        className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
                        data-testid="input-location"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentOffer" className="text-slate-200">Their Offer</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                        <Input
                          id="currentOffer"
                          type="number"
                          {...form.register("currentOffer", { valueAsNumber: true })}
                          className="bg-slate-900 border-slate-600 text-white pl-8"
                          data-testid="input-current-offer"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bonusSummary" className="text-slate-200">Bonus/Equity (optional)</Label>
                      <Input
                        id="bonusSummary"
                        {...form.register("bonusSummary")}
                        placeholder="e.g., 10% bonus, 5k RSUs"
                        className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
                        data-testid="input-bonus-summary"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="marketRangeLow" className="text-slate-200">Market Low</Label>
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                        <Input
                          id="marketRangeLow"
                          type="number"
                          {...form.register("marketRangeLow", { valueAsNumber: true })}
                          className="bg-slate-900 border-slate-600 text-white pl-6 text-sm"
                          data-testid="input-market-low"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="marketMedian" className="text-slate-200">Market Median</Label>
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                        <Input
                          id="marketMedian"
                          type="number"
                          {...form.register("marketMedian", { valueAsNumber: true })}
                          className="bg-slate-900 border-slate-600 text-white pl-6 text-sm"
                          data-testid="input-market-median"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="marketRangeHigh" className="text-slate-200">Market High</Label>
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                        <Input
                          id="marketRangeHigh"
                          type="number"
                          {...form.register("marketRangeHigh", { valueAsNumber: true })}
                          className="bg-slate-900 border-slate-600 text-white pl-6 text-sm"
                          data-testid="input-market-high"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-slate-700">
                    <div className="flex justify-between items-center">
                      <Label className="text-slate-200">Your Leverage</Label>
                      <span className={`font-medium ${LEVERAGE_LABELS[leverageTier].color}`}>
                        {LEVERAGE_LABELS[leverageTier].label}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {(["low", "moderate", "high"] as const).map((tier) => (
                        <Button
                          key={tier}
                          type="button"
                          variant={leverageTier === tier ? "default" : "outline"}
                          size="sm"
                          onClick={() => setLeverageTier(tier)}
                          className={leverageTier === tier 
                            ? "flex-1 bg-slate-700 text-white" 
                            : "flex-1 border-slate-600 text-slate-400 hover:bg-slate-800"}
                          data-testid={`button-leverage-${tier}`}
                        >
                          {LEVERAGE_LABELS[tier].label}
                        </Button>
                      ))}
                    </div>
                    <p className="text-xs text-slate-500">{LEVERAGE_LABELS[leverageTier].description}</p>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-slate-700">
                    <div className="flex justify-between items-center">
                      <Label className="text-slate-200">Tone</Label>
                      <span className="text-emerald-400 font-medium">{TONE_LABELS[tone].label}</span>
                    </div>
                    <Slider
                      value={[["polite", "professional", "aggressive"].indexOf(tone)]}
                      onValueChange={handleToneChange}
                      max={2}
                      step={1}
                      className="w-full"
                      data-testid="slider-tone"
                    />
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Polite</span>
                      <span>Professional</span>
                      <span>Assertive</span>
                    </div>
                    <p className="text-sm text-slate-400">{TONE_LABELS[tone].description}</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="askAmount" className="text-slate-200">Your Ask (optional - auto-calculated if blank)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                      <Input
                        id="askAmount"
                        type="number"
                        {...form.register("askAmount", { 
                          setValueAs: (v) => v === "" || v === null || v === undefined ? undefined : Number(v)
                        })}
                        placeholder="Leave blank for smart calculation"
                        className="bg-slate-900 border-slate-600 text-white pl-8 placeholder:text-slate-500"
                        data-testid="input-ask-amount"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white font-semibold"
                    disabled={scriptGenerator.isPending}
                    data-testid="button-generate"
                  >
                    {scriptGenerator.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      "Generate Script"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">Your Script</CardTitle>
                  {script && (
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={regenerate}
                        disabled={scriptGenerator.isPending}
                        className="text-slate-400 hover:text-white"
                        data-testid="button-regenerate"
                      >
                        <RefreshCw className={`w-4 h-4 ${scriptGenerator.isPending ? "animate-spin" : ""}`} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={copyToClipboard}
                        className="text-slate-400 hover:text-white"
                        data-testid="button-copy"
                      >
                        {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={openInEmail}
                        className="text-slate-400 hover:text-white"
                        data-testid="button-email"
                      >
                        <Mail className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {script ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-900/30 border border-emerald-700/50">
                      <Target className="w-5 h-5 text-emerald-400" />
                      <span className="text-slate-300">Target Ask:</span>
                      <span className="text-emerald-400 font-bold text-lg" data-testid="text-target-amount">
                        {formatMoney(script.targetAmount)}
                      </span>
                    </div>
                    <div>
                      <Label className="text-slate-400 text-sm">Email Body (add your own greeting & sign-off)</Label>
                      <Textarea
                        value={editedBody}
                        onChange={(e) => setEditedBody(e.target.value)}
                        className="mt-1 min-h-[350px] bg-slate-900 border-slate-600 text-white font-mono text-sm"
                        data-testid="textarea-body"
                      />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <span className="px-2 py-1 rounded bg-slate-700">{TONE_LABELS[script.tone].label}</span>
                      <span>{script.contextSummary}</span>
                    </div>

                    <div className="border-t border-slate-700 pt-4 mt-4">
                      <div className="flex items-center justify-center gap-4">
                        <span className="text-slate-400 text-sm">Was this script helpful?</span>
                        {feedbackGiven === null ? (
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleFeedback(true)}
                              disabled={feedback.isPending}
                              className="text-slate-400 hover:text-emerald-400 hover:bg-emerald-400/10"
                              data-testid="button-feedback-positive"
                            >
                              <ThumbsUp className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleFeedback(false)}
                              disabled={feedback.isPending}
                              className="text-slate-400 hover:text-red-400 hover:bg-red-400/10"
                              data-testid="button-feedback-negative"
                            >
                              <ThumbsDown className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <span className={`text-sm ${feedbackGiven ? "text-emerald-400" : "text-red-400"}`} data-testid="text-feedback-thanks">
                            Thanks for your feedback!
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[400px] text-center">
                    <MessageSquare className="w-12 h-12 text-slate-600 mb-4" />
                    <p className="text-slate-500">
                      Fill in the details and click "Generate Script" to create your personalized negotiation email body.
                    </p>
                    <p className="text-slate-600 text-sm mt-2">
                      You'll add your own greeting and sign-off.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
