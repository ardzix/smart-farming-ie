'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Card, Button, Typography, Space, Tag, Flex, Spin, Alert, Descriptions, Row, Col,
  Popconfirm, message
} from 'antd';
import {
  ArrowLeftOutlined, DeleteOutlined, UserOutlined, CalendarOutlined
} from '@ant-design/icons';
import { FaMoneyBillWave, FaBoxOpen } from 'react-icons/fa6';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import moment from 'moment';
import ProtectedRoute from '@/components/ProtectedRoute';
import useAuthStore from '@/lib/store/authStore';
import { getSale, deleteSale } from '@/lib/api/sales'; // MENGGUNAKAN getSale YANG BARU

const { Title, Text } = Typography;

const formatRupiah = (value) => value != null ? `Rp ${Number(value).toLocaleString('id-ID')}` : '-';
const formatDate = (dateString) => dateString ? moment(dateString).format('D MMMM YYYY') : '-';

const InfoCard = ({ icon, label, value, iconColor }) => (
  <Card style={{ border: '1px solid #E5E7EB', borderRadius: '12px', boxShadow: '0px 2px 4px rgba(0,0,0,0.05)' }}>
    <Flex align="center" gap={16}>
      <div style={{ color: iconColor, fontSize: '32px' }}>{icon}</div>
      <div>
        <Text style={{ fontSize: '12px', color: '#6B7280' }}>{label}</Text>
        <div style={{ fontSize: '18px', fontWeight: 600 }}>{value}</div>
      </div>
    </Flex>
  </Card>
);

function SalesDetailContent() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;
  const queryClient = useQueryClient();

  const user = useAuthStore((state) => state.user);
  const role = user?.role?.name || user?.role;
  const canEdit = ['Superadmin', 'Admin', 'Operator'].includes(role);

  // [FIX] Menggunakan fungsi getSale yang benar (sudah include /api/)
  const { data: sale, isLoading, isError } = useQuery({
    queryKey: ['sale', id],
    queryFn: () => getSale(id) 
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSale,
    onSuccess: () => {
      message.success('Penjualan dihapus, stok dikembalikan.');
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      router.push('/admin/penjualan');
    },
    onError: (err) => message.error(`Gagal menghapus: ${err.message}`)
  });

  if (isLoading) return <div style={{textAlign:'center', padding:50}}><Spin size="large"/></div>;
  if (isError) return <Alert message="Gagal memuat data" type="error" showIcon />;
  if (!sale) return <Alert message="Data tidak ditemukan" type="warning" showIcon />;

  const productName = sale.product_name || sale.product_details?.name || 'Produk';
  const unit = sale.product_unit || sale.product_details?.unit || '';

  return (
    <>
      <Flex justify="space-between" align="center" style={{ marginBottom: 24 }} wrap="wrap" gap={16}>
        <Flex align="center" gap={16}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => router.push('/admin/penjualan')} style={{ borderRadius: '8px' }} />
          <div>
            <Title level={2} style={{ margin: 0 }}>Detail Penjualan</Title>
            <Text type="secondary">ID Transaksi: #{sale.id}</Text>
          </div>
        </Flex>
        
        {canEdit && (
          <Popconfirm
            title="Hapus Transaksi?"
            description="Stok produk ini akan dikembalikan ke gudang secara otomatis."
            onConfirm={() => deleteMutation.mutate(id)}
            okText="Ya, Hapus & Kembalikan Stok"
            cancelText="Batal"
            okButtonProps={{ danger: true, loading: deleteMutation.isPending }}
          >
            <Button danger icon={<DeleteOutlined />} size="large" style={{ borderRadius: '24px' }}>Hapus Transaksi</Button>
          </Popconfirm>
        )}
      </Flex>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Card title="Informasi Transaksi" style={{ borderRadius: '12px', border: '1px solid #E5E7EB', marginBottom: 24 }}>
             <Descriptions bordered column={1} labelStyle={{ width: '200px' }}>
                <Descriptions.Item label="Produk Terjual">
                    <Text strong style={{ fontSize: '16px' }}>{productName}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Pembeli">
                    <Space><UserOutlined /> {sale.buyer_name || '-'}</Space>
                </Descriptions.Item>
                <Descriptions.Item label="Tanggal Transaksi">
                    <Space><CalendarOutlined /> {formatDate(sale.date)}</Space>
                </Descriptions.Item>
                <Descriptions.Item label="Jumlah">
                    {Number(sale.quantity).toLocaleString('id-ID')} {unit}
                </Descriptions.Item>
                <Descriptions.Item label="Harga Satuan">
                    {formatRupiah(sale.price_per_unit)}
                </Descriptions.Item>
                <Descriptions.Item label="Total Tagihan">
                    <Text strong style={{ color: '#057A55', fontSize: '18px' }}>{formatRupiah(sale.total_price)}</Text>
                </Descriptions.Item>
             </Descriptions>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
           <Space direction="vertical" style={{ width: '100%' }} size={24}>
              <InfoCard 
                 icon={<FaMoneyBillWave />} 
                 label="Total Pendapatan" 
                 value={formatRupiah(sale.total_price)} 
                 iconColor="#057A55" 
              />
              <InfoCard 
                 icon={<FaBoxOpen />} 
                 label="Barang Keluar" 
                 value={`${Number(sale.quantity).toLocaleString('id-ID')} ${unit}`} 
                 iconColor="#1E429F" 
              />
              <Card title="Metadata" style={{ borderRadius: '12px', border: '1px solid #E5E7EB' }}>
                 <Space direction="vertical" style={{ width: '100%' }}>
                    <Flex justify="space-between">
                        <Text type="secondary">Dibuat Pada</Text>
                        <Text strong>{moment(sale.created_at).format('DD/MM/YYYY HH:mm')}</Text>
                    </Flex>
                    {sale.updated_at && (
                        <Flex justify="space-between">
                            <Text type="secondary">Terakhir Update</Text>
                            <Text strong>{moment(sale.updated_at).format('DD/MM/YYYY HH:mm')}</Text>
                        </Flex>
                    )}
                 </Space>
              </Card>
           </Space>
        </Col>
      </Row>
    </>
  );
}

export default function SalesDetailPage() {
  return (
    <ProtectedRoute roles={['Superadmin', 'Admin', 'Operator', 'Investor', 'Viewer']}>
      <SalesDetailContent />
    </ProtectedRoute>
  );
}