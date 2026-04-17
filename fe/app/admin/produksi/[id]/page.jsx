'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Card, Button, Typography, Space, Tag, Flex, Spin, Alert, Descriptions, Row, Col,
  Popconfirm, message
} from 'antd';
import {
  ArrowLeftOutlined, DeleteOutlined,
  CalendarOutlined, AppstoreOutlined
} from '@ant-design/icons';
import { FaBoxesStacked } from 'react-icons/fa6';
import { BsBox2Fill } from 'react-icons/bs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs'; // Ganti moment dengan dayjs (lebih ringan)
import ProtectedRoute from '@/components/ProtectedRoute';
import useAuthStore from '@/lib/store/authStore';
import {
  getProduction, deleteProduction // Pastikan import ini sudah benar sekarang
} from '@/lib/api/production';

const { Title, Text } = Typography;

// =================================================================
// === HELPERS & CONSTANTS ===
// =================================================================
const formatDate = (dateString) => dateString ? dayjs(dateString).format('D/M/YYYY') : '-';

const STATUS_MAP = {
  stok: { label: 'Stok', color: '#1E429F', bgColor: '#E1EFFE' },
  terjual: { label: 'Dijual', color: '#057A55', bgColor: '#DEF7EC' },
};

const ASSET_TYPE_MAP = {
  lahan: { label: 'Lahan', color: '#0A529E', bgColor: '#E1EFFE' },
  alat: { label: 'Alat', color: '#90450A', bgColor: '#FEF3C7' },
  bangunan: { label: 'Bangunan', color: '#0A529E', bgColor: '#E1EFFE' },
  ternak: { label: 'Ternak', color: '#057A55', bgColor: '#DEF7EC' },
};

const getStatusProps = (status) => {
  return STATUS_MAP[status] || { label: status, color: '#374151', bgColor: '#F3F4F6' };
};

const getAssetTypeProps = (type) => {
  return ASSET_TYPE_MAP[type] || { label: type, color: '#374151', bgColor: '#F3F4F6' };
};

