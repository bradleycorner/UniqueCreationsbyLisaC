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
    // 4. Call Square API to get ITEM, IMAGE, and MODIFIER_LIST objects
    const response = await fetch(`${baseUrl}/v2/catalog/list?types=ITEM,IMAGE,MODIFIER_LIST`, {
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
    const objects = data.objects || [];

    // DEBUG: Log counts
    console.log(`Fetched ${objects.length} objects.`);
    console.log(`Items: ${objects.filter(o => o.type === 'ITEM').length}`);
    console.log(`Images: ${objects.filter(o => o.type === 'IMAGE').length}`);
    console.log(`Modifier Lists: ${objects.filter(o => o.type === 'MODIFIER_LIST').length}`);

    // 5. Process the data into maps for easy lookup
    const imageMap = objects
      .filter(obj => obj.type === 'IMAGE')
      .reduce((map, img) => {
        map[img.id] = img.image_data.url;
        return map;
      }, {});

    const modifierMap = objects
      .filter(obj => obj.type === 'MODIFIER_LIST')
      .reduce((map, modList) => {
        map[modList.id] = modList;
        return map;
      }, {});

    // 6. Filter for only ITEM objects and enrich them
    const items = objects
      .filter(obj => obj.type === 'ITEM')
      .map(item => {
        const imageId = item.item_data.image_ids?.[0];
        const imageUrl = imageId ? imageMap[imageId] : "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80"; // Fallback

        // Embed the full modifier list objects into the item
        const modifierLists = (item.item_data.modifier_list_info || [])
          .map(info => modifierMap[info.modifier_list_id])
          .filter(Boolean); // Filter out any null/undefined if a modifier wasn't found

        return {
          id: item.id,
          item_data: {
            ...item.item_data,
            modifier_lists: modifierLists // Add the resolved modifier lists
          },
          image_url: imageUrl
        };
      });

    // 7. Success Response
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