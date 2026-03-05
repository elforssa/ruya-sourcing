import { prisma } from "@/lib/prisma";

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: string,
  link?: string
) {
  try {
    return await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        link: link ?? null,
      },
    });
  } catch (err) {
    console.error("[notifications] createNotification error:", err);
  }
}
