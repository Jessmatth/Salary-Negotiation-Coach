import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  queryCompensationSchema, 
  benchmarkRequestSchema,
  insertCompensationRecordSchema,
  scorecardInputSchema,
  leverageQuizInputSchema,
  scriptInputSchema,
} from "@shared/schema";
import { 
  calculateLeverageScore,
  calculateLeverageWithDollars,
  generateNegotiationScript,
  calculateMarketPosition,
  generateNarrative,
} from "@shared/negotiation-logic";
import { z } from "zod";
import { randomUUID } from "crypto";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // ============================================
  // NEGOTIATION COACH ENDPOINTS
  // ============================================
  
  // Scorecard - Check if offer is good
  app.post("/api/scorecard", async (req, res) => {
    try {
      const input = scorecardInputSchema.parse(req.body);
      const sessionId = randomUUID();
      
      // Get market range from database
      const marketRange = await storage.getMarketRange(input);
      
      // Calculate position relative to market
      const position = calculateMarketPosition(input.baseSalaryOffered, marketRange);
      
      // Generate narrative
      const narrative = generateNarrative(position, {
        jobTitle: input.jobTitle,
        yearsExperience: input.yearsExperience,
        location: input.location,
      });
      
      // Save evaluation
      await storage.saveOfferEvaluation({
        sessionId,
        jobTitle: input.jobTitle,
        companyName: input.companyName,
        yearsExperience: input.yearsExperience,
        seniorityLevel: input.seniorityLevel,
        location: input.location,
        isRemote: input.isRemote,
        baseSalaryOffered: input.baseSalaryOffered,
        bonusPercent: input.bonusPercent,
        equityDetails: input.equityDetails,
        marketMin: marketRange.min,
        marketMedian: marketRange.median,
        marketMax: marketRange.max,
        differenceFromMarket: position.difference,
        percentilePosition: position.percentile,
      });
      
      res.json({
        sessionId,
        input,
        marketRange: {
          min: marketRange.min,
          p25: marketRange.p25,
          median: marketRange.median,
          p75: marketRange.p75,
          max: marketRange.max,
        },
        position,
        narrative,
        sampleSize: marketRange.sampleSize,
        confidence: marketRange.confidence,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid input", details: error.errors });
      } else {
        console.error("Error calculating scorecard:", error);
        res.status(500).json({ error: "Failed to calculate scorecard" });
      }
    }
  });
  
  // Leverage Quiz - Calculate negotiation leverage
  app.post("/api/leverage-score", async (req, res) => {
    try {
      const input = leverageQuizInputSchema.parse(req.body);
      const currentOffer = req.body.currentOffer ? Number(req.body.currentOffer) : undefined;
      
      let result;
      if (currentOffer) {
        result = calculateLeverageWithDollars(input, currentOffer);
      } else {
        result = calculateLeverageScore(input);
      }
      
      // Save quiz response
      const sessionId = req.body.sessionId || randomUUID();
      await storage.saveQuizResponse({
        sessionId,
        evaluationId: req.body.evaluationId,
        ...input,
        leverageScore: result.score,
        leverageTier: result.tier,
      });
      
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid quiz answers", details: error.errors });
      } else {
        console.error("Error calculating leverage:", error);
        res.status(500).json({ error: "Failed to calculate leverage score" });
      }
    }
  });
  
  // Script Generator - Generate negotiation email
  app.post("/api/scripts", async (req, res) => {
    try {
      const input = scriptInputSchema.parse(req.body);
      
      const askAmount = input.askAmount || Math.round(input.marketMedian * 1.1);
      
      const script = generateNegotiationScript({
        jobTitle: input.jobTitle,
        companyName: input.companyName,
        yearsExperience: input.yearsExperience,
        location: input.location,
        currentOffer: input.currentOffer,
        marketMedian: input.marketMedian,
        askAmount,
        tone: input.tone,
      });
      
      // Build context summary
      const contextParts = [input.jobTitle];
      if (input.yearsExperience) contextParts.push(`${input.yearsExperience} years`);
      if (input.companyName) contextParts.push(`Offer from ${input.companyName}`);
      if (input.location) contextParts.push(input.location);
      if (input.leverageScore !== undefined) {
        contextParts.push(`Leverage: ${input.leverageTier?.charAt(0).toUpperCase()}${input.leverageTier?.slice(1)} (${input.leverageScore}/100)`);
      }
      
      res.json({
        subject: script.subject,
        body: script.body,
        tone: input.tone,
        contextSummary: contextParts.join(" · "),
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid script input", details: error.errors });
      } else {
        console.error("Error generating script:", error);
        res.status(500).json({ error: "Failed to generate script" });
      }
    }
  });
  
  // Job title autocomplete
  app.get("/api/job-titles", async (req, res) => {
    try {
      const query = String(req.query.q || "");
      const suggestions = await storage.getJobTitleSuggestions(query);
      res.json(suggestions);
    } catch (error) {
      console.error("Error fetching job titles:", error);
      res.status(500).json({ error: "Failed to fetch job titles" });
    }
  });
  
  // ============================================
  // EXISTING ENDPOINTS (kept for compatibility)
  // ============================================
  
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
  
  // Legacy benchmark calculator
  app.post("/api/benchmark", async (req, res) => {
    try {
      const request = benchmarkRequestSchema.parse(req.body);
      
      let baseSalary = 80000;
      
      const industryMultipliers: Record<string, number> = {
        "tech": 1.25,
        "finance": 1.2,
        "health": 1.1,
        "retail": 0.9,
      };
      baseSalary *= industryMultipliers[request.industry] || 1.0;
      
      const locationMultipliers: Record<string, number> = {
        "sf": 1.35,
        "ny": 1.3,
        "austin": 1.1,
        "remote": 0.95,
      };
      baseSalary *= locationMultipliers[request.location] || 1.0;
      
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
  
  // Create new compensation record
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
