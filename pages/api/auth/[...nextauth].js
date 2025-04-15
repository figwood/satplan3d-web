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
          
          console.log(`尝试登录: ${credentials.username}, API URL: ${loginUrl}`);

          const form = new FormData();
          form.append('username', credentials.username);
          form.append('password', credentials.password);

          const res = await fetch(loginUrl, {
            method: 'POST',
            body: form
          });

          console.log('登录响应状态:', res.status);
          
          if (!res.ok) {
            console.error(`登录失败: HTTP ${res.status}`);
            return null;
          }
          
          const data = await res.json();
          console.log('登录响应数据:', {
            hasToken: !!data.access_token,
            tokenType: data.token_type,
            tokenLength: data.access_token?.length
          });

          if (data.access_token) {
            // 直接返回原始令牌数据，不做任何修改
            return {
              id: credentials.username,
              name: credentials.username,
              // 存储完整的令牌信息
              access_token: data.access_token,
              token_type: data.token_type || 'Bearer',
              raw_token: data.access_token // 保存一个原始副本
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
    async jwt({ token, user, account }) {
      if (user) {
        // 保持令牌的原始格式
        token.access_token = user.access_token;
        token.raw_token = user.raw_token;
        token.token_type = user.token_type;
        token.user = {
          name: user.name,
          id: user.id
        };
        console.log('JWT回调 - 令牌已更新', {
          hasToken: !!token.access_token,
          tokenType: token.token_type
        });
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        // 使用原始令牌格式
        session.access_token = token.access_token;
        session.token_type = token.token_type;
        session.raw_token = token.raw_token;
        session.user = {
          name: token.user?.name || token.name || "用户",
          id: token.user?.id || token.sub
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
  debug: true // 启用调试以便排查问题
}

export default NextAuth(authOptions)