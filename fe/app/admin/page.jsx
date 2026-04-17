'use client';

import React, { useEffect } from 'react';
import {
  Row, Col, Card, Statistic, Typography,
  Divider, Spin, Alert, Flex, Progress, Tag
} from 'antd';
import {
  ContainerOutlined, DollarCircleOutlined, RiseOutlined, 
  WalletOutlined, ShoppingOutlined, ExperimentOutlined,
  ArrowRightOutlined, ShopOutlined, BarChartOutlined,
  PieChartOutlined
} from '@ant-design/icons';
// Import icon dari library yang benar
import { GiReceiveMoney, GiPayMoney } from 'react-icons/gi'; 
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';

import ProtectedRoute from '@/components/ProtectedRoute';
import useAuthStore from '@/lib/store/authStore';
import { getDashboardData } from '@/lib/api/dashboard';
import { useRouter } from 'next/navigation';

const { Title, Text } = Typography;

const formatRupiah = (value) => {
  if (value == null) return 'Rp 0';
  return `Rp ${Number(value).toLocaleString('id-ID', { maximumFractionDigits: 0 })}`;
};

const formatNumber = (value) => {
    if (value == null) return '0';
    return Number(value).toLocaleString('id-ID');
};

const calculateSafePercent = (value, total) => {
  if (!total || total === 0 || !value) return 0;
  const pct = (value / total) * 100;
  return Math.min(Math.max(pct, 0), 100);
};

// --- OPERATOR DASHBOARD ---
const OperatorDashboard = ({ dashboardData, user }) => {
  const router = useRouter();
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ marginBottom: 0 }}>Halo, {user?.username}!</Title>
        <Text type="secondary">Selamat bertugas. Berikut ringkasan operasional lapangan.</Text>
      </div>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12}>
            <Card hoverable className="border-l-4" style={{ borderLeft: '4px solid #1890ff' }}>
              <Statistic title="Aset Dikelola" value={dashboardData?.total_assets || 0} prefix={<ContainerOutlined />} />
            </Card>
        </Col>
        <Col xs={24} sm={12}>
            <Card hoverable className="border-l-4" style={{ borderLeft: '4px solid #52c41a' }}>
              <Statistic title="Nilai Produksi" value={formatRupiah(dashboardData?.total_yield)} prefix={<RiseOutlined />} valueStyle={{ color: '#237804' }}/>
            </Card>
        </Col>
      </Row>
      <Title level={4}>Aksi Cepat</Title>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={8}>
          <Card hoverable style={{ background: '#f6ffed', borderColor: '#b7eb8f' }} onClick={() => router.push('/admin/pengeluaran')}>
            <Flex align="center" gap={16}>
              <ShoppingOutlined style={{ fontSize: 24, color: '#52c41a' }} />
              <div><Title level={5} style={{ margin: 0 }}>Input Pengeluaran</Title><Text type="secondary" style={{ fontSize: 12 }}>Beli pakan, pupuk, dll</Text></div>
              <ArrowRightOutlined style={{ marginLeft: 'auto', color: '#52c41a' }} />
            </Flex>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card hoverable style={{ background: '#e6f7ff', borderColor: '#91d5ff' }} onClick={() => router.push('/admin/produksi')}>
            <Flex align="center" gap={16}>
              <ExperimentOutlined style={{ fontSize: 24, color: '#1890ff' }} />
              <div><Title level={5} style={{ margin: 0 }}>Input Produksi</Title><Text type="secondary" style={{ fontSize: 12 }}>Catat hasil panen</Text></div>
              <ArrowRightOutlined style={{ marginLeft: 'auto', color: '#1890ff' }} />
            </Flex>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card hoverable style={{ background: '#fff7e6', borderColor: '#ffd591' }} onClick={() => router.push('/admin/asset')}>
            <Flex align="center" gap={16}>
              <ShopOutlined style={{ fontSize: 24, color: '#fa8c16' }} />
              <div><Title level={5} style={{ margin: 0 }}>Lihat Aset</Title><Text type="secondary" style={{ fontSize: 12 }}>Cek status lahan</Text></div>
              <ArrowRightOutlined style={{ marginLeft: 'auto', color: '#fa8c16' }} />
            </Flex>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

