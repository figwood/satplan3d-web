import { withAuth } from "next-auth/middleware"

export default withAuth({
  callbacks: {
    authorized: ({ req, token }) => {
      const path = req.nextUrl.pathname
      if (path.startsWith('/admin')) {
        return token !== null
      }
      return true
    }
  }
})

export const config = {
  matcher: ['/admin/:path*']
}