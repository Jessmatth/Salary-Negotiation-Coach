import { useState, useMemo } from "react";
import Layout from "@/components/layout";
import { MOCK_DATA, formatCurrency, formatDate } from "@/lib/mockData";
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
import { Download, Filter, Search } from "lucide-react";

export default function Dataset() {
  const [search, setSearch] = useState("");
  const [industryFilter, setIndustryFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");

  const industries = Array.from(new Set(MOCK_DATA.map(d => d.industry)));
  const levels = Array.from(new Set(MOCK_DATA.map(d => d.experience.level)));

  const filteredData = useMemo(() => {
    return MOCK_DATA.filter(record => {
      const matchesSearch = record.jobTitle.toLowerCase().includes(search.toLowerCase()) || 
                          record.industry.toLowerCase().includes(search.toLowerCase());
      const matchesIndustry = industryFilter === "all" || record.industry === industryFilter;
      const matchesLevel = levelFilter === "all" || record.experience.level === levelFilter;
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
        <div className="flex flex-wrap items-center gap-4 p-4 bg-card border rounded-lg">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search job titles..." 
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
        <div className="border rounded-lg bg-card flex-1 overflow-hidden flex flex-col">
          <div className="overflow-auto flex-1">
            <Table>
              <TableHeader className="sticky top-0 bg-card z-10">
                <TableRow>
                  <TableHead className="w-[250px]">Job Title</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Base Salary (Median)</TableHead>
                  <TableHead className="text-right">Confidence</TableHead>
                  <TableHead className="text-right">Last Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((record) => (
                  <TableRow key={record.id} className="hover:bg-secondary/50">
                    <TableCell className="font-medium">
                      {record.jobTitle}
                      <div className="text-xs text-muted-foreground font-mono mt-0.5">{record.socCode}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-normal text-xs">
                        {record.experience.level}
                      </Badge>
                    </TableCell>
                    <TableCell>{record.industry}</TableCell>
                    <TableCell>{record.location.msa}</TableCell>
                    <TableCell className="text-right font-mono font-medium">
                      {formatCurrency(record.compensation.median)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-2 bg-secondary rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-emerald-500" 
                            style={{ width: `${record.confidenceScore * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {Math.round(record.confidenceScore * 100)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground text-xs">
                      {formatDate(record.lastUpdated)}
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
            <span>Data sources: BLS, H1B, Glassdoor, Levels.fyi</span>
          </div>
        </div>
      </div>
    </Layout>
  );
}
