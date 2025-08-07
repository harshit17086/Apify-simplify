import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { apiKey, actorId } = await req.json();

    if (!apiKey || !actorId) {
      return NextResponse.json(
        { error: "Missing API key or actor ID" },
        { status: 400 }
      );
    }

    // Fetch actor's input schema
    const res = await fetch(`https://api.apify.com/v2/acts/${actorId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch actor schema" },
        { status: res.status }
      );
    }

    const data = await res.json();
    const inputSchema = data.data?.inputSchema || data.inputSchema || {};

    // Debug logging
    console.log("Actor schema response:", {
      actorId,
      hasInputSchema: !!inputSchema,
      properties: inputSchema.properties
        ? Object.keys(inputSchema.properties)
        : "none",
    });

    return NextResponse.json({
      schema: inputSchema,
      actorName: data.data?.name || data.name || "Unknown Actor",
    });
  } catch (e) {
    console.error("Error fetching actor schema:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
