import { GenerateContentResponse, GoogleGenAI } from "@google/genai";

export class LLM {
  private ai = new GoogleGenAI({ apiKey: this.apiKey });

  constructor(private apiKey: string) {}

  updateApiKey(apiKey: string) {
    this.apiKey = apiKey;
    this.ai = new GoogleGenAI({ apiKey: this.apiKey });
  }

  async getResponse(prompt: string) {
    let response: GenerateContentResponse;
    try {
      response = await this.ai.models.generateContent({
        model: "models/gemini-2.5-pro",
        contents: prompt,
      });
      return response.text!.trim();
    } catch (e) {
      console.error(e);
      alert("Some issues with Google Gen AI. Try again");
      throw e;
    }
  }

  async list() {
    const res = await this.ai.models.list();
    console.log(JSON.stringify(res, null, 2));
  }

  async getQueries(jdContent: string, noOfQueries: number) {
    const prompt = `
      From the following Job Description, extract keywords to search for best suiting candidates using Google Search Engine in professional networking sites.
      Filter by job locations given in the JD. 
      Give the response as plain text with each search on a separate line.
      Provide ${noOfQueries} different combinations of such search queries.

      ${jdContent}
    `;
    const res = await this.getResponse(prompt);
    return res.split("\n").map(q => q.trim()).filter(Boolean);
  }
}
