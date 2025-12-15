// app/api/classify/route.ts

const DEFAULT_API_BASE = "https://cim-backend.vercel.app";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const description = typeof body?.description === "string" ? body.description : "";

    if (!description || description.trim().length < 20) {
      return new Response(
        JSON.stringify({
          error: "Please include at least two detailed sentences about the company.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const apiBase = (process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_BASE).replace(/\/$/, "");
    const response = await fetch(`${apiBase}/classify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description }),
    });

    const text = await response.text();

    if (!response.ok) {
      let message = "Our AI helper isn't available right now. Please try again shortly.";
      try {
        const errorPayload = JSON.parse(text);
        if (typeof errorPayload?.error === "string") {
          message = errorPayload.error;
        }
      } catch (err) {
        // Ignore JSON parse errors here; fall back to the friendly message above.
      }

      return new Response(JSON.stringify({ error: message }), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      const data = JSON.parse(text);
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (parseError) {
      return new Response(
        JSON.stringify({
          error: "We received an unexpected reply from the AI helper. Please try again after a moment.",
        }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "We couldn't finish that request. Please try again in a few seconds." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
