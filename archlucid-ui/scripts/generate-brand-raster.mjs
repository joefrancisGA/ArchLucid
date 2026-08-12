/**
 * Rasterize brand SVGs to PNGs referenced by layout.tsx and manifest.webmanifest (TB-252).
 */
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const logoDir = path.resolve(scriptDir, "../public/logo");
const themeBackground = "#1E3A5F";

const targets = [
  {
    source: "archlucid-dark.svg",
    output: "archlucid-dark.png",
    width: 480,
    height: 120,
    fitOnCanvas: false,
  },
  {
    source: "og-default.svg",
    output: "og-default.png",
    width: 1200,
    height: 630,
    fitOnCanvas: true,
  },
  {
    source: "icon.svg",
    output: "icon-192.png",
    width: 192,
    height: 192,
    fitOnCanvas: false,
  },
  {
    source: "icon.svg",
    output: "icon-512.png",
    width: 512,
    height: 512,
    fitOnCanvas: false,
  },
];

async function rasterizeTarget(target) {
  const inputPath = path.join(logoDir, target.source);
  const outputPath = path.join(logoDir, target.output);

  if (target.fitOnCanvas) {
    const resized = await sharp(inputPath)
      .resize(target.width, target.height, { fit: "contain", background: themeBackground })
      .png()
      .toBuffer();

    await sharp({
      create: {
        width: target.width,
        height: target.height,
        channels: 4,
        background: themeBackground,
      },
    })
      .composite([{ input: resized, gravity: "center" }])
      .png()
      .toFile(outputPath);

    return;
  }

  await sharp(inputPath)
    .resize(target.width, target.height, { fit: "cover" })
    .png()
    .toFile(outputPath);
}

async function main() {
  await mkdir(logoDir, { recursive: true });

  for (const target of targets) {
    await rasterizeTarget(target);
    console.log(`Wrote ${target.output}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
