import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import cloudinary from "@/lib/cloudinary";

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

async function verifyMagicBytes(file: File): Promise<boolean> {
  const buf = Buffer.from(await file.slice(0, 12).arrayBuffer());
  const jpeg = buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF;
  const png  = buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47;
  // WebP: "RIFF" at 0-3 and "WEBP" at 8-11
  const webp =
    buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
    buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50;

  if (file.type === "image/jpeg") return jpeg;
  if (file.type === "image/png")  return png;
  if (file.type === "image/webp") return webp;
  return false;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("image") as File | null;

  if (!file)                          return NextResponse.json({ error: "No file uploaded." },                               { status: 400 });
  if (!ALLOWED.includes(file.type))   return NextResponse.json({ error: "Only JPEG, PNG, or WEBP images are accepted." },   { status: 400 });
  if (file.size > MAX_SIZE)           return NextResponse.json({ error: "File must be under 10 MB." },                       { status: 400 });
  if (!await verifyMagicBytes(file))  return NextResponse.json({ error: "File content does not match its declared type." }, { status: 400 });

  const bytes  = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const uploaded = await new Promise<{ secure_url: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "ruya", resource_type: "image" },
      (err, result) => (err || !result ? reject(err) : resolve(result as { secure_url: string }))
    );
    stream.end(buffer);
  });

  return NextResponse.json({ url: uploaded.secure_url });
}
