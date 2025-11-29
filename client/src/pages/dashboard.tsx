import Layout from "@/components/layout";
import { StatCard } from "@/components/stat-card";
import { formatCurrency } from "@/lib/mockData";
import { 
  useAggregateStats, 
  useSalaryByRole, 
  useIndustryDistribution, 
  useRecentRecords 
} from "@/lib/api";
import { 
  Users, 
  Briefcase, 
  TrendingUp, 
  MapPin 
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useAggregateStats();
  const { data: salaryData, isLoading: salaryLoading } = useSalaryByRole();
  const { data: industryData, isLoading: industryLoading } = useIndustryDistribution();
  const { data: recentRecords, isLoading: recentLoading } = useRecentRecords(5);

  const COLORS = ['#3b82f6', '#10b981', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  if (statsLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <Skeleton className="h-12 w-96" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Executive Dashboard</h1>
        <p className="text-muted-foreground">Real-time compensation analytics across US markets.</p>
      </div>

      {/* Stats Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Data Points" 
          value={stats?.totalRecords.toLocaleString() || "0"} 
          change="+12.5%" 
          trend="up"
          description="from last month"
          icon={Users} 
        />
        <StatCard 
          title="Avg. Market Salary" 
          value={formatCurrency(stats?.avgSalary || 0)} 
          change="+2.1%" 
          trend="up"
          description="vs. national avg"
          icon={Briefcase} 
        />
        <StatCard 
          title="Unique Roles" 
          value={stats?.uniqueRoles.toString() || "0"} 
          description="Tracked positions"
          icon={TrendingUp} 
        />
        <StatCard 
          title="Coverage Areas" 
          value="142 MSAs" 
          description="Across 50 states"
          icon={MapPin} 
        />
      </div>

      {/* Main Charts */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Top Paying Roles</CardTitle>
            <CardDescription>Median base salary by job title (USD)</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            {salaryLoading ? (
              <Skeleton className="h-[300px]" />
            ) : (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salaryData || []} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={120} tick={{fontSize: 12}} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      cursor={{fill: 'transparent'}}
                      contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Bar dataKey="salary" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Data Distribution</CardTitle>
            <CardDescription>Records by Industry Sector</CardDescription>
          </CardHeader>
          <CardContent>
            {industryLoading ? (
              <Skeleton className="h-[300px]" />
            ) : (
              <>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={industryData || []}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {(industryData || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap justify-center gap-2 mt-4">
                  {(industryData || []).map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      {entry.name}
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
         <CardHeader>
            <CardTitle>Recent Submissions</CardTitle>
            <CardDescription>Latest validated compensation records</CardDescription>
          </CardHeader>
          <CardContent>
            {recentLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-20" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {(recentRecords || []).filter((record: any) => record.jobTitle).map((record: any) => (
                  <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg bg-card/50 hover:bg-secondary/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {record.jobTitle?.charAt(0) || "?"}
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">{record.jobTitle}</h4>
                        <p className="text-xs text-muted-foreground">{record.industryNaics} • {record.state}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-medium text-sm">{formatCurrency(record.baseSalaryMedian)}</div>
                      <div className="text-xs text-muted-foreground">{record.managementLevel} Level</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
      </Card>
    </Layout>
  );
}
