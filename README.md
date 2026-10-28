This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

Deploy this project as a Next.js application. Its `/api/*` routes require a server at request time.

Configure these environment variables in Vercel for the target environment:

You can use a single `DATABASE_URL` (or Railway's `MYSQL_PUBLIC_URL`) in `mysql://user:password@host:port/database` format instead of the five `DB_*` variables below. The URL must point to a publicly reachable MySQL endpoint when the app runs on Vercel.

| Variable | Description |
| --- | --- |
| `DB_HOST` | Hostname of a MySQL server reachable from Vercel |
| `DB_PORT` | MySQL port (usually `3306`) |
| `DB_USER` | MySQL username |
| `DB_PASSWORD` | MySQL password |
| `DB_NAME` | Database name |
| `AUTH_SECRET` | Long random value used to sign the seven-day login session |
| `DOCTORA_PASSWORD` | Password for `SusanaVital` |
| `ENFERMERA_PASSWORD` | Password for `PilarVital` |
| `RECEPCION_PASSWORD` | Password for `GabyVital` |

The local defaults are `localhost:3306`, user `root`, an empty password, and database `clinica_db`. A database running only on your computer cannot be reached from Vercel. For a new remote database, run `database/schema.sql`. For a database with the older `citas` and `pagos` tables, run `database/migrate-existing.sql` first and then `database/schema.sql`. The legacy migration has already been applied to the local `clinica_db` database. After configuring Vercel and migrating its database, redeploy. Do not run the legacy migration twice because it adds columns.

For automatic patient name lookup by DNI, configure `RENIEC_API_URL` as an HTTPS URL containing `{dni}` and `RENIEC_API_TOKEN` with the provider's bearer token. For example, the URL setting should have the shape `https://provider.example/lookup/{dni}`. The provider must return JSON with `nombreCompleto`, or `nombres`, `apellidoPaterno`, and `apellidoMaterno`; an optional `data` wrapper is accepted. Optional `direccion` and `genero` fields also fill the form. The token stays on the server. If no provider is configured or it fails, staff can complete the patient form manually.

Patient records, payments, consultations, appointments, internamientos and vitamin treatments now require a successful database write before the UI reports success. Browser `localStorage` is used only for the selected patient and session display state; it is not the clinical database. Existing records previously held only in a server's memory cannot be recovered after that server has restarted.

All three accounts use the same server and database, so records entered on one device are visible from another after its next data refresh. The three passwords and `AUTH_SECRET` must be set in Vercel before anyone can sign in; do not reuse the old passwords that were previously embedded in the browser code. The server sets an HTTP-only session cookie and checks the user's role on protected pages and API routes.

### Base MySQL remota

### Actualizar las claves en Vercel

En el proyecto de Vercel abre **Settings → Environment Variables** y agrega `DOCTORA_PASSWORD`, `ENFERMERA_PASSWORD`, `RECEPCION_PASSWORD` y `AUTH_SECRET` al entorno **Production**. Usa `SusanaVital`, `PilarVital` y `GabyVital` como nombres de usuario; el sistema también acepta las variantes anteriores con otras mayúsculas. `AUTH_SECRET` debe ser un valor aleatorio largo, distinto de las contraseñas. Puedes generarlo con `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. Después abre **Deployments**, selecciona el último despliegue y pulsa **Redeploy**: los cambios en variables se aplican a un despliegue nuevo. El repositorio público no contiene las contraseñas.

Para guardar y compartir datos entre dispositivos, configura también `DATABASE_URL` con una base MySQL remota e instala `database/schema.sql` en ella. Un MySQL que solo corre en la computadora local no estará disponible para Vercel.

Una opción es [Railway MySQL](https://docs.railway.com/databases/mysql). Crea un servicio MySQL, habilita **Public Access** en Networking y copia su `MYSQL_PUBLIC_URL` a la variable `DATABASE_URL` de Vercel. Ejecuta `database/schema.sql` en esa base nueva antes de usar la aplicación. Si importas una base anterior, ejecuta primero `database/migrate-existing.sql`. Mantén cualquier exportación con datos de pacientes fuera de GitHub.

Gaby registra citas y pagos desde su sesión de recepción. Doctora puede consultar esas mismas citas y pagos desde otro dispositivo; enfermera comparte la misma base para pacientes y triajes. Cada sesión conserva los permisos de su rol. La base local de la PC no se sincroniza automáticamente con la remota: para conservar sus registros anteriores, importa un respaldo de MySQL directamente al proveedor remoto.

The Vercel HTTPS link can be installed as a mobile PWA from the login page or the browser's menu. This is not an Android APK. The PWA requires internet access for clinical records because they are stored on the server. A separate native Android build and a suitable web bundle would be required for an APK; the current server-based Next.js build does not produce the `out` directory configured for Capacitor.