// --- INVESTOR DASHBOARD ---
const InvestorDashboard = ({ dashboardData }) => {
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ marginBottom: 0 }}>Portofolio Investasi</Title>
        <Text type="secondary">Pantau perkembangan aset dan bagi hasil Anda.</Text>
      </div>
      <Row gutter={[24, 24]}>
        <Col xs={24} md={8}>
          <Card hoverable style={{ height: '100%', borderRadius: 12 }}>
            <Statistic title="Total Modal Disetor" value={formatRupiah(dashboardData?.total_funding)} prefix={<DollarCircleOutlined />} valueStyle={{ color: '#1890ff', fontWeight: 600 }} />
            <Divider style={{ margin: '12px 0' }} />
            <Text type="secondary" style={{ fontSize: 12 }}>Total dana investasi yang aktif.</Text>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card hoverable style={{ height: '100%', borderRadius: 12 }}>
            <Statistic title="Aset Dimiliki" value={dashboardData?.total_assets || 0} prefix={<ContainerOutlined />} valueStyle={{ fontWeight: 600 }} />
            <Divider style={{ margin: '12px 0' }} />
            <Text type="secondary" style={{ fontSize: 12 }}>Jumlah lahan/proyek dalam portofolio.</Text>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card hoverable style={{ height: '100%', borderRadius: 12 }}>
            <Statistic title="Total Bagi Hasil (Net)" value={formatRupiah(dashboardData?.total_yield)} prefix={<RiseOutlined />} valueStyle={{ color: '#52c41a', fontWeight: 600 }} />
            <Divider style={{ margin: '12px 0' }} />
            <Text type="secondary" style={{ fontSize: 12 }}>Akumulasi keuntungan bersih diterima.</Text>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

