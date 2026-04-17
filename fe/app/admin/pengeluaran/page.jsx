'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button, Modal, Form, Select, InputNumber, DatePicker, Input, Typography, Flex, Space,
  message, Spin, Alert, Card, Row, Col, Skeleton, Tag, Upload
} from 'antd';
import {
  PlusCircleOutlined, LinkOutlined, SearchOutlined, CloseCircleOutlined,
  UploadOutlined, EyeOutlined, EditOutlined, DeleteOutlined
} from '@ant-design/icons';
import { GiPayMoney } from 'react-icons/gi';
import { FaMoneyBillWave } from 'react-icons/fa6';
import { BiMoneyWithdraw } from 'react-icons/bi';
import { ChevronDown } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import moment from 'moment';
import ProtectedRoute from '@/components/ProtectedRoute';
import useAuthStore from '@/lib/store/authStore';
import { getExpenses, createExpense, updateExpense } from '@/lib/api/expense';

const { Title, Text } = Typography;
const { Option } = Select;

const formatRupiah = (value) =>
  value != null
    ? `Rp ${Number(value).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
    : 'Rp 0';

const formatDate = (dateString) => dateString ? moment(dateString).format('D/M/YYYY') : '-';

const EXPENSE_CATEGORIES = {
  'OPERATIONAL': 'Operational Cost',
  'SALARY': 'Salary/Wages',
  'ASSET_PURCHASE': 'Asset Purchase',
  'TAX': 'Tax & Legal',
  'OTHERS': 'Others',
};

// --- HELPER FUNCTIONS ---
const calculateCategoryTotals = (expenses) => {
  if (!expenses) return { OPERATIONAL: 0, SALARY: 0, ASSET_PURCHASE: 0, OTHERS: 0 };
  const totals = { OPERATIONAL: 0, SALARY: 0, ASSET_PURCHASE: 0, OTHERS: 0 };
  expenses.forEach(exp => {
    const amount = parseFloat(exp.amount) || 0;
    const category = totals[exp.category] !== undefined ? exp.category : 'OPERATIONAL';
    totals[category] += amount;
  });
  return totals;
};

// --- COMPONENTS ---
const StatCard = ({ title, value, icon, loading, iconColor }) => {
  const displayValue = () => {
    if (loading) return <Skeleton.Input active size="small" style={{ width: 120, height: 38 }} />;
    return formatRupiah(value);
  };

  return (
    <Card 
      styles={{ body: { padding: '24px' } }}
      style={{
        background: '#FFFFFF',
        border: '1px solid #F0F0F0',
        borderRadius: '12px',
        boxShadow: '0px 1px 4px rgba(12, 12, 13, 0.1)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
        <div style={{ flexShrink: 0, color: iconColor, fontSize: '34px' }}>{icon}</div>
        <div style={{ flex: 1 }}>
          <Text style={{ fontSize: '18px', fontWeight: 600, color: '#585858', display: 'block' }}>{title}</Text>
          <Text style={{ fontSize: '31px', fontWeight: 700, color: '#111928' }}>{displayValue()}</Text>
        </div>
      </div>
    </Card>
  );
};

const ExpenseCard = ({ expense, onEditClick, onDetailClick, canEdit }) => {
  const categoryLabel = EXPENSE_CATEGORIES[expense.category] || expense.category;
  
  const getCategoryColor = () => {
    switch (expense.category) {
      case 'OPERATIONAL': return { background: '#E1EFFE', color: '#1E429F' };
      case 'ASSET_PURCHASE': return { background: '#D5F5E3', color: '#27AE60' };
      case 'SALARY': return { background: '#FFE1E1', color: '#E74C3C' };
      default: return { background: '#F3F4F6', color: '#6B7280' };
    }
  };
  
  const tagColor = getCategoryColor();
  
  return (
    <Card 
      styles={{ body: { padding: '20px' } }}
      style={{
        marginBottom: '16px',
        border: '1px solid #E5E7EB',
        borderRadius: '8px',
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.15)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <Space size="small" style={{ marginBottom: '10px' }}>
            <Tag style={{ 
              background: tagColor.background, color: tagColor.color, 
              border: 'none', fontWeight: 600, fontSize: '14px', padding: '4px 10px', borderRadius: '6px' 
            }}>
              {categoryLabel}
            </Tag>
          </Space>
          
          <Title level={4} style={{ margin: '0 0 5px 0', fontSize: '20px', fontWeight: 600, color: '#111928' }}>
            {expense.title} 
          </Title>
          <Text style={{ fontSize: '14px', color: '#555', display: 'block', marginBottom: '10px' }}>
            {expense.description}
          </Text>
          
          <Text style={{ fontSize: '16px', fontWeight: 500, color: '#111928', display: 'block', marginBottom: '20px' }}>
            Tanggal: {formatDate(expense.date)} • Penerima: {expense.recipient || '-'}
          </Text>
          
          <Space>
            {/* Tombol Detail Baru */}
            <Button onClick={() => onDetailClick(expense.id)} icon={<EyeOutlined />} style={{ borderRadius: '8px' }}>
                Detail
            </Button>

            {canEdit && (
              <Button 
                style={{ 
                  background: '#237804', borderColor: '#237804', borderRadius: '8px', 
                  color: '#FFFFFF', fontSize: '14px', fontWeight: 500 
                }} 
                onClick={() => onEditClick(expense)}
                icon={<EditOutlined />}
              >
                Edit
              </Button>
            )}
          </Space>
        </div>

        <div style={{ textAlign: 'right' }}>
          <Text style={{ fontSize: '24px', fontWeight: 700, color: '#CF1322', display: 'block' }}>
            - {formatRupiah(expense.amount)}
          </Text>
          
          {expense.proof_image && (
             <a href={expense.proof_image} target="_blank" rel="noopener noreferrer" style={{ display: 'block', marginTop: 8, color: '#1E429F' }}>
                <LinkOutlined /> Lihat Bukti
             </a>
          )}
        </div>
      </div>
    </Card>
  );
};

// ===== PERBAIKAN DI ExpenseModal Component =====

const ExpenseModal = ({ visible, onClose, initialData, form }) => {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = Boolean(initialData);

  const mutationOptions = {
    onSuccess: () => {
      message.success(isEditMode ? 'Pengeluaran diperbarui' : 'Pengeluaran ditambahkan');
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      onClose();
    },
    onError: (err) => {
      const errorDetail = err.response?.data?.detail || err.message;
      message.error(`Error: ${errorDetail}`);
    },
    onSettled: () => setIsSubmitting(false),
  };

  const createMutation = useMutation({ mutationFn: createExpense, ...mutationOptions });
  const updateMutation = useMutation({ mutationFn: ({ id, data }) => updateExpense(id, data), ...mutationOptions });

  useEffect(() => {
    if (visible) {
      if (isEditMode && initialData) {
        form.setFieldsValue({
          title: initialData.title,
          category: initialData.category,
          amount: parseFloat(initialData.amount),
          date: moment(initialData.date),
          description: initialData.description,
          recipient: initialData.recipient,
          // PERBAIKAN: Jangan set proof_image di edit mode, biarkan kosong
          proof_image: undefined
        });
      } else {
        form.resetFields();
      }
    }
  }, [visible, initialData, form, isEditMode]);

  const onFinish = (values) => {
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('title', values.title);
    formData.append('category', values.category);
    formData.append('amount', values.amount);
    formData.append('date', values.date.format('YYYY-MM-DD'));
    formData.append('description', values.description || '');
    formData.append('recipient', values.recipient || '');

    // PERBAIKAN: Cek dengan benar apakah ada file yang di-upload
    if (values.proof_image && values.proof_image.length > 0) {
        const file = values.proof_image[0];
        if (file.originFileObj) {
            formData.append('proof_image', file.originFileObj);
        }
    }
    
    // DEBUG: Uncomment untuk cek isi FormData
    // for (let pair of formData.entries()) {
    //     console.log(pair[0], pair[1]);
    // }
    
    if (isEditMode) {
      updateMutation.mutate({ id: initialData.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  // PERBAIKAN: normFile untuk handle Upload component
  const normFile = (e) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList;
  };

  return (
    <Modal
      title={isEditMode ? 'Edit Pengeluaran' : 'Tambah Pengeluaran Baru'}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={700}
      destroyOnClose={true}
    >
      <Form form={form} layout="vertical" onFinish={onFinish} style={{ marginTop: 24 }}>
        <Form.Item name="title" label="Judul Pengeluaran" rules={[{ required: true }]}>
          <Input placeholder="Contoh: Beli Pakan Ayam" size="large" />
        </Form.Item>

        <Form.Item name="category" label="Kategori" rules={[{ required: true }]}>
          <Select placeholder="Pilih kategori" size="large">
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
                min={0}
                size="large"
              />
            </Form.Item>
          </Col>
           <Col span={12}>
            <Form.Item name="date" label="Tanggal" rules={[{ required: true }]}>
              <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" size="large" />
            </Form.Item>
          </Col>
        </Row>
        
        <Form.Item name="recipient" label="Penerima Dana (Opsional)">
          <Input placeholder="Siapa yang menerima uang?" size="large" />
        </Form.Item>

        <Form.Item name="description" label="Deskripsi Detail">
          <Input.TextArea rows={3} placeholder="Jelaskan detail pengeluaran" />
        </Form.Item>
        
        {/* PERBAIKAN UTAMA: Form.Item untuk Upload */}
        <Form.Item 
            label="Bukti Pembayaran / Struk" 
            name="proof_image"
            valuePropName="fileList"
            getValueFromEvent={normFile}
            rules={[{ required: true, message: 'Wajib Upload Bukti Pembayaran/Struk!' }]}
        >
            <Upload 
                beforeUpload={() => false} 
                maxCount={1} 
                listType="picture"
                accept="image/*"
            >
                <Button icon={<UploadOutlined />}>Upload File</Button>
            </Upload>
        </Form.Item>

        {isEditMode && initialData?.proof_image && (
            <div style={{ marginTop: -12, marginBottom: 24 }}>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                    File saat ini: <a href={initialData.proof_image} target="_blank" rel="noopener noreferrer">Lihat Bukti</a>
                </Text>
            </div>
        )}

        <Form.Item style={{ textAlign: 'right', marginTop: 32, marginBottom: 0 }}>
          <Space>
            <Button onClick={onClose}>Batal</Button>
            <Button type="primary" htmlType="submit" loading={isSubmitting} style={{ backgroundColor: '#237804', borderColor: '#237804' }}>
              {isEditMode ? 'Simpan Perubahan' : 'Tambah Pengeluaran'}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

// ===== PERBAIKAN DI ExpenseFormModal (Detail Page) =====

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
        proof_image: undefined // PERBAIKAN: Biarkan kosong
      });
    } else {
        form.resetFields();
    }
  }, [open, expense, form]);

  // PERBAIKAN: Tambahkan normFile
  const normFile = (e) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList;
  };

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

        {/* PERBAIKAN: Upload dengan normFile */}
        <Form.Item 
            label="Upload Bukti Baru (Opsional)" 
            name="proof_image"
            valuePropName="fileList"
            getValueFromEvent={normFile}
        >
            <Upload 
                beforeUpload={() => false} 
                maxCount={1} 
                listType="picture"
                accept="image/*"
            >
                <Button icon={<UploadOutlined />}>Ganti File</Button>
            </Upload>
        </Form.Item>

        {expense?.proof_image && (
            <div style={{ marginTop: -12, marginBottom: 24 }}>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                    File saat ini: <a href={expense.proof_image} target="_blank" rel="noopener noreferrer">Lihat Bukti</a>
                </Text>
            </div>
        )}

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

// --- MAIN PAGE ---
function ExpenseManagementContent() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [form] = Form.useForm();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const user = useAuthStore((state) => state.user);
  const userRole = user?.role?.name || user?.role;
  const canEdit = ['Admin', 'Superadmin', 'Operator'].includes(userRole);

  const { data: expenses, isLoading: isLoadingExpenses, isError, error } = useQuery({ 
    queryKey: ['expenses'], 
    queryFn: getExpenses 
  });

  const filteredExpenses = useMemo(() => {
    if (!expenses) return [];
    return expenses.filter(e => {
      const term = searchTerm.toLowerCase();
      const matchesSearch = (e.description || '').toLowerCase().includes(term) || (e.title || '').toLowerCase().includes(term);
      const matchesCategory = selectedCategory === 'all' || e.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [expenses, searchTerm, selectedCategory]);

  const showAddModal = () => { setEditingExpense(null); form.resetFields(); setIsModalOpen(true); };
  const showEditModal = (expense) => { setEditingExpense(expense); setIsModalOpen(true); };
  const handleCancel = () => { setIsModalOpen(false); setEditingExpense(null); form.resetFields(); };
  
  // Handler Navigasi Detail
  const handleDetail = (id) => { router.push(`/admin/pengeluaran/${id}`); };

  const totalPengeluaran = useMemo(() => {
      return filteredExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  }, [filteredExpenses]);

  const categoryTotals = useMemo(() => calculateCategoryTotals(filteredExpenses), [filteredExpenses]);

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <Title level={2} style={{ margin: 0, color: '#111928', fontWeight: 700, fontSize: '30px' }}>
            Manajemen Pengeluaran
          </Title>
          <Text style={{ fontSize: '16px', fontWeight: 500, color: '#727272' }}>
            Kelola semua pengeluaran operasional Integrated Estate.
          </Text>
        </div>
        {canEdit && (
          <Button type="primary" icon={<PlusCircleOutlined />} size="large" style={{ backgroundColor: '#237804', borderRadius: '24px' }} onClick={showAddModal}>
            Tambah Pengeluaran
          </Button>
        )}
      </div>

      <Row gutter={[18, 18]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12}>
          <StatCard title="Total Pengeluaran" value={totalPengeluaran} icon={<GiPayMoney />} loading={isLoadingExpenses} iconColor="#0958D9" />
        </Col>
        <Col xs={24} sm={12}>
          <StatCard title="Operasional" value={categoryTotals.OPERATIONAL} icon={<FaMoneyBillWave />} loading={isLoadingExpenses} iconColor="#1E429F" />
        </Col>
        <Col xs={24} sm={12}>
          <StatCard title="Pembelian Aset" value={categoryTotals.ASSET_PURCHASE} icon={<BiMoneyWithdraw />} loading={isLoadingExpenses} iconColor="#27AE60" />
        </Col>
        <Col xs={24} sm={12}>
          <StatCard title="Gaji" value={categoryTotals.SALARY} icon={<GiPayMoney />} loading={isLoadingExpenses} iconColor="#E74C3C" />
        </Col>
      </Row>

      <Card styles={{ body: { padding: '24px' } }} style={{ marginBottom: 24, border: '1px solid #E5E7EB', borderRadius: '12px' }}>
        <Title level={4} style={{ marginBottom: '20px', fontSize: '24px', fontWeight: 500, color: '#111928' }}>Pencarian & Filter</Title>
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', flex: 1, maxWidth: '412px', background: '#FFFFFF', border: '1px solid #D9D9D9', borderRadius: '8px', overflow: 'hidden' }}>
            <Input placeholder="Cari Judul atau Deskripsi..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ border: 'none', flex: 1, padding: '8px 12px' }} suffix={searchTerm && <CloseCircleOutlined onClick={() => setSearchTerm('')} />} />
            <Button type="primary" icon={<SearchOutlined />} style={{ background: '#237804', borderRadius: '0px', height: '40px', width: '46px' }} />
          </div>
          <Select value={selectedCategory} size="large" style={{ width: 200, height: '40px' }} onChange={setSelectedCategory} placeholder="Semua Kategori">
            <Option value="all">Semua Kategori</Option>
            {Object.entries(EXPENSE_CATEGORIES).map(([val, label]) => <Option key={val} value={val}>{label}</Option>)}
          </Select>
        </div>
      </Card>

      <Card styles={{ body: { padding: '24px' } }} style={{ marginBottom: 24, border: '1px solid #E5E7EB', borderRadius: '8px' }}>
        <Title level={4} style={{ marginBottom: '20px', fontSize: '22px', fontWeight: 700, color: '#111928' }}>Daftar Pengeluaran</Title>
        {isLoadingExpenses && <div style={{ textAlign: 'center', padding: '48px' }}><Spin size="large" /></div>}
        {isError && !isLoadingExpenses && <Alert message="Error Memuat Data" description={error?.message} type="error" showIcon />}
        {!isLoadingExpenses && !isError && (
          <div>
            {filteredExpenses && filteredExpenses.length > 0 ? (
              filteredExpenses.map(exp => (
                <ExpenseCard 
                  key={exp.id} 
                  expense={exp} 
                  onEditClick={showEditModal} 
                  onDetailClick={handleDetail}
                  canEdit={canEdit} 
                />
              ))
            ) : (
              <div style={{ border: '1px dashed #d9d9d9', borderRadius: '8px', padding: '32px', textAlign: 'center' }}>
                <Text type="secondary">Tidak ada data pengeluaran ditemukan.</Text>
              </div>
            )}
          </div>
        )}
      </Card>

      <ExpenseModal visible={isModalOpen} onClose={handleCancel} initialData={editingExpense} form={form} />
    </>
  );
}

export default function ExpensePage() {
  return (
    <ProtectedRoute roles={['Superadmin', 'Admin', 'Operator', 'Investor', 'Viewer']}>
      <ExpenseManagementContent />
    </ProtectedRoute>
  );
}