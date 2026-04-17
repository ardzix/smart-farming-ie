'use client';
import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Row, Col, Card, Input, Select, Button, Typography, Space, Tag, Flex,
  Modal, Form, DatePicker, InputNumber, message, Spin, Skeleton, Divider
} from 'antd';
import {
  PlusCircleOutlined, DollarCircleFilled, EditOutlined, EyeOutlined
} from '@ant-design/icons';
import { PiFileTextFill } from 'react-icons/pi';
import { MdLocationPin } from 'react-icons/md';
import { TbArrowsMaximize } from 'react-icons/tb';
import { BiSolidCalendar } from 'react-icons/bi';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import moment from 'moment';

import ProtectedRoute from '@/components/ProtectedRoute';
import useAuthStore from '@/lib/store/authStore';
import { getAssets, createAsset, updateAsset, deleteAsset } from '@/lib/api/asset';

// --- IMPORTS DARI LIB (Sesuai pembahasan sebelumnya) ---
// Jika belum membuat file lib/constants.js dan lib/utils.js,
// Anda bisa membuat file tersebut atau definisikan konstanta di sini sementara.
import { ASSET_TYPE_PROPS, OWNERSHIP_STATUS_CHOICES } from '@/lib/constants'; // Pastikan file ini ada
import { formatRupiah, formatDate } from '@/lib/utils'; // Pastikan file ini ada

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

// --- SUB-COMPONENTS ---

const StatCard = ({ title, value, icon, loading, format = "number", iconColor }) => {
  const displayValue = () => {
    if (loading) return <Skeleton.Input active size="small" style={{ width: 100 }} />;
    if (format === 'rupiah') return formatRupiah(value);
    return Number(value).toLocaleString('id-ID');
  };

  return (
    <Card styles={{ body: { padding: '24px' } }} style={{ borderRadius: '12px', boxShadow: '0px 1px 4px rgba(12, 12, 13, 0.1)', border: '1px solid #F0F0F0', }}>
      <Flex align="center" gap={20}>
        <div style={{ 
            // backgroundColor: `${iconColor}15`, // Opacity 15%
            color: iconColor, 
            fontSize: '34px', 
            padding: '12px', 
            borderRadius: '12px',
            display: 'flex' 
        }}>
          {icon}
        </div>
        <div>
          <Text type="secondary" style={{ fontSize: '16px', fontWeight: 600 }}>{title}</Text>
          <div style={{ fontSize: '28px', fontWeight: 700, lineHeight: 1.2, color: '#1f1f1f' }}>{displayValue()}</div >
        </div>
      </Flex>
    </Card>
  );
};

const AssetCard = ({ asset, onDetail, onEdit, canEdit }) => {
  const typeInfo = ASSET_TYPE_PROPS[asset.type] || { text: asset.type, color: 'default' };
  const ownershipLabel = OWNERSHIP_STATUS_CHOICES[asset.ownership_status] || asset.ownership_status;

  return (
    <Card 
      hoverable 
      style={{ borderRadius: '12px', border: '1px solid #f0f0f0', overflow: 'hidden' }} 
      bodyStyle={{ padding: '20px' }}
    >
      {/* Header Card */}
      <Flex justify="space-between" align="start" style={{ marginBottom: 16 }}>
        <div>
           <Title level={5} style={{ margin: 0, marginBottom: 4 }} ellipsis={{ rows: 2 }}>{asset.name}</Title>
           <Tag color="cyan" style={{ margin: 0, fontSize: '10px' }}>{ownershipLabel}</Tag>
        </div>
        <Tag color={typeInfo.color} style={{ fontWeight: 600 }}>{typeInfo.text}</Tag>
      </Flex>
      
      {/* Price */}
      <div style={{ marginBottom: 20 }}>
        <Text type="secondary" style={{ fontSize: '12px' }}>Estimasi Nilai</Text>
        <Title level={4} style={{ color: '#237804', margin: 0 }}>{formatRupiah(asset.value)}</Title>
      </div>

      {/* Details */}
      <Space direction="vertical" size={10} style={{ width: '100%', marginBottom: 20 }}>
        <Flex gap={10} align="center">
            <MdLocationPin color="#cf1322" size={18} /> 
            <Text type="secondary" style={{ fontSize: '14px' }} ellipsis>{asset.location}</Text>
        </Flex>
        <Flex gap={10} align="center">
            <TbArrowsMaximize color="#d46b08" size={18} /> 
            <Text type="secondary" style={{ fontSize: '14px' }}>{asset.size} m²</Text>
        </Flex>
        <Flex gap={10} align="center">
            <BiSolidCalendar color="#531dab" size={18} /> 
            <Text type="secondary" style={{ fontSize: '14px' }}>{formatDate(asset.acquisition_date)}</Text>
        </Flex>
      </Space>

      <Divider style={{ margin: '12px 0' }} />

      {/* Action Buttons */}
      <Flex gap={12}>
        <Button 
            icon={<EyeOutlined />} 
            block 
            onClick={() => onDetail(asset)}
        >
            Detail
        </Button>
        {canEdit && (
            <Button 
                type="primary" 
                icon={<EditOutlined />} 
                block 
                onClick={() => onEdit(asset)} 
                style={{ background: '#237804', borderColor: '#237804' }}
            >
                Edit
            </Button>
        )}
      </Flex>
    </Card>
  );
};

