// Service worker no-op untuk situs dokumentasi.
// Tujuan: memungkinkan demo usePWA menampilkan registrasi yang nyata.
// TIDAK ada handler fetch → tidak meng-cache apa pun (tidak mengganggu docs).
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
