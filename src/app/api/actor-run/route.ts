import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { apiKey, actorId, input } = await req.json();

    // Debug logging
    console.log("Actor run request:", {
      apiKey: apiKey ? "***" : "missing",
      actorId,
      input,
      inputKeys: Object.keys(input || {}),
    });

    if (!apiKey || !actorId) {
      return NextResponse.json(
        { error: "Missing API key or actor ID" },
        { status: 400 }
      );
    }

    // Ensure input is not null
    const actorInput = input || {};

    // Run the actor with provided input
    const runResponse = await fetch(
      `https://api.apify.com/v2/acts/${actorId}/runs`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(actorInput),
      }
    );

    if (!runResponse.ok) {
      return NextResponse.json(
        { error: "Failed to start actor run" },
        { status: runResponse.status }
      );
    }

    const runData = await runResponse.json();
    const runId = runData.data?.id;

    if (!runId) {
      return NextResponse.json(
        { error: "No run ID returned" },
        { status: 500 }
      );
    }

    // Poll for completion (wait up to 2 minutes)
    let attempts = 0;
    const maxAttempts = 24; // 24 * 5 seconds = 2 minutes

    while (attempts < maxAttempts) {
      const statusResponse = await fetch(
        `https://api.apify.com/v2/actor-runs/${runId}`,
        {
          headers: { Authorization: `Bearer ${apiKey}` },
        }
      );

      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        const status = statusData.data?.status;

        if (status === "SUCCEEDED") {
          // Fetch the results with limit to prevent large responses
          const resultsResponse = await fetch(
            `https://api.apify.com/v2/datasets/${statusData.data.defaultDatasetId}/items?limit=5`,
            {
              headers: { Authorization: `Bearer ${apiKey}` },
            }
          );

          if (resultsResponse.ok) {
            const results = await resultsResponse.json();

            // Trim large content in each result item
            const trimmedResults = (results || []).map(
              (item: any, index: number) => {
                const trimmedItem: any = {};

                for (const [key, value] of Object.entries(item)) {
                  if (typeof value === "string") {
                    // Limit string fields to 5000 characters
                    if (value.length > 5000) {
                      trimmedItem[key] =
                        value.substring(0, 5000) +
                        `\n\n... (truncated, original length: ${value.length} characters)`;
                    } else {
                      trimmedItem[key] = value;
                    }
                  } else if (Array.isArray(value)) {
                    // Limit arrays to first 3 items
                    trimmedItem[key] =
                      value.length > 3
                        ? [
                            ...value.slice(0, 3),
                            `... (${value.length - 3} more items truncated)`,
                          ]
                        : value;
                  } else {
                    trimmedItem[key] = value;
                  }
                }

                return {
                  ...trimmedItem,
                  _itemIndex: index + 1,
                  _note:
                    index === 0 && results.length > 1
                      ? `Showing ${Math.min(5, results.length)} of ${
                          results.length
                        } total results`
                      : undefined,
                };
              }
            );

            return NextResponse.json({
              status: "SUCCEEDED",
              runId,
              results: trimmedResults,
              totalResults: results.length,
              note:
                results.length > 5
                  ? "Results limited to 5 items for display"
                  : undefined,
            });
          }
        } else if (
          status === "FAILED" ||
          status === "ABORTED" ||
          status === "TIMED-OUT"
        ) {
          return NextResponse.json({
            status,
            runId,
            error: `Actor run ${status.toLowerCase()}`,
            results: [],
          });
        }
      }

      // Wait 5 seconds before next check
      await new Promise((resolve) => setTimeout(resolve, 5000));
      attempts++;
    }

    // Timeout - return partial info
    return NextResponse.json({
      status: "RUNNING",
      runId,
      message: "Actor is still running. Check back later.",
      results: [],
    });
  } catch (e) {
    console.error("Error running actor:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
