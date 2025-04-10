import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/router';
import {
  Box,
  TextField,
  Button,
  Container,
  Typography,
  Paper,
  Alert,
  CircularProgress
} from '@mui/material';

export default function Login() {
  const router = useRouter();
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        username: credentials.username,
        password: credentials.password,
        redirect: true,
        callbackUrl: '/admin'
      });

      // 由于设置了 redirect: true，这里的代码通常不会执行
      // 除非发生了客户端错误
      if (!result?.ok) {
        setError('登录失败，请重试');
        setLoading(false);
      }
    } catch (error) {
      setError('登录过程中发生错误');
      console.error('Login error:', error);
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
            管理员登录
          </Typography>

          {(error || router.query.error) && (
            <Alert severity="error" sx={{ mb: 2, width: '100%' }}>
              {error || '登录失败，请重试'}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              label="用户名"
              autoFocus
              value={credentials.username}
              onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
              disabled={loading}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="密码"
              type="password"
              value={credentials.password}
              onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
              disabled={loading}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, position: 'relative' }}
              disabled={loading}
            >
              {loading ? (
                <>
                  登录中
                  <CircularProgress
                    size={24}
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      marginTop: '-12px',
                      marginLeft: '-12px',
                    }}
                  />
                </>
              ) : (
                '登录'
              )}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}