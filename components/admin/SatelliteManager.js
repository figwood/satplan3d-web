import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Typography,
  Alert
} from '@mui/material';
import { Edit, Delete, Add } from '@mui/icons-material';
import { useSession } from 'next-auth/react';

export default function SatelliteManager() {
  const { data: session } = useSession();
  const [satellites, setSatellites] = useState([]);
  const [open, setOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    noradId: '',
    tle1: '',
    tle2: '',
    description: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSatellites();
  }, []);

  const fetchSatellites = async () => {
    try {
      const response = await fetch('/api/satellites', {
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`
        }
      });
      const data = await response.json();
      
      const satelliteArray = data.children || data;
      setSatellites(Array.isArray(satelliteArray) ? satelliteArray.map(sat => ({
        id: sat.key?.split('-')[1] || sat.id,
        name: sat.title || sat.name,
        ...sat.data
      })) : []);
    } catch (error) {
      console.error('Error fetching satellites:', error);
    }
  };

  const handleOpen = (satellite = null) => {
    setError('');
    if (satellite) {
      setFormData(satellite);
      setEditData(satellite);
    } else {
      setFormData({
        name: '',
        noradId: '',
        tle1: '',
        tle2: '',
        description: ''
      });
      setEditData(null);
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditData(null);
    setError('');
  };

  const handleTLEPaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text');
    const lines = text.trim().split('\n');
    
    if (lines.length >= 3) {
      // 从TLE文本中提取信息
      const name = lines[0].trim();
      const tle1 = lines[1].trim();
      const tle2 = lines[2].trim();
      
      // 尝试从TLE1行提取NORAD ID
      const noradIdMatch = tle1.match(/^\d\s+(\d+)/);
      const noradId = noradIdMatch ? noradIdMatch[1] : '';

      setFormData(prev => ({
        ...prev,
        name,
        noradId,
        tle1,
        tle2
      }));
    } else {
      setError('请粘贴完整的TLE数据（包含卫星名称、TLE1和TLE2行）');
    }
  };

  const handleSubmit = async () => {
    try {
      if (!formData.tle1 || !formData.tle2) {
        setError('TLE数据不完整');
        return;
      }

      const url = editData 
        ? `/api/satellites/${editData.id}` 
        : '/api/satellites';
      
      const method = editData ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.accessToken}`
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        fetchSatellites();
        handleClose();
      } else {
        const error = await response.json();
        setError(error.message || '保存失败');
      }
    } catch (error) {
      console.error('Error saving satellite:', error);
      setError('保存过程中发生错误');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('确定要删除这颗卫星吗？')) return;
    
    try {
      const response = await fetch(`/api/satellites/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`
        }
      });

      if (response.ok) {
        fetchSatellites();
      }
    } catch (error) {
      console.error('Error deleting satellite:', error);
    }
  };

  const handleUpdateTLE = async (id) => {
    try {
      const response = await fetch(`/api/satellites/${id}/tle`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`
        }
      });

      if (response.ok) {
        fetchSatellites();
      }
    } catch (error) {
      console.error('Error updating TLE:', error);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">卫星管理</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpen()}
        >
          添加卫星
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>名称</TableCell>
              <TableCell>NORAD ID</TableCell>
              <TableCell>描述</TableCell>
              <TableCell>TLE1</TableCell>
              <TableCell>TLE2</TableCell>
              <TableCell>操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {satellites.map((satellite) => (
              <TableRow key={satellite.id}>
                <TableCell>{satellite.name}</TableCell>
                <TableCell>{satellite.noradId}</TableCell>
                <TableCell>{satellite.description}</TableCell>
                <TableCell>{satellite.tle1}</TableCell>
                <TableCell>{satellite.tle2}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpen(satellite)}>
                    <Edit />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(satellite.id)}>
                    <Delete />
                  </IconButton>
                  <Button
                    size="small"
                    onClick={() => handleUpdateTLE(satellite.id)}
                  >
                    更新TLE
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {editData ? '编辑卫星' : '添加卫星'}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Box sx={{ mt: 2, mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              TLE数据（可直接粘贴三行TLE数据）:
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              placeholder="粘贴三行TLE数据，包含：卫星名称、TLE1、TLE2"
              onPaste={handleTLEPaste}
              sx={{ mb: 2 }}
            />
          </Box>

          <TextField
            fullWidth
            label="卫星名称"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="NORAD ID"
            value={formData.noradId}
            onChange={(e) => setFormData({ ...formData, noradId: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="描述"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            margin="normal"
            multiline
            rows={2}
          />
          <TextField
            fullWidth
            label="TLE Line 1"
            value={formData.tle1}
            onChange={(e) => setFormData({ ...formData, tle1: e.target.value })}
            margin="normal"
            required
            error={!formData.tle1}
          />
          <TextField
            fullWidth
            label="TLE Line 2"
            value={formData.tle2}
            onChange={(e) => setFormData({ ...formData, tle2: e.target.value })}
            margin="normal"
            required
            error={!formData.tle2}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>取消</Button>
          <Button onClick={handleSubmit} variant="contained">
            保存
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}