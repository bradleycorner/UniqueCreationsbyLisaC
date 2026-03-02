export default async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const { sourceId, amount, idempotencyKey } = await req.json();

    // 1. Setup Environment
    const isSandbox = (process.env.SQUARE_ENVIRONMENT || '').toLowerCase() === 'sandbox';
    const baseUrl = isSandbox 
      ? "https://connect.squareupsandbox.com" 
      : "https://connect.squareup.com";

    // 2. Prepare Request to Square
    const paymentBody = {
      source_id: sourceId,
      idempotency_key: idempotencyKey,
      amount_money: {
        amount: amount, // Amount in cents (e.g., 1000 = $10.00)
        currency: "USD"
      },
      location_id: process.env.SQUARE_LOCATION_ID
    };

    // 3. Call Square Payments API
    const response = await fetch(`${baseUrl}/v2/payments`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.SQUARE_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
        "Square-Version": "2023-10-20"
      },
      body: JSON.stringify(paymentBody)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Square Payment Error:", JSON.stringify(data));
      return new Response(JSON.stringify({ error: data.errors?.[0]?.detail || "Payment Failed" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 4. Success!
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Payment Function Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};