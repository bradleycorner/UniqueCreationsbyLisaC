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
    // 4. Call Square API - Using Search to get better control and related objects
    const response = await fetch(`${baseUrl}/v2/catalog/search`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "Square-Version": "2023-10-20"
      },
      body: JSON.stringify({
        object_types: ["ITEM"],
        include_related_objects: true // CRITICAL: This pulls in the IMAGE and MODIFIER objects
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Square API Error (${response.status}):`, errorText);
      return new Response(JSON.stringify({ error: "Square API Failed", details: errorText }), { status: response.status });
    }

    const data = await response.json();
    const objects = data.objects || [];
    const relatedObjects = data.related_objects || [];

    // 5. Process the data into maps for easy lookup
    const imageMap = relatedObjects
      .filter(obj => obj.type === 'IMAGE')
      .reduce((map, img) => {
        map[img.id] = img.image_data.url;
        return map;
      }, {});

    const modifierMap = relatedObjects
      .filter(obj => obj.type === 'MODIFIER_LIST')
      .reduce((map, modList) => {
        map[modList.id] = modList;
        return map;
      }, {});

    // 6. Enrichment
    const enrichedItems = objects.map(item => {
      // Embed the full modifier list objects into the item
      const modifierLists = (item.item_data.modifier_list_info || [])
        .map(info => modifierMap[info.modifier_list_id])
        .filter(Boolean);

      return {
        ...item,
        item_data: {
          ...item.item_data,
          modifier_lists: modifierLists
        }
      };
    });

    // 7. Success Response - Return the full data for the frontend to map
    return new Response(JSON.stringify({ 
      objects: enrichedItems,
      related_objects: relatedObjects // Send related objects so frontend can find all images
    }), {
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