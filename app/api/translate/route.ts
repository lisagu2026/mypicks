import { NextResponse } from "next/server";
import { translateWithDeepSeek } from "@/lib/deepseek";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      selectedText?: string;
      contextSentence?: string;
    };

    if (!body.selectedText || !body.contextSentence) {
      return NextResponse.json({ error: "Missing selectedText or contextSentence." }, { status: 400 });
    }

    const result = await translateWithDeepSeek({
      selectedText: body.selectedText,
      contextSentence: body.contextSentence
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Translate request failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
