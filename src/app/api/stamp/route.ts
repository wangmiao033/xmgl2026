import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get("file") as File;
  const size = Number(form.get("size") || 260);
  const opacity = Number(form.get("opacity") || 0.75);

  if (!file) {
    return NextResponse.json({ error: "missing file" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const image = sharp(buffer);
  const meta = await image.metadata();

  const width = meta.width || 1200;
  const height = meta.height || 1600;

  const seal = await sharp(Buffer.from(`
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <g opacity="${opacity}">
        <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 8}" fill="none" stroke="#d90429" stroke-width="7"/>
        <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 35}" fill="none" stroke="#d90429" stroke-width="2"/>
        <text x="${size / 2}" y="${size * 0.45}" text-anchor="middle" fill="#d90429" font-size="20">广州熊动</text>
        <text x="${size / 2}" y="${size * 0.62}" text-anchor="middle" fill="#d90429" font-size="18">科技有限公司</text>
        <text x="${size / 2}" y="${size * 0.78}" text-anchor="middle" fill="#d90429" font-size="40">★</text>
      </g>
    </svg>
  `)).png().toBuffer();

  const result = await image
    .composite([
      {
        input: seal,
        left: Math.max(width - size - 40, 0),
        top: Math.max(height - size - 40, 0),
      },
    ])
    .png()
    .toBuffer();

  return new NextResponse(result, {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": "attachment; filename=stamp.png",
    },
  });
}