const AssetFormModal = ({ open, editingAsset, form, onCancel, onSubmit, isSubmitting }) => {
  useEffect(() => {
    if (open) {
      if (editingAsset) {
        form.setFieldsValue({
          ...editingAsset,
          acquisition_date: editingAsset.acquisition_date ? moment(editingAsset.acquisition_date) : null,
          landowner_share_percentage: editingAsset.landowner_share_percentage ?? 0
        });
      } else {
        form.resetFields();
        form.setFieldsValue({ landowner_share_percentage: 0 }); // Default
      }
    }
  }, [open, editingAsset, form]);

  return (
    <Modal
      title={<Title level={4} style={{ margin: 0 }}>{editingAsset ? 'Edit Aset' : 'Tambah Aset Baru'}</Title>}
      open={open}
      onCancel={onCancel}
      footer={null}
      width={700}
      destroyOnClose
      centered
    >
      <Form form={form} layout="vertical" onFinish={onSubmit} style={{ marginTop: 24 }}>
        <Row gutter={16}>
            <Col span={24}>
                <Form.Item label="Nama Aset" name="name" rules={[{ required: true, message: 'Nama aset wajib diisi' }]}>
                  <Input placeholder="Contoh: Lahan Sawah Blok A" size="large" />
                </Form.Item>
            </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} md={12}>
              <Form.Item label="Tipe Aset" name="type" rules={[{ required: true, message: 'Pilih tipe aset' }]}>
                  <Select placeholder="Pilih tipe" size="large">
                  {Object.entries(ASSET_TYPE_PROPS).map(([value, { text }]) => (
                      <Option key={value} value={value}>{text}</Option>
                  ))}
                  </Select>
              </Form.Item>
          </Col>
          <Col xs={24} md={12}>
              <Form.Item label="Status Kepemilikan" name="ownership_status" rules={[{ required: true, message: 'Pilih status' }]}>
                  <Select placeholder="Pilih status" size="large">
                  {Object.entries(OWNERSHIP_STATUS_CHOICES).map(([value, text]) => (
                      <Option key={value} value={value}>{text}</Option>
                  ))}
                  </Select>
              </Form.Item>
          </Col>
        </Row>

        <Form.Item label="Lokasi Lengkap" name="location" rules={[{ required: true, message: 'Lokasi wajib diisi' }]}>
          <Input.TextArea rows={2} placeholder="Alamat detail atau titik koordinat" />
        </Form.Item>

        <Row gutter={16}>
          <Col xs={24} md={12}>
              <Form.Item label="Ukuran (m²)" name="size" rules={[{ required: true }]}>
                  <InputNumber style={{ width: '100%' }} min={0} size="large" placeholder="0" />
              </Form.Item>
          </Col>
          <Col xs={24} md={12}>
              <Form.Item label="Nilai Estimasi (Rp)" name="value" rules={[{ required: true }]}>
                  <InputNumber 
                  style={{ width: '100%' }} 
                  min={0}
                  size="large"
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                  placeholder="0"
                  />
              </Form.Item>
          </Col>
        </Row>

        <Form.Item label="Tanggal Akuisisi" name="acquisition_date" rules={[{ required: true, message: 'Tanggal wajib diisi' }]}>
          <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" size="large" />
        </Form.Item>
        
        <Divider orientation="left" style={{ fontSize: '14px', color: '#888' }}>Informasi Tambahan (Opsional)</Divider>

        <Row gutter={16}>
            <Col xs={24} md={16}>
                <Form.Item 
                  label="Nama Pemilik Lahan (Landowner)" 
                  name="landowner" 
                  tooltip="Isi jika status lahan adalah Sewa atau Kerjasama Bagi Hasil"
                >
                  <Input placeholder="Nama pemilik asli" size="large" />
                </Form.Item>
            </Col>
            <Col xs={24} md={8}>
                <Form.Item 
                  label="% Bagi Hasil" 
                  name="landowner_share_percentage"
                >
                  <InputNumber 
                    style={{ width: '100%' }} 
                    min={0} max={100} 
                    formatter={value => `${value}%`} 
                    parser={value => value.replace('%', '')} 
                    size="large"
                  />
                </Form.Item>
            </Col>
        </Row>

        <Flex justify="end" gap={12} style={{ marginTop: 24 }}>
            <Button size="large" onClick={onCancel}>Batal</Button>
            <Button type="primary" htmlType="submit" loading={isSubmitting} size="large" style={{ background: '#237804', borderColor: '#237804' }}>
              {editingAsset ? 'Simpan Perubahan' : 'Simpan Aset'}
            </Button>
        </Flex>
      </Form>
    </Modal>
  );
};

