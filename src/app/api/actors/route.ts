import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { apiKey } = await req.json();
    if (!apiKey) {
      return NextResponse.json({ error: "Missing API key" }, { status: 400 });
    }
    
    // Fetch only user's personal actors
    const res = await fetch("https://api.apify.com/v2/acts?my=1", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    
    if (!res.ok) {
      return NextResponse.json({ error: "Invalid API key or failed to fetch actors" }, { status: res.status });
    }
    
    const data = await res.json();
    // Handle the response structure for personal actors
    const actors = data.actors?.items || data.data || [];
    
    return NextResponse.json({ actors });
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
} 