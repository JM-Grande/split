import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const token = requestUrl.searchParams.get("token");
  const baseUrl = requestUrl.origin;

  if (!token) {
    return NextResponse.redirect(`${baseUrl}/login?error=MissingToken`);
  }

  const verificationToken = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (!verificationToken) {
    // If the token is invalid or was already consumed (e.g., by an email client pre-fetching the link),
    // we redirect to the login page. The user might already be verified.
    return NextResponse.redirect(`${baseUrl}/login?error=InvalidToken`);
  }

  if (new Date() > verificationToken.expires) {
    return NextResponse.redirect(`${baseUrl}/login?error=TokenExpired`);
  }

  // Update user and delete token
  await prisma.user.update({
    where: { email: verificationToken.email },
    data: { emailVerified: new Date() },
  });

  await prisma.verificationToken.delete({
    where: { id: verificationToken.id },
  });

  return NextResponse.redirect(`${baseUrl}/login?verified=true`);
}
