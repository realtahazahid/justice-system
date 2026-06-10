import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/cases/:path*",
    "/clients/:path*",
    "/calendar/:path*",
    "/settings/:path*",
    // Protect API routes but let NextAuth handler pass
    "/api/((?!auth).*)",
  ],
};
