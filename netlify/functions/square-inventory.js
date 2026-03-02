export default async (req, context) => {
  const token = process.env.SQUARE_ACCESS_TOKEN;
  if (!token) return new Response(JSON.stringify({ error: "No token" }), { status: 500 });

  const isSandbox = (process.env.SQUARE_ENVIRONMENT || '').toLowerCase() === 'sandbox';
  const baseUrl = isSandbox ? "https://connect.squareupsandbox.com" : "https://connect.squareup.com";

  try {
    // 1. Use the Advanced Search API (Postman Pattern)
    const response = await fetch(`${baseUrl}/v2/catalog/search`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "Square-Version": "2023-10-20"
      },
      body: JSON.stringify({
        object_types: ["ITEM"],
        include_related_objects: true // This grabs ALL linked images, options, and modifiers
      })
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Square API error: ${response.status} - ${err}`);
    }

    const data = await response.json();

    // 2. Return the full relational payload
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 
        "Content-Type": "application/json", 
        "Access-Control-Allow-Origin": "*" 
      }
    });
  } catch (error) {
    console.error("Advanced Search Fetch Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};