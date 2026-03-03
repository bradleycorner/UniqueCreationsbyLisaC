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
    const itemOptions = [];
    const itemsWithModifiers = [];
    const itemsWithOptions = [];
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

        if (o.type === "ITEM_OPTION") {
          itemOptions.push({
            id: o.id,
            name: o.item_option_data?.name,
            display_name: o.item_option_data?.display_name,
            values: (o.item_option_data?.values || []).map(v => ({
              id: v.id,
              name: v.item_option_value_data?.name,
              has_image: !!v.item_option_value_data?.image_ids?.length
            }))
          });
        }

        if (o.type === "ITEM") {
          if (o.item_data?.modifier_list_info?.length > 0) {
            itemsWithModifiers.push({
              id: o.id,
              name: o.item_data.name,
              modifier_list_info: o.item_data.modifier_list_info
            });
          }
          if (o.item_data?.item_options?.length > 0) {
            itemsWithOptions.push({
              id: o.id,
              name: o.item_data.name,
              item_options: o.item_data.item_options,
              sample_variation_option_values: (o.item_data.variations || []).slice(0, 3).map(v => ({
                variation_name: v.item_variation_data?.name,
                item_option_values: v.item_variation_data?.item_option_values
              }))
            });
          }
        }
      });

      cursor = data.cursor || null;
    } while (cursor);

    return new Response(JSON.stringify({
      pages_fetched: pages,
      type_counts: counts,
      modifier_lists: modifierLists,
      item_options: itemOptions,
      items_with_modifier_list_info: itemsWithModifiers,
      items_with_item_options: itemsWithOptions
    }, null, 2), {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
