import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  queryCompensationSchema, 
  benchmarkRequestSchema,
  insertCompensationRecordSchema 
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Get compensation records with filters
  app.get("/api/compensation", async (req, res) => {
    try {
      const query = queryCompensationSchema.parse({
        search: req.query.search,
        industry: req.query.industry,
        state: req.query.state,
        managementLevel: req.query.managementLevel,
        minSalary: req.query.minSalary ? Number(req.query.minSalary) : undefined,
        maxSalary: req.query.maxSalary ? Number(req.query.maxSalary) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : 100,
        offset: req.query.offset ? Number(req.query.offset) : 0,
      });
      
      const result = await storage.getCompensationRecords(query);
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid query parameters", details: error.errors });
      } else {
        console.error("Error fetching compensation records:", error);
        res.status(500).json({ error: "Failed to fetch compensation records" });
      }
    }
  });
  
  // Get single record by ID
  app.get("/api/compensation/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID" });
      }
      
      const record = await storage.getCompensationRecordById(id);
      if (!record) {
        return res.status(404).json({ error: "Record not found" });
      }
      
      res.json(record);
    } catch (error) {
      console.error("Error fetching compensation record:", error);
      res.status(500).json({ error: "Failed to fetch compensation record" });
    }
  });
  
  // Dashboard analytics
  app.get("/api/analytics/stats", async (req, res) => {
    try {
      const stats = await storage.getAggregateStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });
  
  app.get("/api/analytics/salary-by-role", async (req, res) => {
    try {
      const data = await storage.getSalaryByRole();
      res.json(data);
    } catch (error) {
      console.error("Error fetching salary by role:", error);
      res.status(500).json({ error: "Failed to fetch salary by role" });
    }
  });
  
  app.get("/api/analytics/industry-distribution", async (req, res) => {
    try {
      const data = await storage.getIndustryDistribution();
      res.json(data);
    } catch (error) {
      console.error("Error fetching industry distribution:", error);
      res.status(500).json({ error: "Failed to fetch industry distribution" });
    }
  });
  
  app.get("/api/analytics/recent", async (req, res) => {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 5;
      const records = await storage.getRecentRecords(limit);
      res.json(records);
    } catch (error) {
      console.error("Error fetching recent records:", error);
      res.status(500).json({ error: "Failed to fetch recent records" });
    }
  });
  
  // Benchmark calculator
  app.post("/api/benchmark", async (req, res) => {
    try {
      const request = benchmarkRequestSchema.parse(req.body);
      
      // Simple benchmark calculation algorithm
      // Base salary varies by role and industry
      let baseSalary = 80000;
      
      // Industry adjustments
      const industryMultipliers: Record<string, number> = {
        "tech": 1.25,
        "finance": 1.2,
        "health": 1.1,
        "retail": 0.9,
      };
      baseSalary *= industryMultipliers[request.industry] || 1.0;
      
      // Location adjustments (simplified)
      const locationMultipliers: Record<string, number> = {
        "sf": 1.35,
        "ny": 1.3,
        "austin": 1.1,
        "remote": 0.95,
      };
      baseSalary *= locationMultipliers[request.location] || 1.0;
      
      // Experience adjustment (3-5% per year)
      const experienceMultiplier = 1 + (request.experience * 0.04);
      baseSalary *= experienceMultiplier;
      
      const median = Math.round(baseSalary);
      const result = {
        min: Math.round(median * 0.85),
        max: Math.round(median * 1.25),
        median,
        p25: Math.round(median * 0.92),
        p75: Math.round(median * 1.15),
        factors: {
          industry: Math.round((industryMultipliers[request.industry] || 1.0) * 100 - 100),
          location: Math.round((locationMultipliers[request.location] || 1.0) * 100 - 100),
          experience: Math.round((experienceMultiplier - 1) * 100),
        },
      };
      
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid request", details: error.errors });
      } else {
        console.error("Error calculating benchmark:", error);
        res.status(500).json({ error: "Failed to calculate benchmark" });
      }
    }
  });
  
  // Create new compensation record (admin/data collection endpoint)
  app.post("/api/compensation", async (req, res) => {
    try {
      const record = insertCompensationRecordSchema.parse(req.body);
      const created = await storage.createCompensationRecord(record);
      res.status(201).json(created);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid record data", details: error.errors });
      } else {
        console.error("Error creating compensation record:", error);
        res.status(500).json({ error: "Failed to create compensation record" });
      }
    }
  });

  return httpServer;
}
