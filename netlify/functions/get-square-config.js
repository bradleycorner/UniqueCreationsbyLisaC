export default async (req, context) => {
    // 1. Logging for debugging
    console.log("Config requested. Environment:", process.env.SQUARE_ENVIRONMENT);

    // 2. Return the public IDs securely
    return new Response(JSON.stringify({
        appId: process.env.SQUARE_APP_ID,
        locationId: process.env.SQUARE_LOCATION_ID
    }), {
        status: 200,
        headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
        }
    });
};