// =================================================================
// === KOMPONEN INFO CARD ===
// =================================================================
const InfoCard = ({ icon, label, value, iconColor }) => (
  <Card
    style={{
      border: '1px solid #E5E7EB',
      borderRadius: '12px',
      boxShadow: '0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -2px rgba(0, 0, 0, 0.05)',
    }}
  >
    <Flex align="center" gap={16}>
      <div style={{ color: iconColor, fontSize: '32px', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
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

// =================================================================
// === KOMPONEN UTAMA HALAMAN DETAIL ===
// =================================================================
function ProductionDetailContent() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const productionId = params.id;

  const user = useAuthStore((state) => state.user);
  const userRole = user?.role?.name || user?.role;
  const canEdit = ['Admin', 'Superadmin', 'Operator'].includes(userRole);

  const { data: production, isLoading, isError, error } = useQuery({
    queryKey: ['production', productionId],
    queryFn: () => getProduction(productionId),
    enabled: !!productionId,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProduction,
    onSuccess: () => {
      message.success('Data produksi berhasil dihapus');
      queryClient.invalidateQueries({ queryKey: ['productions'] });
      queryClient.invalidateQueries({ queryKey: ['products'] }); 
      router.push('/admin/produksi');
    },
    onError: (err) => {
      message.error(`Error: ${err.response?.data?.detail || err.message || 'Gagal menghapus'}`);
    }
  });

  const handleBack = () => {
    router.push('/admin/produksi');
  };

  const handleDelete = () => {
    deleteMutation.mutate(productionId);
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 50 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (isError) {
    return (
      <Alert message="Error Memuat Data" description={error?.message} type="error" showIcon />
    );
  }

  if (!production) {
    return (
      <Alert message="Produksi Tidak Ditemukan" type="warning" showIcon />
    );
  }

  const productName = production.product_name || production.product_details?.name || 'Produk Tanpa Nama';
  const assetName = production.asset_name || production.asset_details?.name || '-';
  const assetType = production.asset_details?.type || 'unknown';
  const unit = production.product_unit || production.product_details?.unit || '';
  const quantity = production.quantity_produced !== undefined ? production.quantity_produced : (production.quantity || 0);
  
  // Ambil stok produk global (bukan batch ini)
  const currentStock = production.product_details?.stock ?? production.product?.stock ?? 0;

  const statusProps = getStatusProps(production.status);
  const assetTypeProps = getAssetTypeProps(assetType);

  return (
    <>
      <Flex justify="space-between" align="center" style={{ marginBottom: 24 }} wrap="wrap" gap={16}>
        <Flex align="center" gap={16}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={handleBack}
            style={{ border: '1px solid #E5E7EB', borderRadius: '8px' }}
          />
          <div>
            <Title level={2} style={{ margin: 0, color: '#111928', fontWeight: 700, fontSize: '30px', lineHeight: '125%' }}>
              Detail Produksi
            </Title>
            <Text style={{ fontSize: '16px', fontWeight: 500, color: '#727272', lineHeight: '19px' }}>
              Informasi lengkap mengenai hasil produksi
            </Text>
          </div>
        </Flex>
        
        {canEdit && (
          <Space>
            <Popconfirm
              key="delete"
              title="Hapus Produksi?"
              description="Stok produk akan dikembalikan (dikurangi). Yakin?"
              onConfirm={handleDelete}
              okText="Ya, Hapus"
              cancelText="Batal"
              okButtonProps={{ danger: true, loading: deleteMutation.isPending }}
            >
              <Button
                danger
                icon={<DeleteOutlined />}
                size="large"
                style={{ borderRadius: '24px', height: 'auto', padding: '8px 16px', fontSize: '16px' }}
              >
                Hapus
              </Button>
            </Popconfirm>
          </Space>
        )}
      </Flex>

      <Row gutter={[24, 24]}>
        {/* KOLOM KIRI: Informasi Utama */}
        <Col xs={24} lg={16}>
          <Card
            style={{
              border: '1px solid #E5E7EB',
              borderRadius: '12px',
              boxShadow: '0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -2px rgba(0, 0, 0, 0.05)',
              marginBottom: 24,
            }}
          >
            <Flex justify="space-between" align="start" style={{ marginBottom: 24 }} wrap='wrap' gap={8}>
              <div>
                <Title level={3} style={{ margin: 0, marginBottom: 8 }}>
                  {productName}
                </Title>
                <Space wrap>
                  <Tag style={{
                    background: assetTypeProps.bgColor, color: assetTypeProps.color,
                    border: 'none', fontWeight: 600, fontSize: '14px',
                    padding: '4px 10px', borderRadius: '6px'
                  }}>
                    {assetTypeProps.label}
                  </Tag>
                  <Tag style={{
                    background: statusProps.bgColor, color: statusProps.color,
                    border: 'none', fontWeight: 600, fontSize: '14px',
                    padding: '4px 10px', borderRadius: '6px'
                  }}>
                    {statusProps.label}
                  </Tag>
                </Space>
              </div>
            </Flex>

            <Space direction="vertical" style={{ width: '100%' }} size={16}>
              <Flex align="center" gap={12}>
                <BsBox2Fill style={{ color: '#0958D9', fontSize: '24px', flexShrink: 0 }} />
                <div>
                  <Text style={{ fontSize: '12px', color: '#6B7280', display: 'block' }}>Aset Penghasil</Text>
                  <Text style={{ fontSize: '16px', fontWeight: 500, color: '#111928' }}>{assetName}</Text>
                </div>
              </Flex>
              <Flex align="center" gap={12}>
                <CalendarOutlined style={{ color: '#531DAB', fontSize: '24px', flexShrink: 0 }} />
                <div>
                  <Text style={{ fontSize: '12px', color: '#6B7280', display: 'block' }}>Tanggal Produksi</Text>
                  <Text style={{ fontSize: '16px', fontWeight: 500, color: '#111928' }}>{formatDate(production.date)}</Text>
                </div>
              </Flex>
            </Space>
          </Card>

          <Card
            title="Informasi Rinci"
            style={{
              border: '1px solid #E5E7EB',
              borderRadius: '12px',
              boxShadow: '0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -2px rgba(0, 0, 0, 0.05)',
            }}
          >
            <Descriptions bordered column={1} size="middle">
              <Descriptions.Item label="Nama Produk">{productName}</Descriptions.Item>
              <Descriptions.Item label="Aset Terkait">{assetName}</Descriptions.Item>
              <Descriptions.Item label="Tanggal">{formatDate(production.date)}</Descriptions.Item>
              <Descriptions.Item label="Kuantitas Hasil">{Number(quantity).toLocaleString('id-ID')} {unit}</Descriptions.Item>
              <Descriptions.Item label="Catatan">{production.notes || '-'}</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        {/* KOLOM KANAN: Stat Card (InfoCard) */}
        <Col xs={24} lg={8}>
          <Space direction="vertical" style={{ width: '100%' }} size={24}>
            <InfoCard
              icon={<FaBoxesStacked />}
              label="Kuantitas Batch Ini"
              value={`${Number(quantity).toLocaleString('id-ID')} ${unit}`}
              iconColor="#1C64F2"
            />
            
            {/* <InfoCard
              icon={<AppstoreOutlined />}
              label="Sisa Stok Gudang (Global)"
              value={`${Number(currentStock).toLocaleString('id-ID')} ${unit}`}
              iconColor="#D97706"
            /> */}
            
            <Card
              title="Metadata"
              style={{
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                boxShadow: '0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -2px rgba(0, 0, 0, 0.05)',
              }}
            >
              <Space direction="vertical" style={{ width: '100%' }} size={12}>
                <Flex justify="space-between">
                  <Text style={{ color: '#6B7280' }}>ID Produksi</Text>
                  <Text style={{ fontWeight: 600 }}>#{production.id}</Text>
                </Flex>
                <Flex justify="space-between">
                  <Text style={{ color: '#6B7280' }}>Tipe Aset</Text>
                  <Text style={{ fontWeight: 600 }}>{assetTypeProps.label}</Text>
                </Flex>
                <Flex justify="space-between">
                  <Text style={{ color: '#6B7280' }}>Dibuat Pada</Text>
                  <Text style={{ fontWeight: 600 }}>{formatDate(production.created_at)}</Text>
                </Flex>
              </Space>
            </Card>
          </Space>
        </Col>
      </Row>
    </>
  );
}

export default function ProductionDetailPage() {
  return (
    <ProtectedRoute roles={['Superadmin', 'Admin', 'Operator', 'Investor', 'Viewer']}>
      <ProductionDetailContent />
    </ProtectedRoute>
  );
}