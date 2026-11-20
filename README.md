# Mi Sitio — Pedidos con ubicación opcional + panel admin

## Estructura
- `public/index.html` → página pública con el formulario (pide ubicación con consentimiento del cliente).
- `public/admin.html` → panel protegido con login (contraseña) para ver los pedidos.
- `functions/api/submit.js` → recibe el pedido, guarda en D1, envía email con Resend.
- `functions/api/registros.js` → devuelve los pedidos guardados (requiere contraseña).
- `schema.sql` → estructura de la base de datos D1.
- `wrangler.toml` → configuración del proyecto.

## Pasos para desplegar

### 1. Instalar Wrangler (CLI de Cloudflare)
```
npm install -g wrangler
wrangler login
```

### 2. Crear la base de datos D1
```
wrangler d1 create mi_sitio_db
```
Copia el `database_id` que te devuelve y pégalo en `wrangler.toml` donde dice `REEMPLAZA_CON_TU_DATABASE_ID`.

### 3. Crear la tabla
```
wrangler d1 execute mi_sitio_db --file=./schema.sql --remote
```

### 4. Crear cuenta en Resend (para el envío de correos)
1. Ve a https://resend.com y crea una cuenta gratis.
2. Verifica un dominio tuyo (o usa el dominio de prueba que te dan para empezar).
3. Genera una API Key.

### 5. Configurar variables de entorno (secrets) del proyecto
```
wrangler pages secret put RESEND_API_KEY
wrangler pages secret put TO_EMAIL        # tu correo, ej: tunegocio@gmail.com
wrangler pages secret put FROM_EMAIL      # ej: pedidos@tudominio.com
wrangler pages secret put ADMIN_PASSWORD  # la contraseña para entrar al panel /admin.html
```

### 6. Desplegar
```
wrangler pages deploy public --project-name=mi-sitio
```
Wrangler detecta automáticamente la carpeta `functions/` y la despliega junto con el sitio.

### 7. Probar
- Abre la URL que te da Wrangler → deberías ver el formulario de pedido.
- Haz un pedido de prueba marcando la casilla de ubicación → acepta el permiso del navegador.
- Revisa tu correo (debería llegar la notificación).
- Entra a `tu-sitio.pages.dev/admin.html`, pon la contraseña que configuraste, y deberías ver el registro guardado.

## Notas importantes

- **El checkbox + el popup del navegador son obligatorios.** No se puede ni se debe pedir la ubicación sin que el cliente lo autorice explícitamente; si no acepta, el formulario sigue funcionando igual, solo sin coordenadas.
- **La IP y el país/ciudad aproximados** se capturan automáticamente del request (vía Cloudflare), sin pedir permiso — son datos técnicos normales de cualquier servidor web. Aun así, menciónalo en tu política de privacidad si publicas una.
- **Seguridad del panel:** esta versión usa una contraseña simple guardada como secret. Para algo más robusto (sin tocar código), activa **Cloudflare Access** en el dashboard y protege la ruta `/admin.html` con tu correo — Cloudflare se encarga del login completo.
- **Activa también Cloudflare Web Analytics** (gratis, un script en el `<head>`) si además quieres ver de dónde viene todo tu tráfico en general, no solo el de quienes hacen un pedido.
