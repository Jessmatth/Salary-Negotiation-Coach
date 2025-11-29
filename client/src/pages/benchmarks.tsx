import { useState } from "react";
import Layout from "@/components/layout";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { formatCurrency } from "@/lib/mockData";
import { Loader2, ArrowRight, CheckCircle2, Calculator } from "lucide-react";

const formSchema = z.object({
  jobTitle: z.string().min(2, "Job title is required"),
  industry: z.string().min(1, "Industry is required"),
  location: z.string().min(1, "Location is required"),
  experience: z.number().min(0).max(20),
  level: z.string(),
});

export default function Benchmarks() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      jobTitle: "",
      industry: "",
      location: "",
      experience: 5,
      level: "Mid",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    // Simulate calculation latency
    setTimeout(() => {
      const base = 80000;
      const randomFactor = 0.9 + Math.random() * 0.4;
      const expFactor = 1 + (values.experience * 0.05);
      const estimatedMedian = Math.round(base * randomFactor * expFactor);
      
      setResult({
        min: estimatedMedian * 0.85,
        max: estimatedMedian * 1.25,
        median: estimatedMedian,
        p25: estimatedMedian * 0.92,
        p75: estimatedMedian * 1.15,
      });
      setLoading(false);
    }, 1500);
  }

  return (
    <Layout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Benchmark Calculator</h1>
          <p className="text-muted-foreground">Generate custom compensation reports based on role specific factors.</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Input Form */}
          <Card className="lg:col-span-1 h-fit">
            <CardHeader>
              <CardTitle>Role Parameters</CardTitle>
              <CardDescription>Enter details to benchmark</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="jobTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Job Title</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Senior Product Designer" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="industry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Industry Sector</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select industry" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="tech">Technology</SelectItem>
                            <SelectItem value="finance">Finance</SelectItem>
                            <SelectItem value="health">Healthcare</SelectItem>
                            <SelectItem value="retail">Retail & Consumer</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location (MSA)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select location" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="sf">San Francisco, CA</SelectItem>
                            <SelectItem value="ny">New York, NY</SelectItem>
                            <SelectItem value="austin">Austin, TX</SelectItem>
                            <SelectItem value="remote">Remote (US)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="experience"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Years of Experience: {field.value}</FormLabel>
                        <FormControl>
                          <Slider
                            min={0}
                            max={20}
                            step={1}
                            defaultValue={[field.value]}
                            onValueChange={(vals) => field.onChange(vals[0])}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Calculating...
                      </>
                    ) : (
                      <>
                        Generate Benchmark
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Results View */}
          <div className="lg:col-span-2 space-y-6">
            {result ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                <Card className="bg-primary text-primary-foreground border-none">
                  <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div>
                        <p className="text-primary-foreground/80 font-medium mb-1">Estimated Median Base Salary</p>
                        <h2 className="text-5xl font-bold tracking-tight">{formatCurrency(result.median)}</h2>
                      </div>
                      <div className="flex gap-4 text-sm">
                         <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                           <p className="opacity-70 mb-1">Range Min</p>
                           <p className="font-mono font-bold">{formatCurrency(result.min)}</p>
                         </div>
                         <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                           <p className="opacity-70 mb-1">Range Max</p>
                           <p className="font-mono font-bold">{formatCurrency(result.max)}</p>
                         </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Compensation Analysis</CardTitle>
                    <CardDescription>Market positioning based on input criteria</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    {/* Visual Range Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm font-medium">
                        <span>25th Percentile</span>
                        <span>Median</span>
                        <span>75th Percentile</span>
                      </div>
                      <div className="relative h-4 bg-secondary rounded-full overflow-hidden">
                        <div className="absolute top-0 bottom-0 left-[25%] right-[25%] bg-primary/20"></div>
                        <div className="absolute top-0 bottom-0 left-[50%] w-1 bg-primary transform -translate-x-1/2"></div>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground font-mono">
                        <span>{formatCurrency(result.p25)}</span>
                        <span>{formatCurrency(result.median)}</span>
                        <span>{formatCurrency(result.p75)}</span>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="font-medium flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          Factor Impact
                        </h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          <li className="flex justify-between">
                            <span>Location Adjustment (SF)</span>
                            <span className="text-emerald-600 font-medium">+18%</span>
                          </li>
                          <li className="flex justify-between">
                            <span>Industry Premium (Tech)</span>
                            <span className="text-emerald-600 font-medium">+12%</span>
                          </li>
                          <li className="flex justify-between">
                            <span>Experience Level (Senior)</span>
                            <span className="text-emerald-600 font-medium">+25%</span>
                          </li>
                        </ul>
                      </div>
                       <div className="space-y-4">
                        <h4 className="font-medium">Confidence Score</h4>
                        <div className="flex items-center gap-4">
                          <div className="text-4xl font-bold text-foreground">94<span className="text-lg text-muted-foreground font-normal">/100</span></div>
                          <p className="text-xs text-muted-foreground">Based on 1,240 similar verified data points from BLS and H1B filings within the last 12 months.</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-12 border-2 border-dashed rounded-xl text-muted-foreground bg-secondary/10">
                <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4">
                  <Calculator className="w-8 h-8 opacity-50" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-1">Ready to Benchmark</h3>
                <p className="max-w-sm mx-auto">Fill out the role parameters to generate a real-time market analysis report.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
