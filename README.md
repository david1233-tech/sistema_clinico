# Sistema Clínico Vital Salud

Aplicación Next.js con acceso para SusanaVital, PilarVital y GabyVital. Los datos se guardan en PostgreSQL de Supabase y se comparten entre dispositivos.

## Preparar Supabase

1. Abre **SQL Editor** en tu proyecto de Supabase.
2. Copia y ejecuta el contenido de [`database/schema-postgres.sql`](database/schema-postgres.sql). El antiguo `database/schema.sql` es solo para MySQL y produce el error `UNSIGNED` en Supabase.
3. En **Connect**, copia la conexión **Transaction pooler** para usarla desde Vercel. Su puerto suele ser `6543`. La conexión directa `db.<project-ref>.supabase.co:5432` puede requerir IPv6, por lo que conviene usar la URL del pooler que Supabase muestre para tu proyecto.
4. Sustituye `[YOUR-PASSWORD]` por la contraseña real de la base. Si contiene caracteres como `@`, `#`, `?`, `&` o espacios, codifícala para URL. No compartas la URL completa ni la subas a GitHub.

La base nueva empieza vacía. Si tienes pacientes en la antigua base MySQL local, hay que exportarlos e importarlos por separado; ejecutar el esquema no copia esos datos.

## Configurar Vercel

En el proyecto abre **Settings → Environment Variables**. Agrega las siguientes variables para **Production**:

| Variable | Valor |
| --- | --- |
| `DATABASE_URL` | URL PostgreSQL completa de **Transaction pooler** de Supabase |
| `AUTH_SECRET` | Cadena aleatoria de 32 bytes o más, distinta de las contraseñas |
| `DOCTORA_PASSWORD` | Contraseña de `SusanaVital` |
| `ENFERMERA_PASSWORD` | Contraseña de `PilarVital` |
| `RECEPCION_PASSWORD` | Contraseña de `GabyVital` |

Genera un `AUTH_SECRET` con `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. Las contraseñas se configuran en Vercel, nunca en el repositorio público. Después de guardar las variables, abre **Deployments** y ejecuta **Redeploy** en el despliegue más reciente. Si el proyecto está conectado a GitHub, Vercel también puede desplegar los cambios nuevos de `main` automáticamente, pero las variables agregadas requieren un despliegue nuevo.

Para la consulta automática de DNI, configura también `RENIEC_API_URL` (URL HTTPS con `{dni}`) y `RENIEC_API_TOKEN` del proveedor. Sin ellos, el formulario permite rellenar los datos a mano.

La URL HTTPS de Vercel se puede instalar como aplicación web desde el navegador del móvil. La información clínica requiere internet y se comparte mediante la misma base Supabase.

## Lectura de fotos del historial en enfermería

Para completar automáticamente el formulario de triaje desde una foto, configura `OPENAI_API_KEY` como variable de entorno del servidor en Vercel y vuelve a desplegar. La imagen se envía al servicio de OpenAI para extraer los valores legibles; no se guarda como adjunto automáticamente. El personal debe revisar y corregir los datos antes de guardar. Opcionalmente, `OPENAI_VISION_MODEL` permite seleccionar otro modelo compatible con imágenes.

## Desarrollo local

Instala dependencias con `npm install` y ejecuta `npm run dev`. Crea `.env.local` con las mismas variables que uses en Vercel. Ese archivo está ignorado por Git. Si deseas mantener la antigua instalación MySQL, usa una versión anterior del proyecto: esta versión usa PostgreSQL.

