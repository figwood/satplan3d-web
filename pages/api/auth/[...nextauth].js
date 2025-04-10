import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: "用户名", type: "text" },
        password: { label: "密码", type: "password" }
      },
      async authorize(credentials) {
        try {
          const formData = new URLSearchParams();
          formData.append('username', credentials.username);
          formData.append('password', credentials.password);

          const res = await fetch(`${process.env.API_URL}/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formData
          })

          const data = await res.json()

          if (res.ok && data.access_token) {
            return {
              id: credentials.username,
              name: credentials.username,
              accessToken: data.access_token,
            }
          }

          console.error('Login failed:', data);
          return null
        } catch (error) {
          console.error('Login error:', error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60 // 24 hours
  },
  callbacks: {
    async jwt({ token, user }) {
      // 保持现有的 token 数据
      if (user) {
        token.accessToken = user.accessToken;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.accessToken = token.accessToken;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // 如果是登录回调，直接重定向到管理页面
      if (url.includes('/api/auth/callback')) {
        return `${baseUrl}/admin`;
      }
      // 如果是相对路径，添加基础URL
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      // 如果URL不是以基础URL开头，则返回基础URL
      if (!url.startsWith(baseUrl)) {
        return baseUrl;
      }
      return url;
    }
  },
  pages: {
    signIn: '/login',
    error: '/login'
  }
}

export default NextAuth(authOptions)