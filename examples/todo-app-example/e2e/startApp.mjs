import { createServer } from 'vite';

// Serves the app with Vite before the end-to-end tests run. See `stopApp.mjs`.
export default async function startApp() {
  const server = await createServer({ server: { port: 5179, strictPort: true }, logLevel: 'warn' });
  await server.listen();
  globalThis.viteServer = server;

  // The tests read the URL from here.
  process.env.APP_URL = 'http://localhost:5179/';
}
