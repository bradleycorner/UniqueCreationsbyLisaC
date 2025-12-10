export default async (req, context) => {
  // 1. Debug Logging (Visible in Netlify Function Logs)
  console.log("Inventory function triggered.");
  console.log("Environment:", process.env.SQUARE_ENVIRONMENT || "Defaulting to Production");
  console.log("Token Exists:", !!process.env.SQUARE_ACCESS_TOKEN);

  // 2. Security Check
  if (!process.env.SQUARE_ACCESS_TOKEN) {
    console.error("CRITICAL: Missing SQUARE_ACCESS_TOKEN");
    return new Response(JSON.stringify({ 
        error: "Configuration Error", 
        message: "SQUARE_ACCESS_TOKEN is missing in Netlify Site Settings." 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  // 3. Environment Setup
  const isSandbox = process.env.SQUARE_ENVIRONMENT === 'sandbox';
  const baseUrl = isSandbox 
    ? "https://connect.squareupsandbox.com" 
    : "https://connect.squareup.com";

  try {
    // 4. Call Square API
    const response = await fetch(`${baseUrl}/v2/catalog/list?types=ITEM`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${process.env.SQUARE_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
        "Square-Version": "2023-10-20"
      }
    });

    // 5. Handle Square API Errors (e.g., 401 Unauthorized)
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Square API Error (${response.status}):`, errorText);
      
      return new Response(JSON.stringify({ 
          error: "Square API Failed", 
          status: response.status,
          details: errorText 
      }), {
        status: response.status, // Pass the actual status code (e.g. 401) to the frontend
        headers: { "Content-Type": "application/json" }
      });
    }

    const data = await response.json();

    // 6. Success Response
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });

  } catch (error) {
    // 7. Handle Code Crashes
    console.error("Function Crash:", error);
    return new Response(JSON.stringify({ 
        error: "Function Crashed", 
        message: error.message 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};