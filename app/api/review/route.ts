import { NextResponse } from "next/server";
import { reviewWithDeepSeek } from "@/lib/deepseek";
import type { Note } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      fullText?: string;
      notes?: Note[];
    };

    if (!body.fullText || !Array.isArray(body.notes)) {
      return NextResponse.json({ error: "Missing fullText or notes." }, { status: 400 });
    }

    const result = await reviewWithDeepSeek({
      fullText: body.fullText,
      notes: body.notes
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Review request failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
