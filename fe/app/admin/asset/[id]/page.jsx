'use client';
import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Card, Button, Typography, Space, Tag, Flex, Spin, Alert, Descriptions, Row, Col,
  Modal, Form, Input, Select, DatePicker, InputNumber, Upload, message, Popconfirm
} from 'antd';
import {
  ArrowLeftOutlined, EditOutlined, DollarCircleFilled, UploadOutlined,
  DeleteOutlined, UserOutlined
} from '@ant-design/icons';
import { MdLocationPin } from 'react-icons/md';
import { TbArrowsMaximize } from 'react-icons/tb';
import { BiSolidCalendar } from 'react-icons/bi';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import moment from 'moment';
import ProtectedRoute from '@/components/ProtectedRoute';
import useAuthStore from '@/lib/store/authStore';
// [FIX] Hapus getOwners/createOwner karena sudah tidak dipakai
import { getAssets, updateAsset, deleteAsset } from '@/lib/api/asset';

const { Title, Text } = Typography;
const { Option } = Select;

// ==================== CONSTANTS ====================
const ASSET_TYPE_PROPS = {
  'bangunan': { text: 'Bangunan', color: 'blue' },
  'lahan': { text: 'Lahan', color: 'red' },
  'ternak': { text: 'Ternak', color: 'green' },
  'alat': { text: 'Alat', color: 'purple' },
};

const OWNERSHIP_STATUS_CHOICES = {
  'full_ownership': 'Full Ownership',
  'partial_ownership': 'Partial Ownership',
  'investor_owned': 'Investor Owned',
  'leashold': 'Leased',
  'under_construction': 'Under Construction',
  'personal_ownership': 'Personal Ownership',
};

// ==================== HELPER FUNCTIONS ====================
const formatDate = (dateString) => dateString ? moment(dateString).format('DD/MM/YYYY') : '-';
const formatRupiah = (value) => value != null ? `Rp ${Number(value).toLocaleString('id-ID')}` : 'Rp 0';
const getAssetTypeProps = (type) => ASSET_TYPE_PROPS[type] || { text: type, color: 'default' };

