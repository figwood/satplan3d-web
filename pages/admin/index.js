import { useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import {
  Box,
  Container,
  AppBar,
  Toolbar,
  Typography,
  Button,
  CircularProgress
} from '@mui/material';
import SatelliteManager from '../../components/admin/SatelliteManager';

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isLoading = status === 'loading';

  useEffect(() => {
    // 如果用户未认证（session状态已加载完成且没有session），重定向到登录页
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  // 如果正在加载session信息，显示加载指示器
  if (isLoading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        height: '100vh'
      }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>加载中...</Typography>
      </Box>
    );
  }

  // 检查会话和访问令牌是否存在（使用新的令牌字段名）
  if (!session || !session.access_token) {
    console.log('Session missing or invalid:', { 
      hasSession: !!session, 
      hasToken: session?.access_token
    });
    return null;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            卫星管理系统
          </Typography>
          <Typography sx={{ mr: 2 }}>
            {session?.user?.name || '管理员'}
          </Typography>
          <Button 
            color="inherit" 
            onClick={() => signOut({ callbackUrl: '/login' })}
          >
            退出
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 2, mb: 2, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <SatelliteManager />
      </Container>
    </Box>
  );
}