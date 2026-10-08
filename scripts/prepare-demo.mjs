import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
const photos = {
  concert: "photo-1492684223066-81342ee5ff30",
  portrait: "photo-1529156069898-49953e39b3ac",
  sport: "photo-1461896836934-ffe607ba8211",
  wedding: "photo-1519741497674-611481863552",
  studio: "photo-1497366811353-6870744d04b2",
};
await mkdir("public/images/demo", { recursive: true });
for (const [name, id] of Object.entries(photos)) {
  const response = await fetch(
    `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1800&q=85`,
  );
  if (!response.ok)
    throw new Error(`Download failed: ${name} ${response.status}`);
  const data = Buffer.from(await response.arrayBuffer());
  await sharp(data)
    .rotate()
    .resize(1600, 1067, { fit: "cover" })
    .webp({ quality: 82 })
    .toFile(`public/images/demo/${name}.webp`);
  await sharp(data)
    .rotate()
    .resize(1024, 683, { fit: "cover" })
    .webp({ quality: 76 })
    .toFile(`public/images/demo/${name}-thumb.webp`);
}
await writeFile(
  "public/images/demo/SOURCES.txt",
  "Stock images from Unsplash, for labelled layout previews only. Not Sutoori client work.\n" +
    Object.entries(photos)
      .map(([name, id]) => `${name}: https://images.unsplash.com/${id}`)
      .join("\n"),
);
