export default async (req, context) => {
  const token = process.env.SQUARE_ACCESS_TOKEN;
  if (!token) return new Response(JSON.stringify({ error: "No token" }), { status: 500 });

  const isSandbox = (process.env.SQUARE_ENVIRONMENT || '').toLowerCase() === 'sandbox';
  const baseUrl = isSandbox ? "https://connect.squareupsandbox.com" : "https://connect.squareup.com";
  const types = "ITEM,IMAGE,MODIFIER_LIST,ITEM_OPTION,ITEM_OPTION_VAL,CATEGORY";
  const headers = { "Authorization": `Bearer ${token}`, "Square-Version": "2026-01-22" };

  try {
    const counts = {};
    const modifierLists = [];
    const itemsWithModifiers = [];
    let cursor = null;
    let pages = 0;

    do {
      const url = `${baseUrl}/v2/catalog/list?types=${types}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`;
      const response = await fetch(url, { method: "GET", headers });
      if (!response.ok) throw new Error(`Square API error: ${response.status}`);
      const data = await response.json();
      pages++;

      (data.objects || []).forEach(o => {
        counts[o.type] = (counts[o.type] || 0) + 1;

        if (o.type === "MODIFIER_LIST") {
          modifierLists.push({
            id: o.id,
            name: o.modifier_list_data?.name,
            modifier_count: o.modifier_list_data?.modifiers?.length ?? 0,
            modifiers: (o.modifier_list_data?.modifiers || []).map(m => ({
              id: m.id,
              name: m.modifier_data?.name,
              has_image: !!m.modifier_data?.image_id
            }))
          });
        }

        if (o.type === "ITEM" && o.item_data?.modifier_list_info?.length > 0) {
          itemsWithModifiers.push({
            id: o.id,
            name: o.item_data.name,
            modifier_list_info: o.item_data.modifier_list_info
          });
        }
      });

      cursor = data.cursor || null;
    } while (cursor);

    return new Response(JSON.stringify({ pages_fetched: pages, type_counts: counts, modifier_lists: modifierLists, items_with_modifier_list_info: itemsWithModifiers }, null, 2), {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
