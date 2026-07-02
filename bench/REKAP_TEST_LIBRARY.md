# Rekap Hasil Pengujian Library `pwa-modular-library`

> Dokumen pendukung Skripsi BAB 4 (§4.3, §4.4).

## Metadata Eksekusi

| Item | Nilai |
|------|-------|
| Tanggal eksekusi | 2026-06-14 |
| Commit hash | `9ba8e30` |
| Branch | `main` |
| Runner | Vitest 1.6.1 |
| Environment | happy-dom + fake-indexeddb + MSW |
| Perintah | `npm run test:run`, `npm run test:coverage` |

## Ringkasan Total

| Metrik | Jumlah |
|--------|--------|
| Test file | 18 |
| Total test case | **164** |
| Pass | **164** |
| Fail | **0** |
| Skip | **0** |

> Catatan: muncul keluaran `stderr` selama run (mis. `PWAError: SW_REGISTRATION_ERROR`
> dan `[Vue warn]: onUnmounted ...`). Ini **bukan kegagalan test** — melainkan log
> yang sengaja dipicu oleh skenario uji jalur-error (mis. test "should call onError
> when registration fails") dan peringatan lifecycle Vue di luar `setup()`. Semua
> assertion tetap lulus.

## Tabel Per-File Test

### tests/composables

| File | # test | pass | fail |
|------|:------:|:----:|:----:|
| useBackgroundSync.test.ts | 16 | 16 | 0 |
| useInstallPrompt.test.ts | 15 | 15 | 0 |
| useNotifications.test.ts | 14 | 14 | 0 |
| usePWA.test.ts | 11 | 11 | 0 |
| useCacheConfig.test.ts | 11 | 11 | 0 |
| **Subtotal** | **67** | **67** | **0** |

### tests/cache

| File | # test | pass | fail |
|------|:------:|:----:|:----:|
| rule-registry.test.ts | 16 | 16 | 0 |
| manager.test.ts | 11 | 11 | 0 |
| strategies.test.ts | 10 | 10 | 0 |
| lru.test.ts | 6 | 6 | 0 |
| new-strategies.test.ts | 5 | 5 | 0 |
| **Subtotal** | **48** | **48** | **0** |

### tests/modules

| File | # test | pass | fail |
|------|:------:|:----:|:----:|
| manifest-validator.test.ts | 20 | 20 | 0 |
| registry.test.ts | 8 | 8 | 0 |
| retry-policy.test.ts | 5 | 5 | 0 |
| sw-template.test.ts | 4 | 4 | 0 |
| **Subtotal** | **37** | **37** | **0** |

### tests/core

| File | # test | pass | fail |
|------|:------:|:----:|:----:|
| errors.test.ts | 2 | 2 | 0 |
| **Subtotal** | **2** | **2** | **0** |

### tests/public-api

| File | # test | pass | fail |
|------|:------:|:----:|:----:|
| public-api.test.ts | 2 | 2 | 0 |
| **Subtotal** | **2** | **2** | **0** |

### tests/bundle

| File | # test | pass | fail |
|------|:------:|:----:|:----:|
| bundle.test.ts | 7 | 7 | 0 |
| **Subtotal** | **7** | **7** | **0** |

### tests/version

| File | # test | pass | fail |
|------|:------:|:----:|:----:|
| version.test.ts | 1 | 1 | 0 |
| **Subtotal** | **1** | **1** | **0** |

## Ringkasan Coverage

Coverage keseluruhan (seluruh `src/`):

| Metrik | % |
|--------|:---:|
| Statements | 87.25 |
| Branches | 85.06 |
| Functions | 85.71 |
| Lines | 87.25 |

### Coverage modul backoff (push-sync)

| File | % Stmts | % Branch | % Funcs | % Lines | Baris tak tercover |
|------|:-------:|:--------:|:-------:|:-------:|--------------------|
| retry-policy.ts | 95.91 | 100 | 50 | 95.91 | 48–49 (`wait()`) |
| sync-queue.ts | 96.85 | 86.79 | 93.75 | 96.85 | 76–80, 173–175 |

> `% Funcs = 50` pada `retry-policy.ts` karena fungsi `wait()` (baris 47–49)
> tidak dipanggil pada test; `computeDelay()` tercover penuh.

---

## Verifikasi Backoff (untuk klaim §4.3.5)

**Status: backoff BENAR-BENAR DIPANGGIL dan DITERAPKAN dalam alur flush/retry — bukan kode mati.**

Jejak pemanggilan: `flush()` → `processOne()` → `handleRetry()` → `computeDelay()`.

- `flush()` memfilter entry yang jatuh tempo berdasarkan `nextAttemptAt`
  (`sync-queue.ts:134`):
  ```ts
  const due = pending.filter((r) => r.nextAttemptAt == null || r.nextAttemptAt <= now);
  ```
- Kegagalan retryable di `processOne()` memanggil `handleRetry()` (`sync-queue.ts:188`).
- `handleRetry()` memanggil `computeDelay()` lalu menyetel `nextAttemptAt`
  di masa depan (`sync-queue.ts:232,239`):
  ```ts
  const delay = computeDelay(record.retryCount, this.backoffPolicy);
  ...
  nextAttemptAt: delay > 0 ? now + delay : null,
  ```

Karena `flush()` melewati entry yang `nextAttemptAt`-nya belum jatuh tempo, jeda
backoff yang dihitung `computeDelay()` benar-benar menahan retry (bukan no-op).
Coverage `computeDelay` 95.91% statements / 100% branch mengkonfirmasi kedua cabang
strategi (`linear` & `exponential`) dieksekusi oleh test.
