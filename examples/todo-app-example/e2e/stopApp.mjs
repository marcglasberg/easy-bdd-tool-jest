// Stops the Vite server started by `startApp.mjs`, after the end-to-end tests run.
export default async function stopApp() {
  await globalThis.viteServer?.close();
}
