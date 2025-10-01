

import { GoogleGenAI } from "@google/genai";
import type { Project } from '../types';

// FIX: Aligned with Gemini API guidelines. Assume API_KEY is always present.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

function formatProjectDataForPrompt(project: Partial<Project>): string {
  const totalCost = project.bom?.reduce((acc, item) => acc + (item.price * item.quantityNeeded), 0) ?? 0;

  return `
    You are a project manager's assistant. Based on the following project data, write a concise and professional summary for an approval request email. 
    The summary should be well-structured, clear, and persuasive.
    Highlight the project's goal, key deliverables, total estimated cost, and timeline.
    Start with a clear subject line like "Project Approval Request: [Project Name]".
    
    --- PROJECT DATA ---

    Project Name: ${project.name || 'N/A'}
    Cost Center: ${project.costCenter || 'N/A'}
    Details: ${project.details || 'N/A'}
    
    Bill of Materials (${project.bom?.length || 0} items):
    ${project.bom?.map(item => `- ${item.name}: ${item.quantityNeeded} units @ $${item.price.toFixed(2)} each`).join('\n') || 'No items listed.'}
    Total Estimated Cost: $${totalCost.toFixed(2)}

    Timeline Milestones:
    ${project.timeline?.map(m => `- ${m.name} (Scheduled: ${new Date(m.startDate).toLocaleDateString()} to ${new Date(m.endDate).toLocaleDateString()})`).join('\n') || 'No milestones defined.'}
    
    Assigned Team:
    ${project.team?.map(t => `- ${t.name} (${t.role})`).join('\n') || 'No team members assigned.'}

    --- END OF DATA ---

    Generate the summary now.
  `;
}

export const generateProjectSummary = async (project: Partial<Project>): Promise<string> => {
  // FIX: Removed API Key check as per Gemini API guidelines.
  try {
    const prompt = formatProjectDataForPrompt(project);
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        return `An error occurred while generating the summary: ${error.message}`;
    }
    return "An unknown error occurred while generating the summary.";
  }
};
