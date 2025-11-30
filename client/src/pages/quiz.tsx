import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useLeverageScore } from "@/lib/api";
import { LEVERAGE_QUESTIONS, type LeverageQuizInput, type LeverageResult } from "@shared/schema";
import { ArrowLeft, ArrowRight, TrendingUp, Loader2, Zap, AlertTriangle, CheckCircle, Target } from "lucide-react";

type QuestionId = keyof LeverageQuizInput;

export default function Quiz() {
  const [, navigate] = useLocation();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Partial<LeverageQuizInput>>({});
  const [result, setResult] = useState<LeverageResult | null>(null);
  const leverageScore = useLeverageScore();

  const question = LEVERAGE_QUESTIONS[currentQuestion];
  const progress = ((currentQuestion + 1) / LEVERAGE_QUESTIONS.length) * 100;

  const handleAnswer = async (value: string) => {
    const newAnswers = {
      ...answers,
      [question.id]: value,
    };
    setAnswers(newAnswers);

    if (currentQuestion < LEVERAGE_QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      try {
        const res = await leverageScore.mutateAsync(newAnswers as LeverageQuizInput);
        setResult(res);
      } catch (error) {
        console.error("Failed to calculate leverage:", error);
      }
    }
  };

  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  if (result) {
    return <QuizResult result={result} onRestart={() => { setResult(null); setCurrentQuestion(0); setAnswers({}); }} />;
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
            <h1 className="text-3xl font-bold text-white mb-2">Leverage Quiz</h1>
            <p className="text-slate-400">Answer 8 questions to discover your negotiation power</p>
          </div>

          <div className="mb-8">
            <div className="flex justify-between text-sm text-slate-400 mb-2">
              <span>Question {currentQuestion + 1} of {LEVERAGE_QUESTIONS.length}</span>
              <span>{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} className="h-2 bg-slate-700" />
          </div>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-8">
              <h2 className="text-xl font-semibold text-white mb-6 text-center" data-testid="text-question">
                {question.question}
              </h2>

              <div className="space-y-3">
                {question.options.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleAnswer(option.value)}
                    disabled={leverageScore.isPending}
                    className={`w-full p-4 rounded-lg border text-left transition-all ${
                      answers[question.id as QuestionId] === option.value
                        ? "bg-emerald-500/20 border-emerald-500 text-white"
                        : "bg-slate-900/50 border-slate-600 text-slate-300 hover:border-slate-500 hover:bg-slate-800"
                    }`}
                    data-testid={`option-${option.value}`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              {currentQuestion > 0 && (
                <Button
                  variant="ghost"
                  onClick={handleBack}
                  className="mt-6 text-slate-400 hover:text-white"
                  disabled={leverageScore.isPending}
                  data-testid="button-back"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous Question
                </Button>
              )}

              {leverageScore.isPending && (
                <div className="flex items-center justify-center mt-6 text-slate-400">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Calculating your leverage...
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

function QuizResult({ result, onRestart }: { result: LeverageResult; onRestart: () => void }) {
  const [, navigate] = useLocation();

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "low": return "text-orange-400";
      case "moderate": return "text-yellow-400";
      case "high": return "text-emerald-400";
      default: return "text-slate-400";
    }
  };

  const getTierBgColor = (tier: string) => {
    switch (tier) {
      case "low": return "bg-orange-500/10 border-orange-500/30";
      case "moderate": return "bg-yellow-500/10 border-yellow-500/30";
      case "high": return "bg-emerald-500/10 border-emerald-500/30";
      default: return "bg-slate-500/10 border-slate-500/30";
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case "low": return <AlertTriangle className="w-6 h-6" />;
      case "moderate": return <Target className="w-6 h-6" />;
      case "high": return <Zap className="w-6 h-6" />;
      default: return <Target className="w-6 h-6" />;
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
            <span className="font-bold text-xl text-white">SalaryCoach</span>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <button onClick={onRestart} className="inline-flex items-center text-slate-400 hover:text-white mb-6 transition-colors" data-testid="button-retake">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retake Quiz
          </button>

          <Card className={`border mb-6 ${getTierBgColor(result.tier)}`}>
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${getTierBgColor(result.tier)} ${getTierColor(result.tier)}`}>
                  {getTierIcon(result.tier)}
                </div>
                
                <div className="text-6xl font-bold text-white mb-2" data-testid="text-score">
                  {result.score}
                </div>
                <div className="text-lg text-slate-400 mb-2">out of 100</div>
                <div className={`text-2xl font-semibold ${getTierColor(result.tier)}`} data-testid="text-tier">
                  {result.tierLabel}
                </div>
                <p className="text-slate-400 mt-2">{result.tagline}</p>
              </div>

              <div className="relative h-4 bg-slate-700 rounded-full overflow-hidden mb-8">
                <div className="absolute inset-0 flex">
                  <div className="w-1/3 bg-orange-500/30 border-r border-slate-600" />
                  <div className="w-1/3 bg-yellow-500/30 border-r border-slate-600" />
                  <div className="w-1/3 bg-emerald-500/30" />
                </div>
                <div
                  className="absolute top-0 bottom-0 w-1 bg-white rounded-full shadow-lg transition-all duration-1000"
                  style={{ left: `${result.score}%` }}
                />
              </div>

              <div className="flex justify-between text-sm text-slate-500 mb-8">
                <span>Low (0-33)</span>
                <span>Moderate (34-66)</span>
                <span>High (67-100)</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 mb-6">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                Recommended Tactics
              </h3>
              <ul className="space-y-3">
                {result.tactics.map((tactic, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="text-emerald-400 font-bold mt-0.5">{index + 1}.</span>
                    <span className="text-slate-300">{tactic}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 mb-6">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-teal-400" />
                Suggested Counter Range
              </h3>
              <div className="flex items-center justify-center gap-4 py-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">+{result.suggestedRange.minPercent}%</div>
                  <div className="text-slate-400 text-sm">minimum</div>
                </div>
                <div className="text-2xl text-slate-600">to</div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-emerald-400">+{result.suggestedRange.maxPercent}%</div>
                  <div className="text-slate-400 text-sm">stretch goal</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-amber-500/10 border-amber-500/30 mb-8">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-amber-400 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Risk Assessment
              </h3>
              <p className="text-slate-300" data-testid="text-risk">{result.riskAssessment}</p>
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={() => navigate("/scripts")}
              size="lg"
              className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold"
              data-testid="button-generate-script"
            >
              Generate My Negotiation Script
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              onClick={() => navigate("/scorecard")}
              size="lg"
              variant="outline"
              className="flex-1 border-slate-600 text-slate-200 hover:bg-slate-800"
              data-testid="button-check-offer"
            >
              Check Another Offer
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
