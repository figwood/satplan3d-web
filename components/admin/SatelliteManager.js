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
  Alert,
  Grid,
  Popover,
  InputAdornment
} from '@mui/material';
import { Edit, Delete, Add, KeyboardArrowDown, KeyboardArrowUp, ColorLens } from '@mui/icons-material';
import { useSession } from 'next-auth/react';
import { Table, Button as AntButton, Tooltip, Badge, Space, Tag, ConfigProvider } from 'antd';
import { EditOutlined, DeleteOutlined, DownOutlined, UpOutlined, ReloadOutlined, PlusOutlined } from '@ant-design/icons';

export default function SatelliteManager() {
  const { data: session } = useSession();
  const [satellites, setSatellites] = useState([]);
  const [open, setOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [expandedRows, setExpandedRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tleUpdateDialogOpen, setTleUpdateDialogOpen] = useState(false);
  const [updatingTleSatellite, setUpdatingTleSatellite] = useState(null);
  const [newTleText, setNewTleText] = useState('');
  const [tleUpdateError, setTleUpdateError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    noardId: '',
    tle1: '',
    tle2: '',
    hex_color: '#3388ff'
  });
  const [error, setError] = useState('');
  const [tleText, setTleText] = useState('');
  const [colorPickerAnchorEl, setColorPickerAnchorEl] = useState(null);
  const [sensorDialogOpen, setSensorDialogOpen] = useState(false);
  const [sensorFormData, setSensorFormData] = useState({
    sensor_name: '',
    resolution: 0,
    right_side_angle: 0,
    left_side_angle: 0,
    init_angle: 0,
    observe_angle: 0,
    hex_color: '#3388ff',
    noard_id: ''
  });
  const [editingSensor, setEditingSensor] = useState(null);
  const [currentSatellite, setCurrentSatellite] = useState(null);

  // Pre-defined color palette options
  const colorOptions = [
    '#3388ff', '#ff3333', '#33cc33', '#ff9900', '#9900cc',
    '#00ccff', '#ff66b2', '#ffcc00', '#8c8c8c', '#663300',
    '#ff6600', '#00cc99', '#0066cc', '#cc00cc', '#ffff00',
    '#990000', '#006600', '#0000cc', '#660066', '#ff9966'
  ];

  useEffect(() => {
    if (session?.access_token) {
      fetchSatellites();
    }
  }, [session]);

  const fetchSatellites = async () => {
    try {
      const response = await fetch('/api/satellite/list', {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });
      const data = await response.json();
      setSatellites(data);
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
        hex_color: '#3388ff'
      });
      setEditData(null);
    }
    setOpen(true);
  };

  const handleClose = () => {
    if (!loading) {
      setOpen(false);
      setEditData(null);
      setError('');
      setFormData({
        name: '',
        noardId: '',
        tle1: '',
        tle2: '',
        hex_color: '#3388ff'
      });
      setTleText('');
    }
  };

  const handleTLEPaste = (e) => {
    const text = e.target.value;
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
      setTleText(text);
    } else if (text && lines.length > 0) {
      setError('TLE数据不完整，请提供包含卫星名称、TLE1和TLE2行的完整TLE数据');
    }
  };

  const handleSubmit = async () => {
    try {
      if (!editData && (!formData.tle1 || !formData.tle2)) {
        setError('TLE数据不完整');
        return;
      }

      setLoading(true);
      document.body.style.cursor = 'wait';

      const url = editData 
        ? `/api/satellite/${editData.noardId}` 
        : '/api/satellite';
      
      const method = editData ? 'PUT' : 'POST';
      
      const body = editData ? {
        sat_name: formData.name,
        hex_color: formData.hex_color,
      } : {
        sat_name: formData.name,
        noardId: formData.noardId,
        tle: formData.name + '\n' + formData.tle1 + '\n' + formData.tle2,
        hex_color: formData.hex_color,
      };

      // 确保session和token存在
      if (!session?.access_token) {
        setError('未授权，请重新登录');
        return;
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        await fetchSatellites();
        handleClose();
      } else {
        const errorData = await response.json();
        setError(errorData.detail || '保存失败');
      }
    } catch (error) {
      console.error('Error saving satellite:', error);
      setError('保存过程中发生错误');
    } finally {
      setLoading(false);
      document.body.style.cursor = 'default';
    }
  };

  const handleDelete = async (id) => {
    const satellite = satellites.find(sat => sat.id === id);
    if (!confirm(`确定要删除卫星"${satellite.name}"吗？`)) return;
    
    try {
      const response = await fetch(`/api/satellite/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });

      if (response.ok) {
        fetchSatellites();
      }
    } catch (error) {
      console.error('Error deleting satellite:', error);
    }
  };

  const handleUpdateTLE = async (satellite) => {
    setUpdatingTleSatellite(satellite);
    setTleUpdateDialogOpen(true);
  };

  const handleTleUpdateSubmit = async () => {
    try {
      setLoading(true);
      document.body.style.cursor = 'wait';  // 设置鼠标等待样式
      const response = await fetch('/api/tle', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ tle: newTleText }),
      });

      if (response.ok) {
        await fetchSatellites();
        setTleUpdateDialogOpen(false);
        setNewTleText('');
        setTleUpdateError('');
      } else {
        const errorData = await response.json();
        setTleUpdateError(errorData.detail || '更新TLE失败');
      }
    } catch (error) {
      console.error('Error updating TLE:', error);
      setTleUpdateError('更新TLE过程中发生错误');
    } finally {
      setLoading(false);
      document.body.style.cursor = 'default';  // 恢复默认鼠标样式
    }
  };

  const handleColorClick = (event) => {
    setColorPickerAnchorEl(event.currentTarget);
  };

  const handleColorClose = () => {
    setColorPickerAnchorEl(null);
  };

  const handleColorSelect = (color) => {
    setFormData({...formData, hex_color: color});
    handleColorClose();
  };

  const handleAddSensor = (satellite) => {
    setCurrentSatellite(satellite);
    setSensorFormData({
      ...sensorFormData,
      noard_id: satellite.noardId
    });
    setSensorDialogOpen(true);
  };

  const handleEditSensor = (sensor) => {
    console.log('编辑载荷数据:', JSON.stringify(sensor, null, 2));
    setEditingSensor({
      sensor_id: sensor.id
    });
    setSensorFormData({
      sensor_name: sensor.name,
      resolution: sensor.resolution || 0,
      right_side_angle: sensor.right_side_angle || 0,
      left_side_angle: sensor.left_side_angle || 0,
      init_angle: sensor.init_angle || 0,
      observe_angle: sensor.observe_angle || 0,
      hex_color: sensor.hex_color || '#3388ff',
      noard_id: sensor.noard_id
    });
    setSensorDialogOpen(true);
  };

  const handleDeleteSensor = async (sensor) => {
    if (!confirm(`确定要删除载荷"${sensor.name}"吗？`)) {
      return;
    }

    try {
      const response = await fetch(`/api/sensor/${sensor.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });

      if (response.ok) {
        await fetchSatellites();
      } else {
        const errorData = await response.json();
        console.error('删除载荷失败:', errorData);
      }
    } catch (error) {
      console.error('删除载荷出错:', error);
    }
  };

  const handleSubmitSensor = async () => {
    try {
      setLoading(true);
      const isEditing = !!editingSensor;
      
      const url = isEditing 
        ? `/api/sensor/${editingSensor.sensor_id}`
        : '/api/sensor';
      
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify(sensorFormData),
      });

      if (response.ok) {
        await fetchSatellites();
        handleCloseSensorDialog();
      } else {
        const errorData = await response.json();
        setError(errorData.detail || '保存载荷失败');
      }
    } catch (error) {
      console.error('Error saving sensor:', error);
      setError('保存载荷过程中发生错误');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSensorDialog = () => {
    setSensorDialogOpen(false);
    setSensorFormData({
      sensor_name: '',
      resolution: 0,
      right_side_angle: 0,
      left_side_angle: 0,
      init_angle: 0,
      observe_angle: 0,
      hex_color: '#3388ff',
      noard_id: ''
    });
    setEditingSensor(null);
    setError('');
  };

  const colorPickerOpen = Boolean(colorPickerAnchorEl);

  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'NORAD ID',
      dataIndex: 'noard_id',
      key: 'noard_id',
    },
    {
      title: '颜色',
      dataIndex: 'hex_color',
      key: 'hex_color',
      render: (hex_color) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ 
            width: '20px', 
            height: '20px', 
            backgroundColor: hex_color || '#3388ff', 
            marginRight: '8px',
            borderRadius: '4px',
            border: '1px solid #ddd'
          }}></div>
          {hex_color || '#3388ff'}
        </div>
      ),
    },
    {
      title: '最新TLE时间',
      dataIndex: 'latest_tle_time',
      key: 'latest_tle_time',
      render: (latest_tle_time) => {
        if (!latest_tle_time) return '-';
        const utcDate = new Date(latest_tle_time*1000);
        // 转换为本地时间，注意要减去时区偏移
        const localDate = new Date(utcDate.getTime() - utcDate.getTimezoneOffset() * 60000);
        return localDate.toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        });
      }
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
      title: '分辨率',
      dataIndex: 'resolution',
      key: 'resolution',
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
              onClick={() => handleEditSensor(record)}
            />
          </Tooltip>
          <Tooltip title="删除载荷">
            <AntButton 
              danger 
              icon={<DeleteOutlined />} 
              size="small"
              onClick={() => handleDeleteSensor(record)}
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
      <div style={{ 
        padding: '0 16px 16px',
        position: 'relative',
        backgroundColor: '#fff',
        maxHeight: '600px',  // 设置最大高度
        overflow: 'auto'     // 启用滚动
      }}>
        <div style={{ 
          marginBottom: '10px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          backgroundColor: '#fff',
          padding: '8px 0',
          position: 'sticky',  // 固定在顶部
          top: 0,
          zIndex: 1
        }}>
          <Typography variant="subtitle2">载荷列表</Typography>
          <AntButton
            type="primary"
            size="small"
            icon={<PlusOutlined />}
            onClick={() => handleAddSensor(record)}
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
            className="sensor-table"
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
    <Box sx={{ 
      position: 'fixed',
      top: 64,  // 为顶部导航栏留出空间
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex', 
      flexDirection: 'column',
      overflow: 'hidden',
      bgcolor: '#fff'
    }}>
      <Box sx={{ 
        borderBottom: 1, 
        borderColor: 'divider',
        px: 2,
        py: 1,
        display: 'flex', 
        justifyContent: 'flex-end',
        bgcolor: '#fafafa',
        gap: 1
      }}>
        <Button
          variant="outlined"
          startIcon={<ReloadOutlined />}
          onClick={() => setTleUpdateDialogOpen(true)}
        >
          更新TLE
        </Button>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpen()}
        >
          添加卫星
        </Button>
      </Box>

      <Box sx={{ 
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        '& .ant-table-wrapper': {
          margin: '0 16px'
        },
        '& .ant-table': {
          overflow: 'visible'
        },
        '& .ant-table-container': {
          overflow: 'visible'
        },
        '& .ant-table-body': {
          overflow: 'visible !important'
        },
        '& .ant-table-cell': {
          padding: '20px 16px !important'
        },
        '& .ant-table-row': {
          height: '72px'
        },
        '& .ant-table-expanded-row': {
          '& .ant-table-wrapper': {
            margin: '0'
          }
        },
        // 子表格样式
        '& .sensor-table': {
          '& .ant-table-cell': {
            padding: '16px !important'
          },
          '& .ant-table-row': {
            height: '60px'
          },
          '& .ant-table-thead > tr > th': {
            background: '#fafafa',
            fontWeight: 600
          }
        }
      }}>
        <ConfigProvider
          theme={{
            components: {
              Table: {
                borderRadius: 0,
                padding: 0,
                paddingContentVerticalLG: 20,
                rowHoverBg: '#fafafa',
                headerBg: '#f5f5f5',
                headerColor: 'rgba(0, 0, 0, 0.85)',
                borderColor: '#f0f0f0',
              },
            },
          }}
        >
          <Table
            columns={columns}
            dataSource={satellites}
            rowKey={(record) => record.id}
            expandable={expandableConfig}
            pagination={false}
            bordered
            scroll={{ x: 'max-content' }}
          />
        </ConfigProvider>
      </Box>

      <Dialog 
        open={open} 
        onClose={loading ? undefined : handleClose}
        maxWidth="md" 
        fullWidth
        disableEscapeKeyDown={loading}
      >
        <DialogTitle>
          {editData ? '编辑卫星' : '添加卫星'}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {!editData && (
            <Box sx={{ mt: 2, mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                TLE数据（可直接粘贴三行TLE数据）:
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={3}
                placeholder="粘贴三行TLE数据，包含：卫星名称、TLE1、TLE2"
                value={tleText}
                onChange={handleTLEPaste}
                sx={{ mb: 2 }}
                disabled={loading}
              />
            </Box>
          )}

          <TextField
            fullWidth
            label="卫星名称"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            margin="normal"
            required
            disabled={loading}
          />
          
          <TextField
            fullWidth
            label="颜色"
            value={formData.hex_color}
            onChange={(e) => setFormData({ ...formData, hex_color: e.target.value })}
            margin="normal"
            disabled={loading}
            InputProps={{
              startAdornment: (
                <div style={{ 
                  width: '20px', 
                  height: '20px', 
                  backgroundColor: formData.hex_color || '#3388ff', 
                  marginRight: '8px',
                  borderRadius: '4px',
                  border: '1px solid #ddd'
                }}></div>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <ColorLens
                    onClick={handleColorClick}
                    style={{ cursor: loading ? 'wait' : 'pointer' }}
                  />
                </InputAdornment>
              )
            }}
          />

          <Popover
            open={colorPickerOpen}
            anchorEl={colorPickerAnchorEl}
            onClose={handleColorClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'left',
            }}
          >
            <Box sx={{ display: 'flex', flexWrap: 'wrap', p: 1, maxWidth: 200 }}>
              {colorOptions.map((color) => (
                <Box
                  key={color}
                  sx={{
                    width: 24,
                    height: 24,
                    backgroundColor: color,
                    borderRadius: '50%',
                    margin: 0.5,
                    cursor: loading ? 'wait' : 'pointer',
                    border: '1px solid #ddd',
                  }}
                  onClick={() => handleColorSelect(color)}
                />
              ))}
            </Box>
          </Popover>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>取消</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={loading}
          >
            {loading ? '保存中...' : '保存'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog 
        open={sensorDialogOpen} 
        onClose={loading ? undefined : handleCloseSensorDialog}
        maxWidth="md" 
        fullWidth
        disableEscapeKeyDown={loading}
      >
        <DialogTitle>{editingSensor ? '编辑载荷' : '添加载荷'}</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            fullWidth
            label="载荷名称"
            value={sensorFormData.sensor_name}
            onChange={(e) => setSensorFormData({ ...sensorFormData, sensor_name: e.target.value })}
            margin="normal"
            required
            disabled={loading}
          />

          <TextField
            fullWidth
            label="分辨率"
            type="number"
            value={sensorFormData.resolution}
            onChange={(e) => setSensorFormData({ ...sensorFormData, resolution: e.target.value })}
            margin="normal"
            required
            disabled={loading}
          />

          <TextField
            fullWidth
            label="右侧摆角"
            type="number"
            value={sensorFormData.right_side_angle}
            onChange={(e) => setSensorFormData({ ...sensorFormData, right_side_angle: e.target.value })}
            margin="normal"
            required
            disabled={loading}
          />

          <TextField
            fullWidth
            label="左侧摆角"
            type="number"
            value={sensorFormData.left_side_angle}
            onChange={(e) => setSensorFormData({ ...sensorFormData, left_side_angle: e.target.value })}
            margin="normal"
            required
            disabled={loading}
          />

          <TextField
            fullWidth
            label="安装角"
            type="number"
            value={sensorFormData.init_angle}
            onChange={(e) => setSensorFormData({ ...sensorFormData, init_angle: e.target.value })}
            margin="normal"
            required
            disabled={loading}
          />

          <TextField
            fullWidth
            label="观测角"
            type="number"
            value={sensorFormData.observe_angle}
            onChange={(e) => setSensorFormData({ ...sensorFormData, observe_angle: e.target.value })}
            margin="normal"
            required
            disabled={loading}
          />

          <TextField
            fullWidth
            label="颜色"
            value={sensorFormData.hex_color}
            onChange={(e) => setSensorFormData({ ...sensorFormData, hex_color: e.target.value })}
            margin="normal"
            disabled={loading}
            InputProps={{
              startAdornment: (
                <div style={{ 
                  width: '20px', 
                  height: '20px', 
                  backgroundColor: sensorFormData.hex_color || '#3388ff', 
                  marginRight: '8px',
                  borderRadius: '4px',
                  border: '1px solid #ddd'
                }}></div>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <ColorLens
                    onClick={handleColorClick}
                    style={{ cursor: loading ? 'wait' : 'pointer' }}
                  />
                </InputAdornment>
              )
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSensorDialog} disabled={loading}>取消</Button>
          <Button 
            onClick={handleSubmitSensor} 
            variant="contained"
            disabled={loading}
          >
            {loading ? '保存中...' : '保存'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={tleUpdateDialogOpen}
        onClose={() => !loading && setTleUpdateDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>更新 TLE 数据</DialogTitle>
        <DialogContent>
          {tleUpdateError && (
            <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
              {tleUpdateError}
            </Alert>
          )}
          <TextField
            fullWidth
            multiline
            rows={3}
            label="新的TLE数据"
            value={newTleText}
            onChange={(e) => setNewTleText(e.target.value)}
            margin="normal"
            required
            disabled={loading}
            placeholder="请输入三行TLE数据，包含：卫星名称、TLE1、TLE2"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTleUpdateDialogOpen(false)} disabled={loading}>
            取消
          </Button>
          <Button
            onClick={handleTleUpdateSubmit}
            variant="contained"
            disabled={loading}
          >
            {loading ? '更新中...' : '更新'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}