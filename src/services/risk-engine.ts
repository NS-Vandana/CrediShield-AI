/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from "@google/genai";
import Papa from "papaparse";
import { Transaction, UserRiskProfile, RealTimeAggregates } from "../types/risk";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export class RiskEngineService {
  private users: Map<string, UserRiskProfile> = new Map();
  private userTransactions: Map<string, Transaction[]> = new Map();

  async initialize() {
    try {
      const usersRes = await fetch("/src/data/users.csv");
      const usersText = await usersRes.text();
      const transactionsRes = await fetch("/src/data/transactions.csv");
      const transactionsText = await transactionsRes.text();

      Papa.parse(usersText, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        complete: (results) => {
          results.data.forEach((row: any) => {
            if (row.user_id) this.users.set(row.user_id, row as UserRiskProfile);
          });
        },
      });

      Papa.parse(transactionsText, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        complete: (results) => {
          results.data.forEach((row: any) => {
            if (row.user_id) {
              const txns = this.userTransactions.get(row.user_id) || [];
              txns.push(row as Transaction);
              this.userTransactions.set(row.user_id, txns);
            }
          });
        },
      });

      console.log("Risk Engine initialized with", this.users.size, "users.");
    } catch (error) {
      console.error("Initialization failed:", error);
    }
  }

  getUserProfile(userId: string): UserRiskProfile | undefined {
    return this.users.get(userId);
  }

  getAllUsers(): UserRiskProfile[] {
    return Array.from(this.users.values());
  }

  calculateRealTimeAggregates(userId: string): RealTimeAggregates {
    const txns = this.userTransactions.get(userId) || [];
    const profile = this.users.get(userId);

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const l30d = txns.filter(t => new Date(t.timestamp) >= thirtyDaysAgo);
    const l24h = txns.filter(t => new Date(t.timestamp) >= twentyFourHoursAgo);

    const avgSpend = l30d.length ? l30d.reduce((sum, t) => sum + t.amount, 0) / l30d.length : 0;
    const failedCount = l30d.filter(t => t.transaction_status === 'Failed').length;
    const velocity = l24h.length;

    const categoryCounts: Record<string, number> = {};
    txns.forEach(t => categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1);
    const topCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

    // Simulated LGBM Score Logic (Weighted variables)
    // Scale: 0-1000 (Higher is Better)
    let score = 500;
    if (profile) {
      score = profile.risk_score;
      // Adjust based on real-time spikes
      if (velocity > 5) score -= 50; // Velocity spike (Fraud risk)
      if (failedCount > 2) score -= 100; // Recent failures
      if (avgSpend > (profile.monthly_income * 0.8)) score -= 150; // Overleveraging
    }

    return {
      avg_spend_l30d: Math.round(avgSpend),
      failed_count_l30d: failedCount,
      velocity_l24h: velocity,
      top_category: topCategory,
      current_risk_score: Math.max(0, Math.min(1000, score))
    };
  }

  async getAiDecisionExplanation(userId: string, requestedAmount: number): Promise<string> {
    const profile = this.users.get(userId);
    const aggregates = this.calculateRealTimeAggregates(userId);

    if (!profile) return "User profile not found.";

    const prompt = `
      Evaluate the user decision for a credit request of ₹${requestedAmount}.
      Focus on these real-time aggregates:
      - Monthly Income: ₹${profile.monthly_income}
      - Account Age: ${profile.account_age_days} days
      - On-time Payment: ${profile.on_time_payment_pct}%
      - Current Real-Time Risk Score (Simulated LGBM): ${aggregates.current_risk_score}/1000
      - Recent Failures (Last 30d): ${aggregates.failed_count_l30d}
      
      Recommendation: ${aggregates.current_risk_score > 600 ? 'Approved' : aggregates.current_risk_score > 400 ? 'Review' : 'Rejected'}.
      
      Explain the reasoning in 2 short sentences. Be direct.
    `;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
            systemInstruction: "You are a senior credit analyst. Provide concise, data-driven explanations for credit decisions."
        }
      });
      return response.text || "No explanation available.";
    } catch (error) {
      console.error("AI Decisioning failed:", error);
      return `Recommended decision: ${aggregates.current_risk_score > 500 ? 'Approved' : 'Rejected'} based on risk score ${aggregates.current_risk_score}.`;
    }
  }
}

export const riskEngine = new RiskEngineService();
