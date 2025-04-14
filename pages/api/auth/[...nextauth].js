import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import FormData from 'form-data'
import fetch from 'node-fetch'

export const authOptions = {
  // 添加 secret 配置（必须）
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
          // 构建登录URL
          const apiUrl = process.env.API_URL || 'http://localhost:8000';
          const loginUrl = `${apiUrl}/api/login`;
          
          console.log(`尝试登录: ${credentials.username}, API URL: ${loginUrl}`);

          // 使用 form-data 库创建正确的 multipart/form-data 请求
          const form = new FormData();
          form.append('username', credentials.username);
          form.append('password', credentials.password);

          // 发送请求
          const res = await fetch(loginUrl, {
            method: 'POST',
            body: form
          });

          console.log('登录响应状态:', res.status);
          
          // 确保响应有效
          if (!res.ok) {
            console.error(`登录失败: HTTP ${res.status}`);
            return null;
          }
          
          const data = await res.json();
          console.log('登录响应数据:', data);

          if (data.access_token) {
            return {
              id: credentials.username,
              name: credentials.username,
              accessToken: data.access_token,
            }
          }

          console.error('登录失败:', data);
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
      // 保持现有的 token 数据
      if (user) {
        token.accessToken = user.accessToken;
        token.user = {
          name: user.name,
          id: user.id
        };
      }
      return token;
    },
    async session({ session, token }) {
      // 确保 session.user 存在
      session.user = session.user || {};
      
      // 添加访问令牌到会话中
      if (token) {
        session.accessToken = token.accessToken;
        session.user = {
          name: token.user?.name || token.name || "用户",
          id: token.user?.id || token.sub
        };
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