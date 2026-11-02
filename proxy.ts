import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = new Set(["/api/health", "/favicon.ico", "/robots.txt", "/sitemap.xml"]);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    PUBLIC_PATHS.has(pathname) ||
    pathname.startsWith("/_next/") ||
    (process.env.NODE_ENV !== "production" &&
      !process.env.APP_ACCESS_USERNAME &&
      !process.env.APP_ACCESS_PASSWORD)
  ) {
    return NextResponse.next();
  }

  const username = process.env.APP_ACCESS_USERNAME;
  const password = process.env.APP_ACCESS_PASSWORD;
  if (!username || !password) {
    return new NextResponse("App access credentials are not configured.", {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const authorization = request.headers.get("authorization");
  const [scheme, encoded] = authorization?.split(" ", 2) ?? [];
  if (scheme !== "Basic" || !encoded) {
    return unauthorized();
  }

  let credentials: string;
  try {
    credentials = atob(encoded);
  } catch {
    return unauthorized();
  }

  const separator = credentials.indexOf(":");
  if (
    separator < 0 ||
    credentials.slice(0, separator) !== username ||
    credentials.slice(separator + 1) !== password
  ) {
    return unauthorized();
  }

  return NextResponse.next();
}

function unauthorized() {
  return new NextResponse("Authentication required.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="AI Task Manager", charset="UTF-8"',
      "Cache-Control": "no-store",
    },
  });
}

export const config = {
  matcher: ["/:path*"],
};