// --- EXECUTIVE DASHBOARD ---
const ExecutiveDashboard = ({ dashboardData }) => {
  const omzetAmount = dashboardData?.total_revenue || 0;
  const expenseAmount = dashboardData?.total_expense || 0;
  const labaAmount = omzetAmount - expenseAmount;
  
  const profitMarginPercent = calculateSafePercent(Math.abs(labaAmount), omzetAmount);
  const isProfit = labaAmount >= 0;

  const financialData = [
    { name: 'Omzet', value: omzetAmount, color: '#1890ff' },
    { name: 'Pengeluaran', value: expenseAmount, color: '#ff4d4f' },
    { name: 'Laba Bersih', value: labaAmount, color: '#52c41a' },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ marginBottom: 0 }}>Dashboard Eksekutif</Title>
        <Text type="secondary">Ringkasan performa keseluruhan Lahan Pintar (Global State).</Text>
      </div>

      {/* HERO CARD: CASH ON HAND */}
      <Card 
        style={{ 
          marginBottom: 24, 
          background: 'linear-gradient(135deg, #1E429F 0%, #0E2A75 100%)', 
          borderRadius: 12, border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
        }}
        styles={{ body: { padding: '24px 32px' } }}
      >
        <Row align="middle" justify="space-between">
          <Col>
             <Text style={{ color: '#A3B8ED', fontSize: 16 }}>
                <WalletOutlined /> Dana Global (Cash on Hand)
             </Text>
             <div style={{ color: '#FFF', fontSize: 36, fontWeight: 700, marginTop: 8 }}>
                {formatRupiah(dashboardData?.total_cash_on_hand)}
             </div>
             <Text style={{ color: '#D1D5DB' }}>
                Saldo Aktif = (Dana Masuk) - (Dana Keluar Real) + (Sisa Bagi Hasil).
             </Text>
          </Col>
          <Col>
             <div style={{ textAlign: 'right', background: 'rgba(255,255,255,0.1)', padding: '12px 20px', borderRadius: 8 }}>
                <Text style={{ color: '#A3B8ED', fontSize: 12 }}>Nilai Aset</Text>
                <div style={{ color: '#FFF', fontSize: 20, fontWeight: 600 }}>
                   {formatRupiah(dashboardData?.total_asset_value)}
                </div>
             </div>
          </Col>
        </Row>
      </Card>

      <Row gutter={[24, 24]}>
         <Col xs={24} sm={12} lg={8}>
            <Card hoverable variant="borderless" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <Statistic title="Total Aset Fisik" value={dashboardData?.total_assets || 0} prefix={<ContainerOutlined />} />
            </Card>
         </Col>
         <Col xs={24} sm={12} lg={8}>
            <Card hoverable variant="borderless" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <Statistic title="Total Dana Kelolaan" value={formatRupiah(dashboardData?.total_funding)} prefix={<GiReceiveMoney />} valueStyle={{ color: '#237804' }} />
            </Card>
         </Col>
         <Col xs={24} sm={12} lg={8}>
            <Card hoverable variant="borderless" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <Statistic title="Total Pengeluaran" value={formatRupiah(expenseAmount)} prefix={<GiPayMoney />} valueStyle={{ color: '#cf1322' }} />
            </Card>
         </Col>
      </Row>

      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
         <Col xs={24} lg={14}>
            <Card title={<><BarChartOutlined /> Analisis Arus Kas</>} variant="borderless" style={{ height: '100%' }}>
               <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={financialData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => `${value / 1000000}jt`} />
                    <RechartsTooltip formatter={(value) => formatRupiah(value)} cursor={{ fill: 'transparent' }} />
                    <Bar dataKey="value" name="Jumlah (Rp)" radius={[4, 4, 0, 0]} barSize={60}>
                      {financialData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
               </ResponsiveContainer>
            </Card>
         </Col>

         <Col xs={24} lg={10}>
            <Flex vertical gap={24} style={{ height: '100%' }}>
                <Card title="Kesehatan Keuangan" variant="borderless" style={{ flex: 1 }}>
                   <Flex justify='space-between' align='center' style={{ marginBottom: 24 }}>
                      <Text style={{ fontSize: 16 }}>Margin Laba</Text>
                      <Text strong style={{ color: isProfit ? '#52c41a' : '#f5222d', fontSize: 20 }}>
                          {profitMarginPercent.toFixed(1)}%
                      </Text>
                   </Flex>
                   <Progress 
                     percent={profitMarginPercent} 
                     showInfo={false} 
                     status={isProfit ? "active" : "exception"}
                     strokeColor={isProfit ? '#52c41a' : '#f5222d'}
                     size={['100%', 12]}
                   />
                </Card>

                <Card title="Status Saham Global" variant="borderless" style={{ flex: 2 }}>
                   <div style={{ textAlign: 'center', marginBottom: 20 }}>
                       <Statistic title="Saham Tersedia" value={formatNumber(dashboardData?.shares_available)} suffix="Lembar" valueStyle={{ color: '#fa8c16' }} />
                   </div>
                   <div style={{ textAlign: 'center' }}>
                       <Text type="secondary">Total Saham: {formatNumber(dashboardData?.total_system_shares)}</Text>
                   </div>
                </Card>
            </Flex>
         </Col>
      </Row>
    </div>
  );
};

function AdminDashboardContent() {
  const user = useAuthStore((state) => state.user);
  const userRole = user?.role?.name || user?.role;
  const isOperator = userRole === 'Operator';
  const isInvestor = userRole === 'Investor';

  const { data: rawData, isLoading, isError } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboardData,
    refetchInterval: 5000, 
  });

  useEffect(() => {
    // Debug log untuk memastikan data masuk
    console.log("Live Dashboard Data:", rawData);
  }, [rawData]);

  // Handle Array vs Object dengan benar
  const dashboardData = Array.isArray(rawData) ? rawData[0] : (rawData || {});

  if (isLoading) {
    return <div style={{ padding: 100, textAlign: 'center' }}><Spin size="large"><div style={{ padding: 50 }}>Memuat Dashboard...</div></Spin></div>;
  }
  
  if (isError) {
    return <Alert message="Gagal memuat data dashboard." type="error" showIcon />;
  }

  return (
    <div style={{ padding: '0px' }}>
      {isOperator ? (
         <OperatorDashboard dashboardData={dashboardData} user={user} />
      ) : isInvestor ? (
         <InvestorDashboard dashboardData={dashboardData} />
      ) : (
         <ExecutiveDashboard dashboardData={dashboardData} />
      )}
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <ProtectedRoute roles={['Superadmin', 'Admin', 'Operator', 'Investor', 'Viewer']}>
      <AdminDashboardContent />
    </ProtectedRoute>
  );
}