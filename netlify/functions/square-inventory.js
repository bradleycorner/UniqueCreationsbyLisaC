export default async (req, context) => {
  // 1. Debug Logging
  console.log("Inventory function triggered.");
  const envVar = (process.env.SQUARE_ENVIRONMENT || '').toLowerCase().trim();
  const token = process.env.SQUARE_ACCESS_TOKEN ? process.env.SQUARE_ACCESS_TOKEN.trim() : '';

  // 2. Security Check
  if (!token) {
    console.error("CRITICAL: Missing SQUARE_ACCESS_TOKEN");
    return new Response(JSON.stringify({ error: "Configuration Error" }), { status: 500 });
  }

  // 3. Environment Setup
  const isSandbox = envVar === 'sandbox';
  const baseUrl = isSandbox 
    ? "https://connect.squareupsandbox.com" 
    : "https://connect.squareup.com";

  try {
    // 4. Call Square API to get both ITEM and IMAGE objects
    const response = await fetch(`${baseUrl}/v2/catalog/list?types=ITEM,IMAGE`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "Square-Version": "2023-10-20"
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Square API Error (${response.status}):`, errorText);
      return new Response(JSON.stringify({ error: "Square API Failed", details: errorText }), { status: response.status });
    }

    const data = await response.json();

    // 5. Process the data
    const objects = data.objects || [];
    
    // Create a map of image IDs to URLs
    const imageMap = objects
      .filter(obj => obj.type === 'IMAGE')
      .reduce((map, img) => {
        map[img.id] = img.image_data.url;
        return map;
      }, {});

    // Filter for only ITEM objects and enrich them with image URLs
    const items = objects
      .filter(obj => obj.type === 'ITEM')
      .map(item => {
        const imageId = item.item_data.image_ids?.[0];
        const imageUrl = imageId ? imageMap[imageId] : "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80"; // Fallback
        
        return {
          ...item,
          image_url: imageUrl // Add the image URL to the item object
        };
      });

    // 6. Success Response
    return new Response(JSON.stringify({ objects: items }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });

  } catch (error) {
    console.error("Function Crash:", error);
    return new Response(JSON.stringify({ error: "Function Crashed", message: error.message }), { status: 500 });
  }
};