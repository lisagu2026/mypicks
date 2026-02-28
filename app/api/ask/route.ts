import { NextResponse } from "next/server";
import { askWithDeepSeek } from "@/lib/deepseek";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      selectedText?: string;
      contextSentence?: string;
      fullText?: string;
      question?: string;
    };

    if (!body.selectedText || !body.contextSentence || !body.fullText || !body.question) {
      return NextResponse.json(
        { error: "Missing selectedText, contextSentence, fullText, or question." },
        { status: 400 }
      );
    }

    const result = await askWithDeepSeek({
      selectedText: body.selectedText,
      contextSentence: body.contextSentence,
      fullText: body.fullText,
      question: body.question
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ask request failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
