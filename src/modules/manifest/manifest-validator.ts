/**
 * Manifest Validation — Validasi struktur web app manifest.json.
 *
 * Melaporkan warning (bukan error) untuk field penting yang hilang
 * atau tidak lengkap, agar developer bisa memperbaiki tanpa
 * library gagal inisialisasi (progressive enhancement).
 *
 * @module modules/manifest/manifest-validator
 */

/** Sebuah warning validasi manifest. */
export interface ManifestWarning {
  /** Nama field yang bermasalah. */
  field: string;
  /** Pesan penjelasan. */
  message: string;
}

/** Semua nilai `display` yang diakui oleh spesifikasi web app manifest. */
const VALID_DISPLAY_VALUES = new Set(["fullscreen", "standalone", "minimal-ui", "browser"]);

/**
 * Validasi objek manifest.json dan kembalikan daftar warning.
 *
 * Tidak throw — developer bisa tetap menjalankan app
 * walau manifest tidak sempurna. Library hanya melaporkan.
 *
 * @param manifest - Objek hasil parse JSON dari manifest.json.
 * @returns Daftar warning, array kosong artinya valid.
 *
 * @example
 * ```ts
 * const warnings = validateManifest({
 *   name: "My App",
 *   short_name: "App",
 *   start_url: "/",
 *   display: "standalone",
 *   icons: [
 *     { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
 *     { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
 *   ],
 * });
 * // warnings.length === 0
 * ```
 */
export function validateManifest(manifest: unknown): ManifestWarning[] {
  const warnings: ManifestWarning[] = [];

  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) {
    return [{ field: "*", message: "Manifest harus berupa object — bukan array, null, atau tipe lain." }];
  }

  const m = manifest as Record<string, unknown>;

  // --- name (wajib) ---
  if (typeof m.name !== "string" || m.name.trim().length === 0) {
    warnings.push({ field: "name", message: "Field 'name' wajib diisi agar aplikasi punya nama saat di-install." });
  }

  // --- short_name (disarankan) ---
  if (typeof m.short_name !== "string" || m.short_name.trim().length === 0) {
    warnings.push({
      field: "short_name",
      message: "Field 'short_name' disarankan — digunakan saat nama panjang terpotong (launcher, taskbar).",
    });
  }

  // --- start_url (wajib) ---
  if (typeof m.start_url !== "string" || m.start_url.trim().length === 0) {
    warnings.push({
      field: "start_url",
      message: "Field 'start_url' wajib diisi untuk menentukan halaman awal saat app di-launch.",
    });
  }

  // --- display ---
  if (typeof m.display !== "string" || !VALID_DISPLAY_VALUES.has(m.display)) {
    warnings.push({
      field: "display",
      message: `Field 'display' wajib diisi dan harus salah satu dari: ${[...VALID_DISPLAY_VALUES].join(", ")}.`,
    });
  }

  // --- icons ---
  if (!Array.isArray(m.icons) || m.icons.length === 0) {
    warnings.push({
      field: "icons",
      message: "Minimal sediakan ikon 192x192 dan 512x512 agar PWA bisa di-install di semua platform.",
    });
  } else {
    const icons = m.icons as Array<Record<string, unknown>>;
    const sizes = new Set<string>();

    for (const icon of icons) {
      if (typeof icon.sizes === "string") {
        icon.sizes.split(/\s+/).forEach((s) => sizes.add(s));
      }
    }

    if (!sizes.has("192x192")) {
      warnings.push({
        field: "icons",
        message: "Ikon 192x192 tidak ditemukan di daftar icons. Ini dibutuhkan untuk install prompt Chrome/Android.",
      });
    }

    if (!sizes.has("512x512")) {
      warnings.push({
        field: "icons",
        message: "Ikon 512x512 tidak ditemukan di daftar icons. Ini dibutuhkan untuk splash screen & PWA di desktop.",
      });
    }
  }

  return warnings;
}
