import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Alert
} from '@mui/material';
import { Edit, Delete, Add, KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import { useSession } from 'next-auth/react';
import { Table, Button as AntButton, Tooltip, Badge, Space, Tag, ConfigProvider } from 'antd';
import { EditOutlined, DeleteOutlined, DownOutlined, UpOutlined, ReloadOutlined, PlusOutlined } from '@ant-design/icons';

export default function SatelliteManager() {
  const { data: session } = useSession();
  const [satellites, setSatellites] = useState([]);
  const [open, setOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [expandedRows, setExpandedRows] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    noardId: '',
    tle1: '',
    tle2: '',
    description: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (session?.accessToken) {
      fetchSatellites();
    }
  }, [session]);

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
        id: sat.data.noard_id,
        noardId: sat.data.noard_id,
        name: sat.data.name,
        hex_color: sat.data.hex_color,
        sensors: sat.data.sensors|| [],
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
        noardId: '',
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
      const name = lines[0].trim();
      const tle1 = lines[1].trim();
      const tle2 = lines[2].trim();
      
      const noardIdMatch = tle1.match(/^\d\s+(\d+)/);
      const noardId = noardIdMatch ? noardIdMatch[1] : '';

      setFormData(prev => ({
        ...prev,
        name,
        noardId,
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

  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'NORAD ID',
      dataIndex: 'noardId',
      key: 'noardId',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '载荷数量',
      key: 'sensorCount',
      render: (_, record) => (
        <Badge count={record.sensors.length} showZero />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space>
          <Tooltip title="编辑卫星">
            <AntButton 
              type="primary" 
              icon={<EditOutlined />} 
              size="small" 
              onClick={() => handleOpen(record)}
            />
          </Tooltip>
          <Tooltip title="删除卫星">
            <AntButton 
              danger 
              icon={<DeleteOutlined />} 
              size="small"
              onClick={() => handleDelete(record.id)}
            />
          </Tooltip>
          <Tooltip title="更新TLE">
            <AntButton 
              icon={<ReloadOutlined />} 
              size="small"
              onClick={() => handleUpdateTLE(record.id)}
            >
              更新TLE
            </AntButton>
          </Tooltip>
        </Space>
      ),
    },
  ];

  const payloadColumns = [
    {
      title: '载荷名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '幅宽',
      dataIndex: 'width',
      key: 'width',
    },
    {
      title: '观测角',
      dataIndex: 'observe_angle',
      key: 'observe_angle',
    },
    {
      title: '安装角',
      dataIndex: 'init_angle',
      key: 'init_angle',
    },
    {
      title: '当前侧摆角',
      dataIndex: 'cur_side_angle',
      key: 'cur_side_angle',
    },
    {
      title: '左侧摆角',
      dataIndex: 'left_side_angle',
      key: 'left_side_angle',
    },
    {
      title: '右侧摆角',
      dataIndex: 'right_side_angle',
      key: 'right_side_angle',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Tooltip title="编辑载荷">
            <AntButton 
              type="primary" 
              icon={<EditOutlined />} 
              size="small" 
              onClick={() => console.log('编辑载荷', record)}
            />
          </Tooltip>
          <Tooltip title="删除载荷">
            <AntButton 
              danger 
              icon={<DeleteOutlined />} 
              size="small"
              onClick={() => console.log('删除载荷', record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const expandableConfig = {
    expandedRowKeys: expandedRows,
    onExpandedRowsChange: (expandedKeys) => {
      setExpandedRows(expandedKeys);
    },
    expandedRowRender: (record) => (
      <div style={{ margin: 0, maxHeight: '400px', overflow: 'auto' }}>
        <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, backgroundColor: '#fff', zIndex: 1, padding: '8px 0' }}>
          <Typography variant="subtitle2">载荷列表</Typography>
          <AntButton
            type="primary"
            size="small"
            icon={<PlusOutlined />}
            onClick={() => console.log(`添加载荷到卫星 ${record.name}`)}
          >
            添加载荷
          </AntButton>
        </div>
        
        {record.sensors.length > 0 ? (
          <Table
            columns={payloadColumns}
            dataSource={record.sensors}
            pagination={false}
            size="small"
            rowKey={(s) => record.noardId+"_"+s.name}
            bordered
            scroll={{ x: 'max-content' }}
          />
        ) : (
          <Typography style={{ padding: '20px 0', textAlign: 'center', color: '#999' }}>
            该卫星暂无载荷数据
          </Typography>
        )}
      </div>
    ),
    expandIcon: ({ expanded, onExpand, record }) => 
      expanded ? (
        <UpOutlined onClick={e => onExpand(record, e)} />
      ) : (
        <DownOutlined onClick={e => onExpand(record, e)} />
      )
  };
  
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
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

      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        <ConfigProvider
          theme={{
            components: {
              Table: {
                borderRadius: 4,
                paddingContentVerticalLG: 12,
              },
            },
          }}
        >
          <Table
            columns={columns}
            dataSource={satellites}
            rowKey={(record) => record.id}
            expandable={expandableConfig}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条数据`
            }}
            bordered
            scroll={{ x: 'max-content', y: 'calc(100vh - 300px)' }}
          />
        </ConfigProvider>
      </Box>

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
            value={formData.noardId}
            onChange={(e) => setFormData({ ...formData, noardId: e.target.value })}
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