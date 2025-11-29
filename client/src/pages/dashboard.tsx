import Layout from "@/components/layout";
import { StatCard } from "@/components/stat-card";
import { MOCK_DATA, formatCurrency } from "@/lib/mockData";
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

export default function Dashboard() {
  const totalRecords = MOCK_DATA.length;
  const avgSalary = MOCK_DATA.reduce((acc, curr) => acc + curr.compensation.base_salary_median, 0) / totalRecords;
  const totalRoles = new Set(MOCK_DATA.map(d => d.job_info.title)).size;

  // Prepare chart data
  const industryData = MOCK_DATA.reduce((acc: any, curr) => {
    acc[curr.job_info.industry_naics] = (acc[curr.job_info.industry_naics] || 0) + 1;
    return acc;
  }, {});
  const pieData = Object.entries(industryData).map(([name, value]) => ({ name, value }));

  const salaryByRole = MOCK_DATA.reduce((acc: any, curr) => {
    if (!acc[curr.job_info.title]) {
      acc[curr.job_info.title] = { total: 0, count: 0 };
    }
    acc[curr.job_info.title].total += curr.compensation.base_salary_median;
    acc[curr.job_info.title].count += 1;
    return acc;
  }, {});
  
  const barData = Object.entries(salaryByRole)
    .map(([name, val]: any) => ({ name, salary: Math.round(val.total / val.count) }))
    .sort((a, b) => b.salary - a.salary)
    .slice(0, 5);

  const COLORS = ['#3b82f6', '#10b981', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

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
          value={totalRecords.toLocaleString()} 
          change="+12.5%" 
          trend="up"
          description="from last month"
          icon={Users} 
        />
        <StatCard 
          title="Avg. Market Salary" 
          value={formatCurrency(avgSalary)} 
          change="+2.1%" 
          trend="up"
          description="vs. national avg"
          icon={Briefcase} 
        />
        <StatCard 
          title="Unique Roles" 
          value={totalRoles.toString()} 
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
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
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
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Data Distribution</CardTitle>
            <CardDescription>Records by Industry Sector</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
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
              {pieData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  {entry.name}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
         <CardHeader>
            <CardTitle>Recent Submissions</CardTitle>
            <CardDescription>Latest validated compensation records</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {MOCK_DATA.slice(0, 5).map((record) => (
                <div key={record.record_id} className="flex items-center justify-between p-4 border rounded-lg bg-card/50 hover:bg-secondary/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {record.job_info.title.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">{record.job_info.title}</h4>
                      <p className="text-xs text-muted-foreground">{record.job_info.industry_naics} • {record.location.state}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-medium text-sm">{formatCurrency(record.compensation.base_salary_median)}</div>
                    <div className="text-xs text-muted-foreground">{record.requirements.management_level} Level</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
      </Card>
    </Layout>
  );
}
