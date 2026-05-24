#!/usr/bin/env node
/**
 * Скачивает фотографии с Google Drive в public/photos/.
 *
 * Поддерживает публичные ссылки вида:
 *   https://drive.google.com/file/d/FILE_ID/view?usp=sharing
 *
 * Автоматически обходит экран подтверждения «virus scan warning»,
 * который Google показывает для файлов > 25 МБ.
 *
 * Запуск:
 *   node scripts/fetch-photos.mjs
 * или
 *   npm run fetch:photos
 *
 * Чтобы поменять источники — отредактируйте массив FILES ниже либо
 * передайте их через ENV: PHOTO_1_URL=... PHOTO_2_URL=... npm run fetch:photos
 */

import { writeFile, mkdir, readdir, unlink } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "public", "photos");

// Источники по умолчанию — две фотографии с Drive.
// Каждый элемент: { name, url }. name → имя файла без расширения.
const FILES = [
  {
    name: "photo-1",
    url:
      process.env.PHOTO_1_URL ??
      "https://drive.google.com/file/d/1Z8P8RC_DxGwUi1sabCFtpHFlFiVLtK5v/view?usp=sharing",
  },
  {
    name: "photo-2",
    url:
      process.env.PHOTO_2_URL ??
      "https://drive.google.com/file/d/1gT-s6SaWHEbTYeuOnGFCSgNZ13bOXqt8/view?usp=sharing",
  },
];

const EXT_BY_MIME = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/pjpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
  "image/svg+xml": "svg",
  "image/heic": "heic",
  "image/heif": "heif",
};

/** Извлекает FILE_ID из любой популярной формы ссылки на Google Drive. */
function extractDriveId(input) {
  if (!input) return null;
  // Уже похоже на голый ID
  if (/^[A-Za-z0-9_-]{20,}$/.test(input)) return input;
  const patterns = [
    /\/file\/d\/([A-Za-z0-9_-]+)/,
    /[?&]id=([A-Za-z0-9_-]+)/,
    /\/d\/([A-Za-z0-9_-]+)/,
    /\/uc\?[^#]*?id=([A-Za-z0-9_-]+)/,
  ];
  for (const re of patterns) {
    const m = input.match(re);
    if (m) return m[1];
  }
  return null;
}

/** Угадывает расширение по Content-Type или magic-байтам. */
function pickExtension(contentType, buf) {
  const ct = (contentType || "").toLowerCase().split(";")[0].trim();
  if (EXT_BY_MIME[ct]) return EXT_BY_MIME[ct];
  // Magic bytes
  if (buf.length >= 4) {
    if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
    if (
      buf[0] === 0x89 &&
      buf[1] === 0x50 &&
      buf[2] === 0x4e &&
      buf[3] === 0x47
    )
      return "png";
    if (
      buf.length >= 12 &&
      buf.slice(0, 4).toString("ascii") === "RIFF" &&
      buf.slice(8, 12).toString("ascii") === "WEBP"
    )
      return "webp";
    if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return "gif";
  }
  return "jpg";
}

/**
 * Качает файл с Google Drive, выживая после страницы подтверждения.
 * Возвращает { buffer, contentType }.
 */
async function downloadFromDrive(fileId) {
  const initialUrl = `https://drive.usercontent.google.com/download?id=${fileId}&export=download`;

  // Шаг 1: первый запрос. Маленькие файлы отдадутся сразу,
  // большие → HTML страница с формой подтверждения.
  let res = await fetch(initialUrl, {
    redirect: "follow",
    headers: { "User-Agent": "Mozilla/5.0 (avtomoyka-fetch-photos)" },
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText}`);
  }

  let contentType = res.headers.get("content-type") || "";

  // Если контент-тайп — image/*, можно сразу читать.
  if (!contentType.toLowerCase().startsWith("text/html")) {
    const buffer = Buffer.from(await res.arrayBuffer());
    return { buffer, contentType };
  }

  // Иначе — это страница подтверждения. Найдём токены confirm + uuid.
  const html = await res.text();
  const confirm = html.match(/name="confirm"[^>]*value="([^"]+)"/i)?.[1];
  const uuid = html.match(/name="uuid"[^>]*value="([^"]+)"/i)?.[1];
  // Также бывает <form action="..."> на разные хосты.
  const action = html.match(/<form[^>]+action="([^"]+)"/i)?.[1];

  if (!confirm) {
    throw new Error(
      `Google Drive вернул HTML без формы подтверждения. Возможно, файл недоступен публично или ID неверный.`,
    );
  }

  const params = new URLSearchParams({
    id: fileId,
    export: "download",
    confirm,
  });
  if (uuid) params.set("uuid", uuid);

  const finalUrl = action
    ? action.replace(/&amp;/g, "&") + (action.includes("?") ? "&" : "?") + params
    : `https://drive.usercontent.google.com/download?${params}`;

  res = await fetch(finalUrl, {
    redirect: "follow",
    headers: { "User-Agent": "Mozilla/5.0 (avtomoyka-fetch-photos)" },
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText} на втором шаге`);
  }
  contentType = res.headers.get("content-type") || "";
  const buffer = Buffer.from(await res.arrayBuffer());

  if (contentType.toLowerCase().startsWith("text/html")) {
    throw new Error(
      `Google Drive снова вернул HTML — обход подтверждения не сработал. Откройте файл в браузере и проверьте, что он публично доступен по ссылке.`,
    );
  }

  return { buffer, contentType };
}

/** Удаляет предыдущие версии файла с тем же базовым именем. */
async function cleanOldVariants(dir, baseName) {
  let entries;
  try {
    entries = await readdir(dir);
  } catch {
    return;
  }
  for (const e of entries) {
    const m = e.match(/^(.+)\.([^.]+)$/);
    if (m && m[1] === baseName) {
      await unlink(join(dir, e)).catch(() => {});
    }
  }
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  let ok = 0;
  let failed = 0;

  for (const f of FILES) {
    const id = extractDriveId(f.url);
    if (!id) {
      console.error(`✗ ${f.name}: не удалось распарсить Google Drive ID из «${f.url}»`);
      failed++;
      continue;
    }
    try {
      process.stdout.write(`↓ ${f.name} (id=${id})… `);
      const { buffer, contentType } = await downloadFromDrive(id);
      const ext = pickExtension(contentType, buffer);
      await cleanOldVariants(OUT_DIR, f.name);
      const outPath = join(OUT_DIR, `${f.name}.${ext}`);
      await writeFile(outPath, buffer);
      const kb = (buffer.length / 1024).toFixed(0);
      console.log(`OK → ${outPath.replace(process.cwd() + "/", "")} (${kb} KB)`);
      ok++;
    } catch (err) {
      console.log("FAIL");
      console.error(`   ${err.message}`);
      failed++;
    }
  }

  console.log("");
  console.log(`Готово: ${ok} файл(ов) скачано, ${failed} с ошибкой.`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error("Непредвиденная ошибка:", err);
  process.exit(1);
});
