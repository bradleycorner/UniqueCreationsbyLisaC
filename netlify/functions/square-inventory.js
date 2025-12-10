export default async (req, context) => {
  // 1. Debug Logging (Visible in Netlify Function Logs)
  console.log("Inventory function triggered.");
  
  // Normalize environment variable to handle "Sandbox", "sandbox", "DEV ", etc.
  const envVar = (process.env.SQUARE_ENVIRONMENT || '').toLowerCase().trim();
  console.log("Environment Configured:", envVar || "Defaulting to Production");
  
  // Mask the token for logging safety (show last 4 chars)
  const token = process.env.SQUARE_ACCESS_TOKEN ? process.env.SQUARE_ACCESS_TOKEN.trim() : '';
  console.log("Token Exists:", !!token);

  // 2. Security Check
  if (!token) {
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
  // If variable is 'sandbox', use Sandbox URL. Otherwise Production.
  const isSandbox = envVar === 'sandbox';
  const baseUrl = isSandbox 
    ? "https://connect.squareupsandbox.com" 
    : "https://connect.squareup.com";

  console.log(`Connecting to Square API: ${baseUrl}`);

  try {
    // 4. Call Square API
    const response = await fetch(`${baseUrl}/v2/catalog/list?types=ITEM`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "Square-Version": "2023-10-20"
      }
    });

    // 5. Handle Square API Errors (e.g., 401 Unauthorized)
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Square API Error (${response.status}):`, errorText);
      
      // Heuristic help for 401s in logs
      if (response.status === 401) {
          console.error("HINT: A 401 Error usually means your SQUARE_ACCESS_TOKEN does not match the URL.");
          console.error(`Current URL: ${baseUrl}`);
          console.error("Check if you are using a Sandbox Token with a Production URL (or vice versa).");
      }
      
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