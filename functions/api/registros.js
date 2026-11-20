// Cloudflare Pages Function: GET /api/registros
// Devuelve los pedidos guardados. Protegido con contraseña simple vía header.
// (Alternativa más robusta: usar Cloudflare Access en vez de esto — ver README).

export async function onRequestGet(context) {
  const { request, env } = context;

  const auth = request.headers.get("X-Admin-Password");
  if (!env.ADMIN_PASSWORD || auth !== env.ADMIN_PASSWORD) {
    return new Response(JSON.stringify({ error: "No autorizado" }), { status: 401 });
  }

  const { results } = await env.DB.prepare(
    `SELECT id, nombre, telefono, detalle, ip, pais, ciudad, lat, lng, fecha
     FROM pedidos ORDER BY id DESC LIMIT 200`
  ).all();

  return new Response(JSON.stringify({ registros: results }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
