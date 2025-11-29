import { useState, useMemo } from "react";
import Layout from "@/components/layout";
import { MOCK_DATA, formatCurrency, formatDate, SalaryRecord } from "@/lib/mockData";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Download, Filter, Search, Eye, Building2, MapPin, GraduationCap } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function Dataset() {
  const [search, setSearch] = useState("");
  const [industryFilter, setIndustryFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [selectedRecord, setSelectedRecord] = useState<SalaryRecord | null>(null);

  const industries = Array.from(new Set(MOCK_DATA.map(d => d.job_info.industry_naics)));
  const levels = Array.from(new Set(MOCK_DATA.map(d => d.requirements.management_level)));

  const filteredData = useMemo(() => {
    return MOCK_DATA.filter(record => {
      const matchesSearch = record.job_info.title.toLowerCase().includes(search.toLowerCase()) || 
                          record.job_info.industry_naics.toLowerCase().includes(search.toLowerCase());
      const matchesIndustry = industryFilter === "all" || record.job_info.industry_naics === industryFilter;
      const matchesLevel = levelFilter === "all" || record.requirements.management_level === levelFilter;
      return matchesSearch && matchesIndustry && matchesLevel;
    });
  }, [search, industryFilter, levelFilter]);

  return (
    <Layout>
      <div className="flex flex-col gap-6 h-full">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Dataset Explorer</h1>
            <p className="text-muted-foreground">Search and filter {MOCK_DATA.length} verified compensation records.</p>
          </div>
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 p-4 bg-card border rounded-lg shadow-sm">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search job titles or industries..." 
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <Select value={industryFilter} onValueChange={setIndustryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Industry" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Industries</SelectItem>
              {industries.map(i => (
                <SelectItem key={i} value={i}>{i}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              {levels.map(l => (
                <SelectItem key={l} value={l}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button variant="ghost" size="icon">
             <Filter className="w-4 h-4 text-muted-foreground" />
          </Button>
        </div>

        {/* Data Grid */}
        <div className="border rounded-lg bg-card flex-1 overflow-hidden flex flex-col shadow-sm">
          <div className="overflow-auto flex-1">
            <Table>
              <TableHeader className="sticky top-0 bg-card z-10 border-b">
                <TableRow>
                  <TableHead className="w-[250px]">Job Title / SOC</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Company Info</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Total Comp</TableHead>
                  <TableHead className="text-right">Confidence</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((record) => (
                  <TableRow key={record.record_id} className="hover:bg-secondary/50 group">
                    <TableCell className="font-medium">
                      <div className="text-foreground">{record.job_info.title}</div>
                      <div className="text-xs text-muted-foreground font-mono mt-0.5">SOC: {record.job_info.soc_code}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-normal text-xs">
                        {record.requirements.management_level}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{record.job_info.industry_naics}</div>
                      <div className="text-xs text-muted-foreground">{record.job_info.company_size} employees</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{record.location.state}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-[150px]" title={record.location.msa}>{record.location.msa}</div>
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium">
                      {formatCurrency(record.compensation.total_comp_median)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                         <span className={record.meta.confidence_score > 0.8 ? "text-emerald-600" : "text-amber-600"}>
                           {Math.round(record.meta.confidence_score * 100)}%
                         </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Sheet>
                        <SheetTrigger asChild>
                          <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </SheetTrigger>
                        <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
                          <SheetHeader className="mb-6">
                            <SheetTitle className="text-2xl">{record.job_info.title}</SheetTitle>
                            <SheetDescription>
                              Record ID: {record.record_id} • Last Updated: {formatDate(record.meta.last_updated)}
                            </SheetDescription>
                          </SheetHeader>

                          <div className="space-y-8">
                            {/* Compensation Section */}
                            <div className="space-y-4">
                              <h3 className="text-lg font-semibold flex items-center gap-2">
                                <span className="w-1 h-6 bg-primary rounded-full"></span>
                                Compensation Profile
                              </h3>
                              <div className="grid grid-cols-2 gap-4 bg-secondary/30 p-4 rounded-lg border">
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">Base Salary (Median)</p>
                                  <p className="text-xl font-bold font-mono">{formatCurrency(record.compensation.base_salary_median)}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">Total Compensation</p>
                                  <p className="text-xl font-bold font-mono text-primary">{formatCurrency(record.compensation.total_comp_median)}</p>
                                </div>
                                <div className="col-span-2 pt-2 border-t border-border/50">
                                  <p className="text-xs text-muted-foreground mb-2">Salary Range</p>
                                  <div className="flex justify-between text-xs font-mono mb-1">
                                    <span>{formatCurrency(record.compensation.base_salary_min)}</span>
                                    <span>{formatCurrency(record.compensation.base_salary_max)}</span>
                                  </div>
                                  <Progress value={50} className="h-2" />
                                </div>
                              </div>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-3">
                                  <h4 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                                    <Building2 className="w-4 h-4" /> Company
                                  </h4>
                                  <div className="text-sm space-y-1">
                                    <p><span className="text-muted-foreground">Industry:</span> {record.job_info.industry_naics}</p>
                                    <p><span className="text-muted-foreground">Size:</span> {record.job_info.company_size}</p>
                                    <p><span className="text-muted-foreground">Type:</span> {record.job_info.company_type}</p>
                                  </div>
                                </div>

                                <div className="space-y-3">
                                  <h4 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                                    <MapPin className="w-4 h-4" /> Location
                                  </h4>
                                  <div className="text-sm space-y-1">
                                    <p>{record.location.msa}</p>
                                    <p className="text-muted-foreground">{record.location.state}</p>
                                    <p className="text-xs bg-secondary inline-block px-2 py-0.5 rounded mt-1">
                                      COL Index: {record.location.cost_of_living_index.toFixed(1)}
                                    </p>
                                  </div>
                                </div>
                            </div>

                            {/* Requirements */}
                            <div className="space-y-3">
                               <h4 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                                  <GraduationCap className="w-4 h-4" /> Requirements
                                </h4>
                                <div className="bg-secondary/20 p-4 rounded-lg space-y-3">
                                  <div className="flex gap-4 text-sm">
                                    <div>
                                      <p className="text-xs text-muted-foreground">Experience</p>
                                      <p>{record.requirements.min_years_experience}+ Years</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground">Education</p>
                                      <p>{record.requirements.education_level}</p>
                                    </div>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground mb-1.5">Top Skills</p>
                                    <div className="flex flex-wrap gap-1.5">
                                      {record.requirements.skills.map(skill => (
                                        <Badge key={skill} variant="outline" className="text-xs bg-background">
                                          {skill}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                            </div>

                            {/* Meta */}
                            <div className="border-t pt-4">
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>Source: {record.meta.data_source}</span>
                                <span>Sample Size: {record.meta.sample_size}</span>
                              </div>
                            </div>

                          </div>
                        </SheetContent>
                      </Sheet>
                    </TableCell>
                  </TableRow>
                ))}
                
                {filteredData.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      No records found matching your criteria.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="p-4 border-t bg-secondary/20 text-xs text-muted-foreground flex justify-between">
            <span>Showing {filteredData.length} records</span>
            <span>Data aggregated from public & commercial sources</span>
          </div>
        </div>
      </div>
    </Layout>
  );
}
