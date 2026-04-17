'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Card, Button, Typography, Space, Tag, Flex, Spin, Alert, Descriptions, Row, Col,
  Modal, Form, Input, Select, DatePicker, InputNumber, message, Popconfirm, Upload
} from 'antd';
import {
  ArrowLeftOutlined, EditOutlined, DeleteOutlined, 
  LinkOutlined, UploadOutlined, InfoCircleOutlined,
  FileTextOutlined, CalendarOutlined, UserOutlined
} from '@ant-design/icons';
import { GiPayMoney } from 'react-icons/gi';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import moment from 'moment';
import ProtectedRoute from '@/components/ProtectedRoute';
import useAuthStore from '@/lib/store/authStore';

// API Imports (Hanya Expense, karena model tidak punya relasi lain)
import { getExpense, updateExpense, deleteExpense } from '@/lib/api/expense';

const { Title, Text } = Typography;
const { Option } = Select;

// Sesuai Choices di models.py
const EXPENSE_CATEGORIES = {
  'OPERATIONAL': 'Operational Cost',
  'SALARY': 'Salary/Wages',
  'ASSET_PURCHASE': 'Asset Purchase',
  'TAX': 'Tax & Legal',
  'OTHERS': 'Others',
};

const formatRupiah = (value) =>
  value != null
    ? `Rp ${Number(value).toLocaleString('id-ID', { minimumFractionDigits: 0 })}`
    : 'Rp 0';

const formatDate = (dateString) => dateString ? moment(dateString).format('D MMMM YYYY') : '-';

// --- COMPONENTS ---

