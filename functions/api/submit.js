// Cloudflare Pages Function: POST /api/submit
// Recibe el pedido del cliente, guarda IP + ubicación (si la compartió) en D1,
// y te manda un correo con Resend.

export async function onRequestPost(context) {
  const { request, env } = context;

  let data;
  try {
    data = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "JSON inválido" }), { status: 400 });
  }

  const nombre = (data.nombre || "").toString().slice(0, 200);
  const telefono = (data.telefono || "").toString().slice(0, 100);
  const detalle = (data.detalle || "").toString().slice(0, 1000);
  const lat = typeof data.lat === "number" ? data.lat : null;
  const lng = typeof data.lng === "number" ? data.lng : null;

  if (!nombre || !telefono) {
    return new Response(JSON.stringify({ error: "Faltan campos requeridos" }), { status: 400 });
  }

  // La IP real del cliente, inyectada automáticamente por Cloudflare.
  const ip = request.headers.get("CF-Connecting-IP") || "desconocida";
  // Cloudflare también da país/ciudad aproximados por geo-IP, sin pedir permiso al navegador.
  const country = request.cf?.country || null;
  const city = request.cf?.city || null;
  const fecha = new Date().toISOString();

  // 1) Guardar en D1
  try {
    await env.DB.prepare(
      `INSERT INTO pedidos (nombre, telefono, detalle, ip, pais, ciudad, lat, lng, fecha)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(nombre, telefono, detalle, ip, country, city, lat, lng, fecha)
      .run();
  } catch (err) {
    return new Response(JSON.stringify({ error: "Error guardando el registro" }), { status: 500 });
  }

  // 2) Enviar correo con Resend (requiere RESEND_API_KEY y TO_EMAIL como variables/secrets)
  if (env.RESEND_API_KEY && env.TO_EMAIL) {
    const mapsLink = lat && lng ? `https://maps.google.com/?q=${lat},${lng}` : "No compartida";
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: env.FROM_EMAIL || "pedidos@tu-dominio.com",
          to: env.TO_EMAIL,
          subject: `Nuevo pedido de ${nombre}`,
          html: `
            <h2>Nuevo pedido</h2>
            <p><b>Nombre:</b> ${nombre}</p>
            <p><b>Teléfono:</b> ${telefono}</p>
            <p><b>Detalle:</b> ${detalle}</p>
            <p><b>IP:</b> ${ip}</p>
            <p><b>País/Ciudad (aprox., por IP):</b> ${country || "?"} / ${city || "?"}</p>
            <p><b>Ubicación compartida por el cliente:</b> ${mapsLink}</p>
            <p><b>Fecha:</b> ${fecha}</p>
          `,
        }),
      });
    } catch (err) {
      // No bloqueamos la respuesta al cliente si falla el correo; el registro ya quedó guardado.
      console.error("Error enviando email", err);
    }
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
