'use client';

import React from 'react';
import { 
  Typography, Card, Row, Col, Statistic, Table, Tag, Button, Spin, Alert, Flex, Divider, Space 
} from 'antd';
import { 
  ArrowLeftOutlined, CalendarOutlined, FileTextOutlined, 
  WalletOutlined, BankOutlined, TeamOutlined, SafetyCertificateOutlined 
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { useRouter, useParams } from 'next/navigation';
import dayjs from 'dayjs';
import axiosClient from '@/lib/api/axiosClient'; // Import langsung axiosClient

const { Title, Text } = Typography;

const formatRupiah = (value) => `Rp ${Number(value).toLocaleString('id-ID')}`;

export default function DetailBagiHasilPage() {
  const router = useRouter();
  const params = useParams();
  const distributionId = params.id;

  // Fetch Detail Data
  const { data, isLoading, isError } = useQuery({
    queryKey: ['distribution', distributionId],
    queryFn: async () => {
       // [FIX] Gunakan axiosClient yang sudah ada baseURL '/api' atau prefix '/api' manual
       // Pastikan endpoint sesuai dengan urls.py di backend (biasanya /profit-distribution/{id}/)
       // Cek apakah endpoint backend pake 'profit-distributions' (plural) atau 'profit-distribution' (singular)
       // Berdasarkan file serializers sebelumnya, viewsetnya biasanya ikut nama model. 
       // Kita coba '/api/profit-distribution/' (singular, standar DRF DefaultRouter biasanya base_name)
       // Jika error 404 lagi, coba ganti ke '/api/profit-distributions/'
       const res = await axiosClient.get(`/api/profit-distribution/${distributionId}/`);
       return res.data;
    },
    enabled: !!distributionId // Hanya fetch jika ID ada
  });

  if (isLoading) return (
    <div style={{ padding: 50, textAlign: 'center' }}>
      <Spin size="large" tip="Memuat Detail..." />
    </div>
  );

  if (isError || !data) return (
    <div style={{ padding: 24 }}>
      <Button icon={<ArrowLeftOutlined />} onClick={() => router.back()} style={{ marginBottom: 16 }}>Kembali</Button>
      <Alert 
        message="Gagal memuat data" 
        description="Data tidak ditemukan atau terjadi kesalahan server." 
        type="error" 
        showIcon 
      />
    </div>
  );

  // Columns untuk Tabel Rincian
  const itemColumns = [
    {
      title: 'Penerima',
      dataIndex: 'description', // Deskripsi berisi Nama/Asset
      key: 'description',
      render: (text) => <Text strong>{text}</Text>
    },
    {
      title: 'Peran',
      dataIndex: 'role',
      key: 'role',
      render: (role) => (
        <Tag color={role === 'Landowner' ? 'orange' : 'blue'}>
          {role === 'Landowner' ? 'Pemilik Lahan' : 'Investor'}
        </Tag>
      )
    },
    {
      title: 'Nominal Diterima',
      dataIndex: 'amount',
      key: 'amount',
      align: 'right',
      render: (val) => <Text style={{ color: '#3f8600', fontWeight: 500 }}>{formatRupiah(val)}</Text>
    }
  ];

  return (
    <div>
      {/* HEADER */}
      <div style={{ marginBottom: 24 }}>
        <Button 
            type="link" 
            icon={<ArrowLeftOutlined />} 
            onClick={() => router.back()} 
            style={{ paddingLeft: 0, fontSize: 16 }}
        >
            Kembali ke Daftar
        </Button>
        <Flex justify="space-between" align="center" style={{ marginTop: 8 }}>
            <div>
                <Title level={2} style={{ margin: 0 }}>Detail Distribusi Bagi Hasil</Title>
                <Space size="large" style={{ marginTop: 8, color: '#666' }}>
                    <span><CalendarOutlined /> {dayjs(data.date).format('DD MMMM YYYY')}</span>
                    <span><FileTextOutlined /> ID: #{data.id}</span>
                </Space>
            </div>
            <div style={{ textAlign: 'right' }}>
                <Text type="secondary" style={{ display: 'block' }}>Total Input Admin</Text>
                <Title level={7} style={{ margin: 0 }}>{formatRupiah(data.total_distributed)}</Title>
            </div>
        </Flex>
      </div>

      {/* STAT CARDS */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {/* 1. Bagian Landowner */}
        <Col xs={24} sm={8}>
            {/* [FIX] Ganti 'bordered={false}' dengan style biasa atau biarkan default */}
            <Card style={{ background: '#fff7e6', borderColor: '#ffd591' }}>
                <Statistic 
                    title={<span style={{ color: '#d46b08' }}><BankOutlined /> Jatah Landowner</span>}
                    value={data.landowner_portion}
                    formatter={val => formatRupiah(val)}
                    valueStyle={{ color: '#d46b08', fontWeight: 600 }}
                />
                <Text type="secondary" style={{ fontSize: 12 }}>Biaya sewa/bagi hasil lahan.</Text>
            </Card>
        </Col>

        {/* 2. Bagian Investor */}
        <Col xs={24} sm={8}>
            <Card style={{ background: '#e6f7ff', borderColor: '#91d5ff' }}>
                <Statistic 
                    title={<span style={{ color: '#096dd9' }}><TeamOutlined /> Net Untuk Investor</span>}
                    value={data.investor_portion}
                    formatter={val => formatRupiah(val)}
                    valueStyle={{ color: '#096dd9', fontWeight: 600 }}
                />
                <Text type="secondary" style={{ fontSize: 12 }}>Dibagi ke pemegang saham aktif.</Text>
            </Card>
        </Col>

        {/* 3. SISA (RETAINED) */}
        <Col xs={24} sm={8}>
            <Card style={{ background: '#f6ffed', borderColor: '#b7eb8f' }}>
                <Statistic 
                    title={<span style={{ color: '#389e0d' }}><SafetyCertificateOutlined /> Sisa (Kembali ke Kas)</span>}
                    value={data.retained_portion}
                    formatter={val => formatRupiah(val)}
                    valueStyle={{ color: '#389e0d', fontWeight: 600 }}
                />
                <Text type="secondary" style={{ fontSize: 12 }}>Dana tidak terdistribusi (Saham sisa).</Text>
            </Card>
        </Col>
      </Row>

      {/* RINCIAN TABEL */}
      <Card title="Rincian Penerima Dana" style={{ borderRadius: 8 }}>
        <Table 
            dataSource={data.items} 
            columns={itemColumns} 
            rowKey="id"
            pagination={{ pageSize: 10 }}
        />
        <div style={{ marginTop: 16, textAlign: 'right' }}>
             <Text strong>Total Terdistribusi (Real): </Text>
             <Text style={{ fontSize: 16, marginLeft: 8, color: '#1890ff' }}>{formatRupiah(data.real_distributed)}</Text>
        </div>
      </Card>

      {/* NOTES */}
      {data.notes && (
          <Card style={{ marginTop: 24, background: '#fafafa' }} size="small">
              <Text strong>Catatan:</Text>
              <p style={{ margin: 0 }}>{data.notes}</p>
          </Card>
      )}
    </div>
  );
}