// ==================== INFO CARD COMPONENT ====================
const InfoCard = ({ icon, label, value, iconColor }) => (
  <Card 
    style={{
      border: '1px solid #E5E7EB',
      borderRadius: '12px',
      boxShadow: '0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -2px rgba(0, 0, 0, 0.05)',
    }}
  >
    <Flex align="center" gap={16}>
      <div style={{ color: iconColor, fontSize: '32px', flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <Text style={{ fontSize: '14px', color: '#6B7280', display: 'block' }}>
          {label}
        </Text>
        <Text style={{ fontSize: '20px', fontWeight: 600, color: '#111928' }}>
          {value}
        </Text>
      </div>
    </Flex>
  </Card>
);

// ==================== ASSET FORM MODAL ====================
const AssetFormModal = ({ 
  open, asset, form, 
  onCancel, onSubmit, isSubmitting 
}) => (
  <Modal
    title="Edit Aset"
    open={open}
    onCancel={onCancel}
    footer={null}
    width={600}
    zIndex={1000}
    destroyOnClose
  >
    <Form form={form} layout="vertical" onFinish={onSubmit} style={{ marginTop: 24 }} initialValues={{
        ...asset,
        acquisition_date: asset?.acquisition_date ? moment(asset.acquisition_date) : null,
        // Pastikan field image di-handle jika perlu (biasanya upload butuh perlakuan khusus)
    }}>
      <Form.Item label="Nama Aset" name="name" rules={[{ required: true, message: 'Nama aset wajib diisi' }]}>
        <Input placeholder="Masukkan nama aset" />
      </Form.Item>

      <Form.Item label="Tipe Aset" name="type" rules={[{ required: true, message: 'Tipe aset wajib dipilih' }]}>
        <Select placeholder="Pilih tipe aset">
          {Object.entries(ASSET_TYPE_PROPS).map(([value, { text }]) => (
            <Option key={value} value={value}>{text}</Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item label="Lokasi" name="location" rules={[{ required: true, message: 'Lokasi wajib diisi' }]}>
        <Input placeholder="Masukkan lokasi" />
      </Form.Item>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item label="Ukuran (m²)" name="size" rules={[{ required: true, message: 'Ukuran wajib diisi' }]}>
            <InputNumber style={{ width: '100%' }} placeholder="Masukkan ukuran" min={0} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="Nilai (Rp)" name="value" rules={[{ required: true, message: 'Nilai wajib diisi' }]}>
            <InputNumber 
              style={{ width: '100%' }} 
              placeholder="Masukkan nilai" 
              min={0}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value.replace(/Rp\s?|(\.*)/g, '').replace(/,/g, '')}
            />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item label="Tanggal Akuisisi" name="acquisition_date" rules={[{ required: true, message: 'Tanggal wajib diisi' }]}>
        <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
      </Form.Item>

      <Form.Item label="Status Kepemilikan" name="ownership_status" rules={[{ required: true, message: 'Status wajib dipilih' }]}>
        <Select placeholder="Pilih status kepemilikan">
          {Object.entries(OWNERSHIP_STATUS_CHOICES).map(([value, text]) => (
            <Option key={value} value={value}>{text}</Option>
          ))}
        </Select>
      </Form.Item>

      {/* [FIX] Ubah jadi Input Text Biasa */}
      <Form.Item 
        label="Pemilik Lahan" 
        name="landowner"
        tooltip="Nama pemilik fisik lahan"
      >
        <Input prefix={<UserOutlined />} placeholder="Contoh: Bapak H. Udin" />
      </Form.Item>

      <Form.Item 
        label="% Bagi Hasil Pemilik" 
        name="landowner_share_percentage"
        initialValue={10}
        tooltip="Persentase keuntungan untuk pemilik lahan (default 10%)"
        rules={[{ required: true, message: '% Bagi Hasil wajib diisi' }]}
      >
        <InputNumber 
          style={{ width: '100%' }} 
          min={0} 
          max={100} 
          formatter={value => `${value}%`}
          parser={value => value.replace('%', '')}
        />
      </Form.Item>

      {/* [FIX] Ganti Document URL jadi Upload Image sesuai backend */}
      {/* <Form.Item 
        label="Foto / Dokumen" 
        name="image"
        valuePropName="fileList"
        getValueFromEvent={(e) => {
            if (Array.isArray(e)) return e;
            return e && e.fileList;
        }}
      >
        <Upload beforeUpload={() => false} maxCount={1} listType="picture">
            <Button icon={<UploadOutlined />}>Upload Gambar</Button>
        </Upload>
      </Form.Item> */}

      <Form.Item style={{marginBottom: 0}}>
        <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
          <Button onClick={onCancel}>Batal</Button>
          <Button type="primary" htmlType="submit" loading={isSubmitting} style={{background: '#237804'}}>
            Simpan Perubahan
          </Button>
        </Space>
      </Form.Item>
    </Form>
  </Modal>
);

// ==================== MAIN COMPONENT ====================
function AssetDetailContent() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const assetId = params.id;

  // State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  // [RBAC] Cek Role
  const user = useAuthStore((state) => state.user);
  const userRole = user?.role?.name || user?.role;
  const canEdit = ['Admin', 'Superadmin'].includes(userRole);

  // Data Fetching
  const { data: assets, isLoading: isLoadingAssets } = useQuery({
    queryKey: ['assets'],
    queryFn: getAssets,
  });

  const asset = assets?.find(a => a.id === parseInt(assetId));
  
  const typeProps = asset ? getAssetTypeProps(asset.type) : null;
  const isLoading = isLoadingAssets;

  // Mutations
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateAsset(id, data),
    onSuccess: () => {
      message.success('Aset berhasil diperbarui');
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      setIsModalOpen(false);
    },
    onError: (err) => {
      message.error(`Error: ${err.response?.data?.detail || err.message || 'Terjadi kesalahan'}`);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAsset,
    onSuccess: () => {
      message.success('Aset berhasil dihapus');
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      router.push('/admin/asset');
    },
    onError: (err) => {
      message.error(`Error: ${err.response?.data?.detail || err.message || 'Gagal menghapus aset'}`);
    }
  });

  // Handlers
  const handleEdit = () => {
    if (!asset) return;
    form.setFieldsValue({
      ...asset,
      acquisition_date: asset.acquisition_date ? moment(asset.acquisition_date) : null,
      landowner: asset.landowner || '' 
    });
    setIsModalOpen(true);
  };

  // [FIX] Convert ke FormData agar diterima Backend (Multipart)
  const handleFormSubmit = (values) => {
    const formData = new FormData();
    
    formData.append('name', values.name);
    formData.append('type', values.type);
    formData.append('ownership_status', values.ownership_status);
    formData.append('location', values.location);
    formData.append('size', values.size || 0);
    formData.append('value', values.value || 0);
    
    if (values.acquisition_date) {
        formData.append('acquisition_date', values.acquisition_date.format('YYYY-MM-DD'));
    }

    // Kirim text landowner
    formData.append('landowner', values.landowner || '');
    formData.append('landowner_share_percentage', values.landowner_share_percentage || 0);

    // Kirim file jika ada
    if (values.image && values.image.length > 0) {
        formData.append('image', values.image[0].originFileObj);
    }

    updateMutation.mutate({ id: asset.id, data: formData });
  };

  const handleDelete = () => {
    deleteMutation.mutate(asset.id);
  };

  // Render Loading
  if (isLoading) return <div style={{ textAlign: 'center', padding: 50 }}><Spin size="large" /></div>;
  
  // Render Not Found
  if (!asset) return <Alert message="Aset Tidak Ditemukan" type="warning" showIcon />;

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <Flex justify="space-between" align="center" style={{ marginBottom: 24 }} wrap="wrap" gap={16}>
        <Flex align="center" gap={16}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => router.push('/admin/asset')} style={{ border: '1px solid #E5E7EB', borderRadius: '8px' }} />
          <div>
            <Title level={2} style={{ margin: 0, color: '#111928', fontWeight: 700, fontSize: '30px', lineHeight: '125%' }}>Detail Aset</Title>
            <Text style={{ fontSize: '16px', fontWeight: 500, color: '#727272', lineHeight: '19px' }}>Informasi lengkap mengenai aset</Text>
          </div>
        </Flex>
        
        {/* [RBAC] Tombol Edit & Hapus */}
        {canEdit && (
          <Space>
             <Popconfirm
                title="Hapus Aset?"
                description="Data yang dihapus tidak dapat dikembalikan."
                onConfirm={handleDelete}
                okText="Ya, Hapus"
                cancelText="Batal"
                okButtonProps={{ danger: true, loading: deleteMutation.isPending }}
             >
                <Button danger icon={<DeleteOutlined />} size="large" style={{ borderRadius: 24 }}>Hapus</Button>
             </Popconfirm>
             <Button
                type="primary"
                icon={<EditOutlined />}
                size="large"
                style={{ backgroundColor: '#237804', borderRadius: '24px', height: 'auto', padding: '8px 16px', fontSize: '16px' }}
                onClick={handleEdit}
            >
                Edit Aset
            </Button>
          </Space>
        )}
      </Flex>

      {/* Main Content */}
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Card style={{ border: '1px solid #E5E7EB', borderRadius: '12px', boxShadow: '0px 4px 6px -1px rgba(0, 0, 0, 0.1)', marginBottom: 24 }}>
            <Flex justify="space-between" align="start" style={{ marginBottom: 24 }}>
              <div>
                <Title level={3} style={{ margin: 0, marginBottom: 8 }}>{asset.name}</Title>
                <Tag color={typeProps.color} style={{ padding: '4px 10px', borderRadius: '6px', fontWeight: 600, fontSize: '14px' }}>{typeProps.text}</Tag>
              </div>
              <Text style={{ fontWeight: 600, fontSize: '24px', color: '#7CB305' }}>{formatRupiah(asset.value)}</Text>
            </Flex>

            <Space direction="vertical" style={{ width: '100%' }} size={16}>
              <Flex align="center" gap={12}><MdLocationPin style={{ color: '#CF1322', fontSize: '24px' }} /><div><Text style={{ fontSize: '12px', color: '#6B7280' }}>Lokasi</Text><Text style={{ fontSize: '16px', fontWeight: 500, color: '#111928' }}>{asset.location}</Text></div></Flex>
              <Flex align="center" gap={12}><TbArrowsMaximize style={{ color: '#D46B08', fontSize: '24px' }} /><div><Text style={{ fontSize: '12px', color: '#6B7280' }}>Ukuran</Text><Text style={{ fontSize: '16px', fontWeight: 500, color: '#111928' }}>{asset.size} m²</Text></div></Flex>
              <Flex align="center" gap={12}><BiSolidCalendar style={{ color: '#531DAB', fontSize: '24px' }} /><div><Text style={{ fontSize: '12px', color: '#6B7280' }}>Tanggal Akuisisi</Text><Text style={{ fontSize: '16px', fontWeight: 500, color: '#111928' }}>{formatDate(asset.acquisition_date)}</Text></div></Flex>
            </Space>
          </Card>

          <Card title="Informasi Detail" style={{ border: '1px solid #E5E7EB', borderRadius: '12px', boxShadow: '0px 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
            <Descriptions bordered column={1} size="middle">
              <Descriptions.Item label="Status Kepemilikan"><Text style={{ fontWeight: 500 }}>{OWNERSHIP_STATUS_CHOICES[asset.ownership_status] || asset.ownership_status}</Text></Descriptions.Item>
              <Descriptions.Item label="Pemilik Lahan"><Text style={{ fontWeight: 500 }}>{asset.landowner || '-'}</Text></Descriptions.Item>
              <Descriptions.Item label="% Bagi Hasil Pemilik"><Text style={{ fontWeight: 500, color: '#7CB305' }}>{asset.landowner_share_percentage ? `${asset.landowner_share_percentage}%` : '-'}</Text></Descriptions.Item>
              
            </Descriptions>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Space direction="vertical" style={{ width: '100%' }} size={24}>
            {/* Value dan Size sudah ada, tambahkan card lain jika perlu */}
            <InfoCard icon={<DollarCircleFilled />} label="Nilai Aset" value={formatRupiah(asset.value || 0)} iconColor="#7CB305" />
            <InfoCard icon={<TbArrowsMaximize />} label="Luas Total" value={`${asset.size} m²`} iconColor="#D46B08" />
            
            <Card title="Informasi Tambahan" style={{ border: '1px solid #E5E7EB', borderRadius: '12px', boxShadow: '0px 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
              <Space direction="vertical" style={{ width: '100%' }} size={12}>
                <Flex justify="space-between"><Text style={{ color: '#6B7280' }}>ID Aset</Text><Text style={{ fontWeight: 600 }}>#{asset.id}</Text></Flex>
                <Flex justify="space-between"><Text style={{ color: '#6B7280' }}>Tipe</Text><Text style={{ fontWeight: 600 }}>{typeProps.text}</Text></Flex>
                <Flex justify="space-between"><Text style={{ color: '#6B7280' }}>Status</Text><Tag color="green">Aktif</Tag></Flex>
              </Space>
            </Card>
          </Space>
        </Col>
      </Row>

      {canEdit && <AssetFormModal open={isModalOpen} asset={asset} form={form} onCancel={() => setIsModalOpen(false)} onSubmit={handleFormSubmit} isSubmitting={updateMutation.isPending} />}
    </div>
  );
}

export default function AssetDetailPage() {
  return <ProtectedRoute roles={['Superadmin', 'Admin', 'Investor', 'Viewer']}><AssetDetailContent /></ProtectedRoute>;
}