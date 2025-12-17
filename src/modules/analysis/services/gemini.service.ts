import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { logger } from "../../../shared/utils/logger";
import { AnalysisResult, PlayerColor } from "../types";

interface AnalysisContext {
  pgn: string;
  white: string;
  black: string;
  result: string;
  event?: string;
  date?: string;
  playerName: string;
  playerColor: PlayerColor;
}

function buildPrompt(ctx: AnalysisContext): string {
  const playerSide = ctx.playerColor === "white" ? "White" : "Black";
  const opponentSide = ctx.playerColor === "white" ? "Black" : "White";
  const playerResult =
    ctx.result === "1-0"
      ? ctx.playerColor === "white"
        ? "won"
        : "lost"
      : ctx.result === "0-1"
        ? ctx.playerColor === "black"
          ? "won"
          : "lost"
        : "drew";

  return `You are an expert chess analyst and personal coach. Analyze the following chess game from the perspective of ${
    ctx.playerName
  } (playing as ${playerSide}).

## Game Information
- White: ${ctx.white}
- Black: ${ctx.black}
- Result: ${ctx.result}
- Event: ${ctx.event || "Unknown"}
- Date: ${ctx.date || "Unknown"}
- **Player being analyzed**: ${ctx.playerName} (${playerSide}) - ${playerResult}

## PGN
${ctx.pgn}

## Instructions
Analyze this chess game specifically for ${
    ctx.playerName
  } (${playerSide}). Focus on their moves, decisions, and areas for improvement.

Respond with a JSON object in this exact format:

{
  "summary": "A 2-3 sentence overview focusing on how ${
    ctx.playerName
  } played, including opening choice, key themes, and outcome from their perspective",
  "phases": [
    {
      "name": "Opening",
      "moves": "1-15",
      "evaluation": "Assessment of ${ctx.playerName}'s play in this phase",
      "key_ideas": ["What ${ctx.playerName} did well or poorly"]
    }
  ],
  "key_moments": [
    {
      "move_number": 15,
      "move": "Nxe5",
      "fen": "",
      "evaluation": "+1.5",
      "comment": "Explanation of ${ctx.playerName}'s decision and its impact",
      "is_mistake": false
    }
  ],
  "recommendations": ["Specific improvement for ${ctx.playerName}"]
}

Requirements:
- Include 3 phases: Opening, Middlegame, Endgame (or fewer if game ended early)
- Identify 3-5 key moments focusing on ${ctx.playerName}'s moves
- Provide 3-5 actionable recommendations specifically for ${
    ctx.playerName
  } to improve
- Focus on conceptual understanding and patterns ${
    ctx.playerName
  } should recognize
- Be specific with move numbers
- Address ${
    ctx.playerName
  } directly in recommendations (e.g., "Consider developing..." not "White should...")

Respond with ONLY the JSON object, no other text.`;
}

export async function analyzeGame(
  pgn: string,
  metadata: {
    white: string;
    black: string;
    result: string;
    event?: string;
    date?: string;
  },
  playerName: string,
  playerColor: PlayerColor,
): Promise<AnalysisResult> {
  const ctx: AnalysisContext = {
    pgn,
    ...metadata,
    playerName,
    playerColor,
  };

  const prompt = buildPrompt(ctx);

  logger.info(`Starting Gemini analysis for ${playerName} (${playerColor})...`);

  try {
    const google = createGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    });

    const { text } = await generateText({
      model: google("gemini-2.0-flash"),
      prompt,
    });

    // Parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse JSON from Gemini response");
    }

    const result = JSON.parse(jsonMatch[0]) as AnalysisResult;

    logger.info("Gemini analysis completed successfully");

    return result;
  } catch (error) {
    logger.error("Gemini analysis failed:", error);
    throw error;
  }
}

export const geminiService = {
  analyzeGame,
};