const InfoCard = ({ icon, label, value, iconColor }) => (
  <Card
    style={{
      border: '1px solid #E5E7EB',
      borderRadius: '12px',
      boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)',
    }}
  >
    <Flex align="center" gap={16}>
      <div style={{ color: iconColor, fontSize: '28px', flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <Text style={{ fontSize: '12px', color: '#6B7280', display: 'block' }}>
          {label}
        </Text>
        <Text style={{ fontSize: '18px', fontWeight: 600, color: '#111928' }}>
          {value}
        </Text>
      </div>
    </Flex>
  </Card>
);

const ExpenseFormModal = ({
  open, expense, form, 
  onCancel, onSubmit, isSubmitting
}) => {
  useEffect(() => {
    if (open && expense) {
      form.setFieldsValue({
        title: expense.title,
        category: expense.category,
        amount: parseFloat(expense.amount),
        date: moment(expense.date),
        description: expense.description,
        recipient: expense.recipient,
        proof_image: [] // Reset tampilan upload
      });
    } else {
        form.resetFields();
    }
  }, [open, expense, form]);

  return (
    <Modal
      title="Edit Pengeluaran"
      open={open}
      onCancel={onCancel}
      footer={null}
      width={700}
      destroyOnClose
    >
      <Form 
        form={form} 
        layout="vertical" 
        onFinish={onSubmit} 
        style={{ marginTop: 24 }} 
      >
        <Form.Item name="title" label="Judul" rules={[{ required: true }]}>
          <Input />
        </Form.Item>

        <Form.Item name="category" label="Kategori" rules={[{ required: true }]}>
          <Select>
            {Object.entries(EXPENSE_CATEGORIES).map(([value, text]) => (
              <Option key={value} value={value}>{text}</Option>
            ))}
          </Select>
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="amount" label="Jumlah (Rp)" rules={[{ required: true }]}>
              <InputNumber
                style={{ width: '100%' }}
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="date" label="Tanggal" rules={[{ required: true }]}>
              <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="recipient" label="Penerima Dana">
          <Input placeholder="Siapa yang menerima uang?" />
        </Form.Item>

        <Form.Item name="description" label="Deskripsi">
          <Input.TextArea rows={3} />
        </Form.Item>

        <Form.Item 
            label="Upload Bukti Baru (Opsional)" 
            name="proof_image"
            valuePropName="fileList" 
            getValueFromEvent={(e) => Array.isArray(e) ? e : e?.fileList}
        >
            <Upload beforeUpload={() => false} maxCount={1} listType="picture">
                <Button icon={<UploadOutlined />}>Ganti File</Button>
            </Upload>
        </Form.Item>

        <Form.Item style={{ textAlign: 'right', marginTop: 24, marginBottom: 0 }}>
          <Space>
            <Button onClick={onCancel}>Batal</Button>
            <Button type="primary" htmlType="submit" loading={isSubmitting} style={{ backgroundColor: '#237804', borderColor: '#237804' }}>
              Simpan Perubahan
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

// --- MAIN CONTENT ---

function ExpenseDetailContent() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const expenseId = params.id;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  const user = useAuthStore((state) => state.user);
  const userRole = user?.role?.name || user?.role;
  const canEdit = ['Admin', 'Superadmin', 'Operator'].includes(userRole);

  // 1. Fetch Expense Detail
  const { data: expense, isLoading: isLoadingExpense, isError } = useQuery({
    queryKey: ['expense', expenseId],
    queryFn: () => getExpense(expenseId),
    enabled: !!expenseId,
  });

  // Logic Update
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateExpense(id, data),
    onSuccess: () => {
      message.success('Pengeluaran berhasil diperbarui');
      queryClient.invalidateQueries({ queryKey: ['expense', expenseId] });
      setIsModalOpen(false);
    },
    onError: (err) => message.error(`Gagal update: ${err.message}`)
  });

  // Logic Delete
  const deleteMutation = useMutation({
    mutationFn: deleteExpense,
    onSuccess: () => {
      message.success('Pengeluaran dihapus');
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      router.push('/admin/pengeluaran');
    },
    onError: (err) => message.error(`Gagal hapus: ${err.message}`)
  });

  if (isLoadingExpense) return <div style={{ textAlign: 'center', padding: 50 }}><Spin size="large" /></div>;
  if (isError || !expense) return <Alert message="Data tidak ditemukan" type="error" showIcon />;

  const categoryLabel = EXPENSE_CATEGORIES[expense.category] || expense.category;

  const handleUpdate = (values) => {
    const formData = new FormData();
    formData.append('title', values.title);
    formData.append('category', values.category);
    formData.append('amount', values.amount);
    formData.append('date', values.date.format('YYYY-MM-DD'));
    formData.append('description', values.description || '');
    formData.append('recipient', values.recipient || '');
    
    // PERBAIKAN: Cek dengan benar apakah ada file
    if (values.proof_image && values.proof_image.length > 0) {
        const file = values.proof_image[0];
        if (file.originFileObj) {
            formData.append('proof_image', file.originFileObj);
        }
    }

    updateMutation.mutate({ id: expense.id, data: formData });
  };

  return (
    <>
      {/* HEADER */}
      <Flex justify="space-between" align="center" style={{ marginBottom: 24 }} wrap="wrap" gap={16}>
        <Flex align="center" gap={16}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => router.push('/admin/pengeluaran')} style={{ borderRadius: '8px' }} />
          <div>
            <Title level={2} style={{ margin: 0 }}>Detail Pengeluaran</Title>
            <Text type="secondary">ID Transaksi: #{expense.id}</Text>
          </div>
        </Flex>
        
        {canEdit && (
          <Space>
            <Popconfirm
              title="Hapus Data?"
              description="Tindakan ini tidak dapat dibatalkan."
              onConfirm={() => deleteMutation.mutate(expense.id)}
              okText="Ya, Hapus"
              cancelText="Batal"
              okButtonProps={{ danger: true, loading: deleteMutation.isPending }}
            >
              <Button danger icon={<DeleteOutlined />} size="large" style={{ borderRadius: '24px' }}>Hapus</Button>
            </Popconfirm>
            <Button
              type="primary"
              icon={<EditOutlined />}
              size="large"
              style={{ backgroundColor: '#237804', borderRadius: '24px' }}
              onClick={() => setIsModalOpen(true)}
            >
              Edit Data
            </Button>
          </Space>
        )}
      </Flex>

      <Row gutter={[24, 24]}>
        {/* KOLOM KIRI: DETAIL UTAMA */}
        <Col xs={24} lg={16}>
          <Card title="Informasi Utama" style={{ borderRadius: '12px', border: '1px solid #E5E7EB', marginBottom: 24 }}>
            <Descriptions bordered column={1} labelStyle={{ width: '200px' }}>
                <Descriptions.Item label="Judul Pengeluaran">
                    <Text strong style={{ fontSize: '16px' }}>{expense.title}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Kategori">
                    <Tag color="blue">{categoryLabel}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Tanggal">
                    <Space><CalendarOutlined /> {formatDate(expense.date)}</Space>
                </Descriptions.Item>
                <Descriptions.Item label="Jumlah Nominal">
                    <Text strong style={{ color: '#CF1322', fontSize: '18px' }}>
                        - {formatRupiah(expense.amount)}
                    </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Penerima Dana">
                    <Space><UserOutlined /> {expense.recipient || '-'}</Space>
                </Descriptions.Item>
                <Descriptions.Item label="Keterangan">
                    {expense.description || '-'}
                </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* BUKTI PEMBAYARAN */}
          <Card title="Bukti Pembayaran / Dokumen" style={{ borderRadius: '12px', border: '1px solid #E5E7EB' }}>
             {expense.proof_image ? (
                 <div style={{ textAlign: 'center' }}>
                    <img 
                        src={expense.proof_image} 
                        alt="Bukti Pengeluaran" 
                        style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '8px', border: '1px solid #eee', marginBottom: 16 }} 
                    />
                    <br/>
                    <Button type="primary" href={expense.proof_image} target="_blank" icon={<LinkOutlined />}>
                        Buka di Tab Baru
                    </Button>
                 </div>
             ) : (
                 <div style={{ textAlign: 'center', padding: '32px', color: '#999' }}>
                    <InfoCircleOutlined style={{ fontSize: '24px', marginBottom: 8 }} />
                    <p>Tidak ada bukti pembayaran yang diunggah.</p>
                 </div>
             )}
          </Card>
        </Col>

        {/* KOLOM KANAN: STATS & METADATA */}
        <Col xs={24} lg={8}>
           <Space direction="vertical" style={{ width: '100%' }} size={24}>
              <InfoCard 
                 icon={<FileTextOutlined />} 
                 label="Total Keluar" 
                 value={formatRupiah(expense.amount)} 
                 iconColor="#CF1322" 
              />
              
              <InfoCard 
                 icon={<GiPayMoney />} 
                 label="Penerima" 
                 value={expense.recipient || 'Tidak Tercatat'} 
                 iconColor="#7CB305" 
              />

              <Card title="Metadata" style={{ borderRadius: '12px', border: '1px solid #E5E7EB' }}>
                 <Space direction="vertical" style={{ width: '100%' }}>
                    <Flex justify="space-between">
                        <Text type="secondary">Dibuat Pada</Text>
                        <Text strong>{moment(expense.created_at).format('DD/MM/YYYY HH:mm')}</Text>
                    </Flex>
                    {expense.updated_at && (
                        <Flex justify="space-between">
                            <Text type="secondary">Terakhir Update</Text>
                            <Text strong>{moment(expense.updated_at).format('DD/MM/YYYY HH:mm')}</Text>
                        </Flex>
                    )}
                 </Space>
              </Card>
           </Space>
        </Col>
      </Row>

      {/* MODAL EDIT */}
      <ExpenseFormModal 
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        expense={expense}
        form={form}
        onSubmit={handleUpdate}
        isSubmitting={updateMutation.isPending}
      />
    </>
  );
}

export default function ExpenseDetailPage() {
  return (
    <ProtectedRoute roles={['Superadmin', 'Admin', 'Operator', 'Investor', 'Viewer']}>
      <ExpenseDetailContent />
    </ProtectedRoute>
  );
}