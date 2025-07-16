import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.API_KEY,
});

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const authCookie = cookieStore
    .getAll()
    .find(
      (c) =>
        c.name.endsWith("-auth-token.0") ||
        c.name.endsWith("-auth-token.1")
    );
  if (!authCookie) {
    return NextResponse.json(
      { message: "Authorized user only" },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const prompt = body.prompt;

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { message: "Prompt is required and must be a string." },
        { status: 400 }
      );
    }

    const result = await openai.completions.create({
      prompt: body.prompt,
      model: "gpt-3.5-turbo-instruct",
      max_tokens: 512,
      temperature: 0
    });

    return NextResponse.json({ choices: result.choices });
  } catch {
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 400 }
    );
  }
}