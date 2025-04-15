import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import FormData from 'form-data'
import fetch from 'node-fetch'

export const authOptions = {
  secret: process.env.NEXTAUTH_SECRET || "your-development-only-secret-key",
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: "用户名", type: "text" },
        password: { label: "密码", type: "password" }
      },
      async authorize(credentials) {
        try {
          const apiUrl = process.env.API_URL || 'http://localhost:8000';
          const loginUrl = `${apiUrl}/api/login`;
          
          const form = new FormData();
          form.append('username', credentials.username);
          form.append('password', credentials.password);

          const res = await fetch(loginUrl, {
            method: 'POST',
            body: form
          });

          if (!res.ok) {
            console.error(`登录失败: HTTP ${res.status}`);
            return null;
          }
          
          const data = await res.json();

          if (data.access_token) {
            return {
              id: credentials.username,
              name: credentials.username,
              access_token: data.access_token,
              token_type: 'Bearer'  // 固定使用Bearer类型
            }
          }

          console.error('登录失败: 无法获取访问令牌');
          return null
        } catch (error) {
          console.error('登录错误:', error)
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
      if (user) {
        // 保存token信息到JWT中
        token.access_token = user.access_token;
        token.token_type = 'Bearer';  // 固定使用Bearer类型
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        // 将token信息添加到session中
        session.access_token = token.access_token;
        session.token_type = 'Bearer';  // 固定使用Bearer类型
        session.user = {
          name: token.name || "用户",
        };
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.includes('/api/auth/callback')) {
        return `${baseUrl}/admin`;
      }
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      if (!url.startsWith(baseUrl)) {
        return baseUrl;
      }
      return url;
    }
  },
  pages: {
    signIn: '/login',
    error: '/login'
  },
  debug: true
}

export default NextAuth(authOptions)