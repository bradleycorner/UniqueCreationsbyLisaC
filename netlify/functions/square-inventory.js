export default async (req, context) => {
  const token = process.env.SQUARE_ACCESS_TOKEN;
  if (!token) return new Response(JSON.stringify({ error: "No token" }), { status: 500 });

  const isSandbox = (process.env.SQUARE_ENVIRONMENT || '').toLowerCase() === 'sandbox';
  const baseUrl = isSandbox ? "https://connect.squareupsandbox.com" : "https://connect.squareup.com";

  try {
    // 1. Fetch Items, Images, Modifiers, Options, and Categories
    const response = await fetch(`${baseUrl}/v2/catalog/list?types=ITEM,IMAGE,MODIFIER_LIST,ITEM_OPTION,CATEGORY`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "Square-Version": "2023-10-20"
      }
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Square API error: ${response.status} - ${err}`);
    }

    const data = await response.json();

    // 2. Return the full payload for the frontend mapper
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 
        "Content-Type": "application/json", 
        "Access-Control-Allow-Origin": "*" 
      }
    });
  } catch (error) {
    console.error("Inventory Fetch Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};