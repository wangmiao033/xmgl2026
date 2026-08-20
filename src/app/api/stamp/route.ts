import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get("file") as File;

  if (!file) {
    return NextResponse.json({ error: "missing file" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const image = sharp(buffer);
  const meta = await image.metadata();

  const width = meta.width || 1000;
  const height = meta.height || 1000;

  const stampSvg = `
  <svg width="260" height="260" xmlns="http://www.w3.org/2000/svg">
    <circle cx="130" cy="130" r="110" fill="none" stroke="red" stroke-width="8"/>
    <text x="130" y="125" text-anchor="middle" font-size="22" fill="red">广州熊动</text>
    <text x="130" y="160" text-anchor="middle" font-size="18" fill="red">科技有限公司</text>
  </svg>`;

  const result = await image
    .composite([
      {
        input: Buffer.from(stampSvg),
        left: Math.max(width - 280, 0),
        top: Math.max(height - 280, 0),
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
