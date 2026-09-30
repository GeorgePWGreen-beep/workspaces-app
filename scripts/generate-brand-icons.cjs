/* eslint-disable @typescript-eslint/no-require-imports */
// Deterministic exports from the same vector geometry and CSS tokens as the UI.
const fs = require("node:fs");
const path = require("node:path");
const sharp = require("sharp");
const geometry = require("../lib/brand-mark.json");
const root = path.resolve(__dirname, "..");
const css = fs.readFileSync(path.join(root, "app/globals.css"), "utf8");
function token(name) {
  const value = css.match(new RegExp(`--${name}:\\s*(#[a-fA-F0-9]{6});`))?.[1];
  if (!value) throw new Error(`Missing brand token: ${name}`);
  return value;
}
const red = token("hs-brand-red"), ink = token("hs-brand-on-red");
function svg(square = false) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="${geometry.viewBox}"><rect width="64" height="64" rx="${square ? 0 : geometry.radius}" fill="${red}"/><g fill="none" stroke="${ink}" stroke-width="${geometry.strokeWidth}" stroke-linecap="round" stroke-linejoin="round">${geometry.paths.map(d => `<path d="${d}"/>`).join("")}</g></svg>\n`;
}
async function png(size, square = false) {
  return sharp(Buffer.from(svg(square)), { density: 768 }).resize(size, size).png().toBuffer();
}
async function main() {
  const directory = path.join(root, "public/brand");
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, "hot-seats.svg"), svg());
  for (const size of [192, 512]) fs.writeFileSync(path.join(directory, `icon-${size}.png`), await png(size));
  // Solid background, no pre-rounded mask, chair entirely inside the central safe circle.
  fs.writeFileSync(path.join(directory, "icon-maskable-512.png"), await png(512, true));
  fs.writeFileSync(path.join(root, "app/apple-icon.png"), await png(180, true));
  const sizes = [16, 32, 48];
  const images = await Promise.all(sizes.map(size => png(size)));
  const header = Buffer.alloc(6 + images.length * 16);
  header.writeUInt16LE(1, 2); header.writeUInt16LE(images.length, 4);
  let offset = header.length;
  images.forEach((image, index) => {
    const entry = 6 + index * 16;
    header[entry] = sizes[index]; header[entry + 1] = sizes[index];
    header.writeUInt16LE(1, entry + 4); header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(image.length, entry + 8); header.writeUInt32LE(offset, entry + 12);
    offset += image.length;
  });
  fs.writeFileSync(path.join(root, "app/favicon.ico"), Buffer.concat([header, ...images]));
  console.log("Generated SVG, 16/32/48 favicon, Apple 180, PWA 192/512 and maskable 512 icons.");
}
main().catch(error => { console.error(error); process.exitCode = 1; });
