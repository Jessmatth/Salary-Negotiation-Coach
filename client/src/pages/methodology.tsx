import Layout from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Database, 
  ShieldCheck, 
  Scale, 
  Globe, 
  Building2, 
  FileText, 
  Activity 
} from "lucide-react";

export default function Methodology() {
  return (
    <Layout>
      <div className="flex flex-col gap-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Data Methodology</h1>
          <p className="text-muted-foreground">How we collect, validate, and benchmark compensation data.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Data Sources */}
          <Card className="md:col-span-2">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-primary" />
                <CardTitle>Data Collection Strategy</CardTitle>
              </div>
              <CardDescription>We aggregate data from four primary pillars to ensure accuracy and reduce bias.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    Government Sources (High Reliability)
                  </h3>
                  <ul className="space-y-3">
                    <li className="flex gap-3 p-3 bg-secondary/30 rounded-lg text-sm">
                      <div className="font-medium min-w-[60px]">BLS OEWS</div>
                      <div className="text-muted-foreground">Detailed wage data by occupation & location from Bureau of Labor Statistics.</div>
                    </li>
                    <li className="flex gap-3 p-3 bg-secondary/30 rounded-lg text-sm">
                      <div className="font-medium min-w-[60px]">H1B Data</div>
                      <div className="text-muted-foreground">Department of Labor's foreign labor certification data showing actual paid salaries.</div>
                    </li>
                  </ul>
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <Activity className="w-4 h-4 text-muted-foreground" />
                    Commercial & Crowdsourced
                  </h3>
                  <ul className="space-y-3">
                    <li className="flex gap-3 p-3 bg-secondary/30 rounded-lg text-sm">
                      <div className="font-medium min-w-[60px]">Direct</div>
                      <div className="text-muted-foreground">API integrations with partners like Glassdoor and Levels.fyi for tech-focused roles.</div>
                    </li>
                    <li className="flex gap-3 p-3 bg-secondary/30 rounded-lg text-sm">
                      <div className="font-medium min-w-[60px]">Postings</div>
                      <div className="text-muted-foreground">Job posting salary ranges scraped from major boards (Indeed, LinkedIn).</div>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Validation Rules */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <CardTitle>Quality Assurance</CardTitle>
              </div>
              <CardDescription>Automated validation pipeline</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold shrink-0">1</div>
                  <div className="text-sm">
                    <p className="font-medium">Outlier Removal</p>
                    <p className="text-muted-foreground">Records below minimum wage or above 99.5th percentile are automatically flagged.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold shrink-0">2</div>
                  <div className="text-sm">
                    <p className="font-medium">Standardization</p>
                    <p className="text-muted-foreground">Job titles mapped to O*NET SOC codes for consistent categorization.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold shrink-0">3</div>
                  <div className="text-sm">
                    <p className="font-medium">Inflation Adjustment</p>
                    <p className="text-muted-foreground">Historical data normalized using CPI adjustments to current dollar value.</p>
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Confidence Scoring */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-blue-600" />
                <CardTitle>Confidence Scoring</CardTitle>
              </div>
              <CardDescription>How we calculate reliability (0-100%)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Source Reliability</span>
                    <span className="text-muted-foreground">Weight: 40%</span>
                  </div>
                  <Progress value={40} className="h-2" />
                  <p className="text-xs text-muted-foreground">Gov sources weighted higher than self-reported.</p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Sample Size</span>
                    <span className="text-muted-foreground">Weight: 30%</span>
                  </div>
                  <Progress value={30} className="h-2" />
                  <p className="text-xs text-muted-foreground">Logarithmic scale based on data points.</p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Recency</span>
                    <span className="text-muted-foreground">Weight: 30%</span>
                  </div>
                  <Progress value={30} className="h-2" />
                  <p className="text-xs text-muted-foreground">Decay factor applied to data &gt; 12 months old.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}

function Progress({ value, className }: { value: number, className?: string }) {
  return (
    <div className={`w-full bg-secondary rounded-full overflow-hidden ${className}`}>
      <div className="h-full bg-primary transition-all" style={{ width: `${value}%` }} />
    </div>
  );
}