// --- MAIN PAGE ---

function AssetManagementContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('semua');
  const [form] = Form.useForm();

  const user = useAuthStore((state) => state.user);
  const userRole = user?.role?.name || user?.role; 
  const canEdit = ['Admin', 'Superadmin'].includes(userRole);

  // Query Data
  const { data: assets, isLoading: isLoadingAssets } = useQuery({
    queryKey: ['assets'],
    queryFn: getAssets,
    staleTime: 60 * 1000, // Data dianggap fresh selama 1 menit
  });

  // Handler Sukses/Error
  const handleSuccess = (msg) => {
    queryClient.invalidateQueries({ queryKey: ['assets'] });
    setIsModalOpen(false);
    setEditingAsset(null);
    form.resetFields();
    message.success(msg);
  };

  const handleError = (err) => {
    message.error(err.response?.data?.detail || 'Terjadi kesalahan saat menyimpan data');
  };

  const createMutation = useMutation({
    mutationFn: createAsset,
    onSuccess: () => handleSuccess('Aset berhasil ditambahkan'),
    onError: handleError
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateAsset(id, data),
    onSuccess: () => handleSuccess('Data aset diperbarui'),
    onError: handleError
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAsset,
    onSuccess: () => {
        message.success('Aset berhasil dihapus');
        queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
    onError: (err) => message.error('Gagal menghapus aset')
  });

  // Event Handlers
  const handleAddAsset = () => {
    setEditingAsset(null);
    setIsModalOpen(true);
  };

  const handleEditAsset = (asset) => {
    setEditingAsset(asset);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (values) => {
    const formData = new FormData();
    
    // Looping keys untuk kode yang lebih bersih & dinamis
    Object.keys(values).forEach(key => {
        const val = values[key];
        if (key === 'acquisition_date' && val) {
            formData.append(key, val.format('YYYY-MM-DD'));
        } else if (val !== undefined && val !== null) {
            formData.append(key, val);
        }
    });

    // Default values jika kosong (handling backend quirks)
    if (!values.landowner) formData.append('landowner', '');
    if (!values.landowner_share_percentage) formData.append('landowner_share_percentage', 0);

    if (editingAsset) {
      updateMutation.mutate({ id: editingAsset.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  // Filtering Logic
  const stats = useMemo(() => {
    if (!assets) return { total: 0, value: 0, locations: 0 };
    return {
        total: assets.length,
        value: assets.reduce((acc, curr) => acc + Number(curr.value || 0), 0),
        locations: new Set(assets.map(a => a.location)).size
    };
  }, [assets]);

  const filteredAssets = useMemo(() => {
    if (!assets) return [];
    const term = searchTerm.toLowerCase();
    return assets.filter(a => 
      (selectedType === 'semua' || a.type === selectedType) &&
      (a.name.toLowerCase().includes(term) || a.location.toLowerCase().includes(term))
    );
  }, [assets, searchTerm, selectedType]);

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <>
      <Flex justify="space-between" align="center" style={{ marginBottom: 24 }} wrap="wrap">
        <div>
          <Title level={2} style={{ margin: 0, color: '#1f1f1f' }}>Manajemen Aset</Title>
          <Text type="secondary">Kelola daftar lahan, bangunan, dan peralatan pertanian.</Text>
        </div>
        {canEdit && (
          <Button
            type="primary"
            icon={<PlusCircleOutlined />}
            size="large"
            style={{ backgroundColor: '#237804', borderRadius: '8px', paddingInline: 24 }}
            onClick={handleAddAsset}
          >
            Aset Baru
          </Button>
        )}
      </Flex>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={8}>
            <StatCard title="Total Aset" value={stats.total} icon={<PiFileTextFill />} loading={isLoadingAssets} iconColor="#0958D9" />
        </Col>
        <Col xs={24} md={8}>
            <StatCard title="Total Nilai Aset" value={stats.value} icon={<DollarCircleFilled />} loading={isLoadingAssets} format="rupiah" iconColor="#7CB305" />
        </Col>
        <Col xs={24} md={8}>
            <StatCard title="Titik Lokasi" value={stats.locations} icon={<MdLocationPin />} loading={isLoadingAssets} iconColor="#CF1322" />
        </Col>
      </Row>

      <Card bodyStyle={{ padding: 16 }} style={{ marginBottom: 24, borderRadius: 12 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={16}>
            <Search
              placeholder="Cari berdasarkan nama atau lokasi..."
              allowClear
              size="large"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Col>
          <Col xs={24} lg={8}>
            <Select value={selectedType} style={{ width: '100%' }} size="large" onChange={setSelectedType}>
              <Option value="semua">Semua Tipe</Option>
              {Object.entries(ASSET_TYPE_PROPS).map(([value, { text }]) => (
                <Option key={value} value={value}>{text}</Option>
              ))}
            </Select>
          </Col>
        </Row>
      </Card>

      {isLoadingAssets ? (
        <div style={{ textAlign: 'center', padding: '50px 0' }}><Spin size="large" tip="Memuat Data Aset..." /></div>
      ) : (
        <Row gutter={[16, 16]}>
          {filteredAssets.length > 0 ? (
            filteredAssets.map((asset) => (
              <Col xs={24} sm={12} xl={8} key={asset.id}>
                <AssetCard
                  asset={asset}
                  onDetail={(a) => router.push(`/admin/asset/${a.id}`)}
                  onEdit={handleEditAsset}
                  canEdit={canEdit}
                />
              </Col>
            ))
          ) : (
            <Col span={24}>
                <div style={{ textAlign: 'center', padding: '60px', background: '#fff', borderRadius: 12 }}>
                    <Text type="secondary" style={{ fontSize: 16 }}>Tidak ada aset yang ditemukan.</Text>
                </div>
            </Col>
          )}
        </Row>
      )}

      <AssetFormModal
        open={isModalOpen}
        editingAsset={editingAsset}
        form={form}
        onCancel={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
      />
    </>
  );
}

export default function AssetPage() {
  return (
    <ProtectedRoute roles={['Superadmin', 'Admin', 'Investor', 'Viewer']}>
      <AssetManagementContent />
    </ProtectedRoute>
  );
}