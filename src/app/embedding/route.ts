// import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.API_KEY,
});

export async function POST(req: Request) {
  // const cookieStore = await cookies();
  // const authCookie = cookieStore
  //   .getAll()
  //   .find(
  //     (c) =>
  //       c.name.endsWith("-auth-token.0") ||
  //       c.name.endsWith("-auth-token.1")
  //   );
  // if (!authCookie) {
  //   return NextResponse.json(
  //     { message: "Authorized user only" },
  //     { status: 401 }
  //   );
  // }

  const requestBody = await req.json();
  if (!requestBody?.text) {
    return NextResponse.json(
      { message: "Invalid request" },
      { status: 422 }
    );
  }

  try {
    const result = await openai.embeddings.create({
      input: requestBody.text,
      model: "text-embedding-ada-002",
    });

    const embedding = result.data[0].embedding;
    const token = result.usage.total_tokens;
    return NextResponse.json({ token, embedding });
  } catch {
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 400 }
    );
  }
}