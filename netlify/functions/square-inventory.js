export default async (req, context) => {
  const token = process.env.SQUARE_ACCESS_TOKEN;
  if (!token) return new Response(JSON.stringify({ error: "No token" }), { status: 500 });

  const isSandbox = (process.env.SQUARE_ENVIRONMENT || '').toLowerCase() === 'sandbox';
  const baseUrl = isSandbox ? "https://connect.squareupsandbox.com" : "https://connect.squareup.com";
  const types = "ITEM,IMAGE,MODIFIER_LIST,ITEM_OPTION,ITEM_OPTION_VAL,CATEGORY";
  const headers = {
    "Authorization": `Bearer ${token}`,
    "Square-Version": "2026-01-22"
  };

  try {
    // catalog/list is paginated (100 objects per page). Collect all pages before returning.
    const allObjects = [];
    let cursor = null;

    do {
      const url = `${baseUrl}/v2/catalog/list?types=${types}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`;
      const response = await fetch(url, { method: "GET", headers });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`Square API error: ${response.status} - ${err}`);
      }

      const data = await response.json();
      if (data.objects) allObjects.push(...data.objects);
      cursor = data.cursor || null;
    } while (cursor);

    return new Response(JSON.stringify({ objects: allObjects }), {
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
