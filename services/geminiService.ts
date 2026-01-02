import { GoogleGenAI } from "@google/genai";
import { EVTransaction } from "../types";

export const getAIAnalysis = async (transactions: EVTransaction[]): Promise<string> => {
  // Fixed: Initialize GoogleGenAI with a named parameter object as per current SDK guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Prepare a summarized context for the model
  const summary = transactions.slice(0, 50).map(t => ({
    // Use properties that actually exist on EVTransaction interface
    date: t.startTime.split('T')[0],
    station: t.station,
    energy: t.meterKWh,
    cost: t.costCOP,
    account: t.account,
    connector: t.connector
  }));

  const prompt = `
    Analyze this EV charging transaction data and provide 3-4 professional business insights.
    Focus on trends in energy usage, station popularity, cost efficiency, and infrastructure planning.
    Keep the tone executive and actionable.
    
    Data Summary:
    ${JSON.stringify(summary, null, 2)}
    
    Format the response as clear bullet points with bold titles.
  `;

  try {
    // Fixed: Using gemini-3-pro-preview for complex reasoning and business analysis tasks
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
    });
    // Fixed: Access the .text property directly instead of calling it as a method
    return response.text || "Unable to generate analysis at this time.";
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "Error generating AI insights. Please check your connection or try again later.";
  }
};