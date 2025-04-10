import { useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  Box,
  Container,
  Tab,
  Tabs,
  AppBar,
  Toolbar,
  Typography,
  Button
} from '@mui/material';
import { signOut } from 'next-auth/react';
import SatelliteManager from '../../components/admin/SatelliteManager';

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index} style={{ padding: '24px 0' }}>
      {value === index && children}
    </div>
  );
}

export default function AdminPage() {
  const { data: session } = useSession();
  const [tabValue, setTabValue] = useState(0);

  const handleChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Box>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            卫星管理系统
          </Typography>
          <Typography sx={{ mr: 2 }}>
            {session?.user?.name}
          </Typography>
          <Button color="inherit" onClick={() => signOut()}>
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