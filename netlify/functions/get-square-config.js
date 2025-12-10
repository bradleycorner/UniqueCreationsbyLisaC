export default async (req, context) => {
    // 1. Logging for debugging
    console.log("Config requested. Environment:", Deno.env.get("SQUARE_ENVIRONMENT"));

    // 2. Return the public IDs securely
    return new Response(JSON.stringify({
        appId: Deno.env.get("SQUARE_APP_ID"),
        locationId: Deno.env.get("SQUARE_LOCATION_ID")
    }), {
        status: 200,
        headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
        }
    });
};