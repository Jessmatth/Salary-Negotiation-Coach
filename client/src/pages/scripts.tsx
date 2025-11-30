import { useState } from "react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { useScriptGenerator } from "@/lib/api";
import { scriptInputSchema, type ScriptInput, type ScriptResult } from "@shared/schema";
import { ArrowLeft, TrendingUp, Loader2, Copy, Mail, Check, RefreshCw, MessageSquare } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const TONE_LABELS = {
  polite: { label: "Polite", description: "Warm and appreciative tone" },
  professional: { label: "Professional", description: "Balanced and confident" },
  aggressive: { label: "Assertive", description: "Direct and firm" },
} as const;

export default function Scripts() {
  const [script, setScript] = useState<ScriptResult | null>(null);
  const [editedBody, setEditedBody] = useState("");
  const [copied, setCopied] = useState(false);
  const [tone, setTone] = useState<"polite" | "professional" | "aggressive">("professional");
  const scriptGenerator = useScriptGenerator();

  const form = useForm<Omit<ScriptInput, "tone">>({
    resolver: zodResolver(scriptInputSchema.omit({ tone: true })),
    defaultValues: {
      jobTitle: "",
      companyName: "",
      yearsExperience: 5,
      location: "",
      currentOffer: 100000,
      marketMedian: 120000,
      askAmount: undefined,
    },
  });

  const onSubmit = async (data: Omit<ScriptInput, "tone">) => {
    try {
      const res = await scriptGenerator.mutateAsync({ ...data, tone });
      setScript(res);
      setEditedBody(res.body);
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
        const res = await scriptGenerator.mutateAsync({ ...formData, tone: newTone });
        setScript(res);
        setEditedBody(res.body);
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

  const openInEmail = () => {
    const subject = encodeURIComponent(script?.subject || "Regarding my offer");
    const body = encodeURIComponent(editedBody);
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
  };

  const regenerate = async () => {
    const formData = form.getValues();
    try {
      const res = await scriptGenerator.mutateAsync({ ...formData, tone });
      setScript(res);
      setEditedBody(res.body);
    } catch (error) {
      console.error("Failed to regenerate script:", error);
    }
  };

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
            <p className="text-slate-400">Generate a personalized negotiation email</p>
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
                      <Label htmlFor="marketMedian" className="text-slate-200">Market Median</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                        <Input
                          id="marketMedian"
                          type="number"
                          {...form.register("marketMedian", { valueAsNumber: true })}
                          className="bg-slate-900 border-slate-600 text-white pl-8"
                          data-testid="input-market-median"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="askAmount" className="text-slate-200">Your Ask (optional)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                      <Input
                        id="askAmount"
                        type="number"
                        {...form.register("askAmount", { valueAsNumber: true })}
                        placeholder="Leave blank for auto-calculation"
                        className="bg-slate-900 border-slate-600 text-white pl-8 placeholder:text-slate-500"
                        data-testid="input-ask-amount"
                      />
                    </div>
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
                    <div>
                      <Label className="text-slate-400 text-sm">Subject</Label>
                      <div className="text-white font-medium mt-1" data-testid="text-subject">{script.subject}</div>
                    </div>
                    <div>
                      <Label className="text-slate-400 text-sm">Email Body</Label>
                      <Textarea
                        value={editedBody}
                        onChange={(e) => setEditedBody(e.target.value)}
                        className="mt-1 min-h-[350px] bg-slate-900 border-slate-600 text-white font-mono text-sm"
                        data-testid="textarea-body"
                      />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <span className="px-2 py-1 rounded bg-slate-700">{script.tone}</span>
                      <span>{script.contextSummary}</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[400px] text-center">
                    <MessageSquare className="w-12 h-12 text-slate-600 mb-4" />
                    <p className="text-slate-500">
                      Fill in the details on the left and click "Generate Script" to create your personalized negotiation email.
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
