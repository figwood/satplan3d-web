import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import {
  Box,
  Container,
  Tab,
  Tabs,
  AppBar,
  Toolbar,
  Typography,
  Button,
  CircularProgress
} from '@mui/material';
import SatelliteManager from '../../components/admin/SatelliteManager';

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index} style={{ padding: '24px 0' }}>
      {value === index && children}
    </div>
  );
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const [tabValue, setTabValue] = useState(0);
  const router = useRouter();
  const isLoading = status === 'loading';

  useEffect(() => {
    // 如果用户未认证（session状态已加载完成且没有session），重定向到登录页
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  const handleChange = (event, newValue) => {
    setTabValue(newValue);
  };

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

  // 如果没有会话或会话中没有访问令牌，则视为未登录
  if (!session || !session.accessToken) {
    return null;
  }

  return (
    <Box>
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

      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleChange}>
            <Tab label="卫星管理" />
            <Tab label="载荷管理" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <SatelliteManager />
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          {/* TODO: 添加载荷管理组件 */}
          <Typography>载荷管理功能开发中...</Typography>
        </TabPanel>
      </Container>
    </Box>
  );
}