'use client';

import React, { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  message,
  Popconfirm,
  Row,
  Space,
  Spin,
  Statistic,
  Table,
  Typography,
} from 'antd';
import { DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import ProtectedRoute from '@/components/ProtectedRoute';
import {
  createDistribution,
  deleteDistribution,
  getDistributions,
  previewDistribution,
} from '@/lib/api/profit_distribution';

const { Title, Text } = Typography;

const formatRupiah = (value) =>
  `Rp ${Number(value || 0).toLocaleString('id-ID', { maximumFractionDigits: 0 })}`;

function ProfitDistributionContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const { data: distributions = [], isLoading, isError, error } = useQuery({
    queryKey: ['profit-distributions'],
    queryFn: getDistributions,
  });

  const createMutation = useMutation({
    mutationFn: createDistribution,
    onSuccess: () => {
      message.success('Bagi hasil berhasil disimpan');
      queryClient.invalidateQueries({ queryKey: ['profit-distributions'] });
      form.resetFields();
      form.setFieldsValue({ date: dayjs() });
      setPreview(null);
    },
    onError: (err) => {
      message.error(err.response?.data?.detail || 'Gagal menyimpan bagi hasil');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDistribution,
    onSuccess: () => {
      message.success('Riwayat bagi hasil dihapus');
      queryClient.invalidateQueries({ queryKey: ['profit-distributions'] });
    },
    onError: (err) => {
      message.error(err.response?.data?.detail || 'Gagal menghapus data');
    },
  });

  const watchedAmount = Form.useWatch('total_distributed', form);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!watchedAmount || Number(watchedAmount) <= 0) {
        setPreview(null);
        return;
      }

      setPreviewLoading(true);
      try {
        const result = await previewDistribution(Number(watchedAmount));
        setPreview(result);
      } catch (err) {
        setPreview(null);
      } finally {
        setPreviewLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [watchedAmount]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      createMutation.mutate({
        total_distributed: values.total_distributed,
        date: values.date.format('YYYY-MM-DD'),
        notes: values.notes || '',
      });
    } catch (err) {
      return;
    }
  };

  const totalDistributed = distributions.reduce(
    (sum, item) => sum + Number(item.total_distributed || 0),
    0
  );
  const totalReal = distributions.reduce(
    (sum, item) => sum + Number(item.real_distributed || 0),
    0
  );

  const columns = [
    {
      title: 'Tanggal',
      dataIndex: 'date',
      key: 'date',
      render: (value) => dayjs(value).format('DD MMM YYYY'),
    },
    {
      title: 'Total Input',
      dataIndex: 'total_distributed',
      key: 'total_distributed',
      align: 'right',
      render: (value) => formatRupiah(value),
    },
    {
      title: 'Real Tersalurkan',
      dataIndex: 'real_distributed',
      key: 'real_distributed',
      align: 'right',
      render: (value) => formatRupiah(value),
    },
    {
      title: 'Sisa',
      dataIndex: 'retained_portion',
      key: 'retained_portion',
      align: 'right',
      render: (value) => formatRupiah(value),
    },
    {
      title: 'Aksi',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button icon={<EyeOutlined />} onClick={() => router.push(`/admin/bagi-hasil/${record.id}`)}>
            Detail
          </Button>
          <Popconfirm
            title="Hapus riwayat bagi hasil?"
            onConfirm={() => deleteMutation.mutate(record.id)}
            okText="Hapus"
            cancelText="Batal"
          >
            <Button danger icon={<DeleteOutlined />} loading={deleteMutation.isPending}>
              Hapus
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ marginBottom: 0 }}>Bagi Hasil</Title>
        <Text type="secondary">Hitung preview dan simpan distribusi keuntungan ke investor dan landowner.</Text>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={8}>
          <Card><Statistic title="Jumlah Distribusi" value={distributions.length} /></Card>
        </Col>
        <Col xs={24} md={8}>
          <Card><Statistic title="Total Input" value={totalDistributed} formatter={formatRupiah} /></Card>
        </Col>
        <Col xs={24} md={8}>
          <Card><Statistic title="Real Tersalurkan" value={totalReal} formatter={formatRupiah} /></Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={10}>
          <Card title="Buat Distribusi">
            <Form form={form} layout="vertical" initialValues={{ date: dayjs() }}>
              <Form.Item
                label="Nominal Dibagikan"
                name="total_distributed"
                rules={[{ required: true, message: 'Nominal wajib diisi' }]}
              >
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item
                label="Tanggal"
                name="date"
                rules={[{ required: true, message: 'Tanggal wajib diisi' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="Catatan" name="notes">
                <Input.TextArea rows={4} />
              </Form.Item>
              <Button
                type="primary"
                onClick={handleSubmit}
                loading={createMutation.isPending}
                style={{ background: '#237804', borderColor: '#237804' }}
              >
                Simpan Bagi Hasil
              </Button>
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={14}>
          <Card title="Preview Distribusi">
            {previewLoading ? (
              <Spin />
            ) : preview ? (
              <>
                <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                  <Col xs={24} md={12}>
                    <Statistic title="Landowner Total" value={preview.summary?.landowner_total} formatter={formatRupiah} />
                  </Col>
                  <Col xs={24} md={12}>
                    <Statistic title="Pool Investor" value={preview.summary?.investor_net_pool} formatter={formatRupiah} />
                  </Col>
                  <Col xs={24} md={12}>
                    <Statistic title="Dividen per Saham" value={preview.summary?.dividend_per_share} formatter={formatRupiah} />
                  </Col>
                  <Col xs={24} md={12}>
                    <Statistic title="Retained Earnings" value={preview.summary?.retained_earnings} formatter={formatRupiah} />
                  </Col>
                </Row>
                <Table
                  dataSource={preview.investor_breakdown || []}
                  rowKey={(record) => `${record.name}-${record.portion_info}`}
                  pagination={false}
                  columns={[
                    { title: 'Investor', dataIndex: 'name', key: 'name' },
                    { title: 'Porsi', dataIndex: 'portion_info', key: 'portion_info' },
                    {
                      title: 'Nominal',
                      dataIndex: 'amount',
                      key: 'amount',
                      align: 'right',
                      render: (value) => formatRupiah(value),
                    },
                  ]}
                />
              </>
            ) : (
              <Text type="secondary">Masukkan nominal untuk melihat preview distribusi.</Text>
            )}
          </Card>
        </Col>
      </Row>

      <Card title="Riwayat Distribusi" style={{ marginTop: 24 }}>
        {isError && (
          <Alert
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
            message="Gagal memuat riwayat"
            description={error?.message || 'Terjadi kesalahan saat mengambil data.'}
          />
        )}
        <Table
          rowKey="id"
          loading={isLoading}
          dataSource={distributions}
          columns={columns}
        />
      </Card>
    </div>
  );
}

export default function ProfitDistributionPage() {
  return (
    <ProtectedRoute roles={['Superadmin', 'Admin', 'Operator', 'Investor', 'Viewer']}>
      <ProfitDistributionContent />
    </ProtectedRoute>
  );
}
