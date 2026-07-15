import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const match = request.nextUrl.pathname.match(/^\/portal\/invite\/(.+)$/);
  if (!match) return NextResponse.next();
  const url = request.nextUrl.clone();
  url.pathname = `/portal-invite/${match[1]}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/portal/invite/:token*"]
};
