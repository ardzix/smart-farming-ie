'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import moment from 'moment';

import {
  Button, Select, Card, Progress, Typography, Row, Col, Spin,
  Modal, Form, Input, DatePicker, InputNumber, message,
  Tag, Skeleton, Space, Alert, Upload, Divider
} from 'antd';

import {
  PlusCircleOutlined, UploadOutlined, SearchOutlined,
  UserOutlined, PhoneOutlined, InfoCircleOutlined, WarningOutlined,
  RiseOutlined
} from '@ant-design/icons';
import { FaMoneyBillTransfer, FaMoneyBills, FaChartPie } from 'react-icons/fa6';
import { GiPayMoney } from 'react-icons/gi';

import ProtectedRoute from '@/components/ProtectedRoute';
import useAuthStore from '@/lib/store/authStore'; 
import { getFundings, createFunding, updateFunding, deleteFunding } from '@/lib/api/funding';
import { getSettings } from '@/lib/api/settings';

const { Title, Text } = Typography;
const { Option } = Select;

// ================= CONSTANTS =================
const SOURCE_TYPE_MAP = {
  'investor': { text: 'Investor', color: 'blue' },
  'donation': { text: 'Donasi', color: 'green' },
};

const PAYMENT_METHOD_MAP = {
  'transfer': 'Transfer Bank',
  'cash': 'Tunai',
  'qris': 'QRIS/E-Wallet',
};

// ================= HELPERS =================
const formatRupiah = (value) =>
  value != null
    ? `Rp ${Number(value).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
    : '-';

const formatTanggal = (dateStr) => {
  if (!dateStr) return '-';
  return moment(dateStr, 'YYYY-MM-DD').format('D/M/YYYY');
};

const getSourceTypeProps = (type) => {
  const map = SOURCE_TYPE_MAP[type] || { text: type || 'Umum', color: 'default' };
  const style = {
    background: '#E1EFFE', 
    color: '#1E429F', 
    border: 'none', 
    fontWeight: 600, 
    fontSize: '14px', 
    padding: '4px 10px', 
    borderRadius: '6px',
    lineHeight: '17px',
  };
  if (type === 'donation') {
      style.background = '#DEF7EC';
      style.color = '#03543F';
  }
  return { text: map.text, style }; 
};

// ================= COMPONENTS =================

// 1. STATS CARD
const StatCard = ({ title, value, icon, bgColor, loading, subtitle }) => (
  <Card 
    bodyStyle={{ padding: '24px' }} 
    style={{
      background: '#FFFFFF',
      border: '1px solid #F0F0F0',
      boxShadow: '0px 1px 4px rgba(12, 12, 13, 0.1)',
      borderRadius: '12px',
      gap: '28px',
      marginBottom: '24px',
      height: '100%', 
      display: 'flex',       
      flexDirection: 'column', 
      justifyContent: 'center'
    }}
  >
    {loading ? (
      <Skeleton active avatar paragraph={{ rows: 1 }} />
    ) : (
      <div style={{ display: 'flex', alignItems: 'center', gap: '28px', height: '100%' }}>
        <div style={{ width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: bgColor }}>
          {icon}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Text style={{ fontSize: '18px', fontWeight: 600, color: '#585858', lineHeight: '150%', marginBottom: 0 }}>
            {title}
          </Text>
          <Text style={{ fontSize: '31px', fontWeight: 700, color: '#111928', lineHeight: '125%' }}>
            {value}
          </Text>
          {subtitle && (
             <Text type="secondary" style={{fontSize: '12px', marginTop: 4}}>{subtitle}</Text>
          )}
        </div>
      </div>
    )}
  </Card>
);

// 2. RINGKASAN CARD
const RingkasanCard = ({ data, loading }) => (
  <Card 
    bodyStyle={{ padding: '24px' }} 
    style={{
      background: '#FFFFFF',
      border: '1px solid #E5E7EB',
      boxShadow: '0px 4px 6px -1px rgba(0, 0, 0, 0.1)',
      borderRadius: '8px',
      height: '100%'
    }}
  >
    <Title level={5} style={{ fontSize: '22px', fontWeight: 700, color: '#111928', margin: 0, marginBottom: '20px' }}>
      Ringkasan Pendanaan per Sumber
    </Title>
    <Spin spinning={loading}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {!loading && data.length === 0 && <Text type="secondary">Belum ada data pendanaan.</Text>}
        {data.map((item, index) => {
          const sourceType = getSourceTypeProps(item.source_type);
          return (
            <div key={index} style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Tag style={sourceType.style}>{sourceType.text}</Tag>
                  <Text style={{ fontSize: '16px', fontWeight: 500, color: '#111928' }}>{item.source_name}</Text>
                </div>
                <Text style={{ fontSize: '16px', fontWeight: 500, color: '#111928' }}>{formatRupiah(item.totalAmount)}</Text>
              </div>
              <Progress percent={100} strokeColor="#1A56DB" trailColor="#E5E7EB" showInfo={false} strokeWidth={6} />
            </div>
          );
        })}
      </div>
    </Spin>
  </Card>
);

// 3. FUNDING CARD (ITEM LIST)
const FundingCard = ({ funding, onEditClick, onDetailClick, canEdit, onDelete }) => { 
  const sourceType = getSourceTypeProps(funding.source_type);
  
  return (
    <div style={{ padding: '20px', background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', marginBottom: '10px', boxShadow: '0px 2px 4px rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Tag style={sourceType.style}>{sourceType.text}</Tag>
            {funding.payment_method && (
                <Tag color="default" style={{ borderRadius: '6px' }}>{PAYMENT_METHOD_MAP[funding.payment_method] || funding.payment_method}</Tag>
            )}
          </div>
          <Title level={5} style={{ fontSize: '20px', fontWeight: 600, color: '#111928', margin: 0 }}>
            {funding.source_name}
          </Title>
          <Text style={{ fontSize: '16px', color: '#111928' }}>
            {funding.notes || 'Tidak ada catatan'}
          </Text>
          <Text type="secondary">Tanggal: {formatTanggal(funding.date_received)}</Text>
        </div>
        <div style={{ textAlign: 'right' }}>
          <Text style={{ fontSize: '16px', fontWeight: 500, color: '#7CB305' }}>
            {formatRupiah(funding.amount)}
          </Text>
          {funding.shares > 0 && funding.source_type === 'investor' && (
             <div style={{marginTop: 4}}>
                <Text style={{fontSize: '12px', color: '#1A56DB', fontWeight: 600}}>
                   <RiseOutlined /> {Number(funding.shares).toLocaleString()} Lembar Saham
                </Text>
             </div>
          )}
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '12px', paddingTop: '14px' }}>
        <Button onClick={() => onDetailClick(funding.id)} style={{ borderRadius: '8px', borderColor: '#237804', color: '#237804' }}>
          Detail
        </Button>
        {canEdit && (
          <Space>
            <Button onClick={() => onEditClick(funding)} style={{ borderRadius: '8px', background: '#237804', color: '#fff' }}>
                Edit
            </Button>
            {/* <Button danger onClick={() => onDelete(funding.id)} icon={<UserOutlined />} style={{ borderRadius: '8px' }}>
                Delete
            </Button> */}
          </Space>
        )}
      </div>
    </div>
  );
};

// 4. FUNDING MODAL (FORM)
const FundingModal = ({ visible, onClose, initialData, form, totalSoldShares, sharePrice, globalTotalShares }) => {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = Boolean(initialData);

  const sourceType = Form.useWatch('source_type', form); 
  const sharesInput = Form.useWatch('shares', form);

  // Hitung Ketersediaan Saham
  const currentTransactionShares = isEditMode ? (initialData.shares || 0) : 0;
  const availableShares = Math.max(0, globalTotalShares - (totalSoldShares - currentTransactionShares));
  const isSharesExhausted = availableShares <= 0;

  // Otomatisasi Harga (Investor Only)
  const calculatedAmount = useMemo(() => {
      if (sourceType === 'investor' && sharesInput) {
          return sharesInput * (sharePrice || 0);
      }
      return 0;
  }, [sourceType, sharesInput, sharePrice]);

  useEffect(() => {
      if (sourceType === 'investor') {
          form.setFieldsValue({ amount: calculatedAmount });
      }
  }, [calculatedAmount, sourceType, form]);

  const mutationOptions = {
    onSuccess: () => {
      message.success(`Pendanaan berhasil ${isEditMode ? 'diperbarui' : 'ditambahkan'}`);
      queryClient.invalidateQueries({ queryKey: ['fundings'] });
      queryClient.invalidateQueries({ queryKey: ['settings'] }); 
      onClose();
    },
    onError: (err) => message.error(err.response?.data?.detail || 'Terjadi kesalahan'),
    onSettled: () => setIsSubmitting(false),
  };

  const createMutation = useMutation({ mutationFn: createFunding, ...mutationOptions });
  const updateMutation = useMutation({ mutationFn: ({ id, data }) => updateFunding({ id, data }), ...mutationOptions });
  
  // [FIX] Mengatasi Error "forEach is not a function"
  // Upload AntD membutuhkan array object [{uid, name, status, url}] untuk fileList
  useEffect(() => {
    if (visible) {
      if (isEditMode && initialData) {
        // Konversi URL gambar string menjadi FileList Array
        let proofFileList = [];
        if (initialData.proof_image) {
            proofFileList = [{
                uid: '-1',
                name: 'Bukti Transfer',
                status: 'done',
                url: initialData.proof_image,
            }];
        }

        form.setFieldsValue({
          ...initialData,
          date_received: initialData.date_received ? moment(initialData.date_received) : null,
          proof_image: proofFileList, // Set sebagai array, bukan string
        });
      } else {
        form.resetFields();
      }
    }
  }, [visible, initialData, form, isEditMode]);

  const onFinish = (values) => {
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('source_name', values.source_name);
    formData.append('contact_info', values.contact_info || '');
    formData.append('source_type', values.source_type);
    
    const finalAmount = values.source_type === 'investor' ? calculatedAmount : values.amount;
    formData.append('amount', finalAmount);
    
    if (values.date_received) {
        formData.append('date_received', values.date_received.format('YYYY-MM-DD'));
    }
    
    formData.append('payment_method', values.payment_method);
    formData.append('notes', values.notes || '');

    if (values.source_type === 'investor') {
        formData.append('shares', values.shares || 0);
    } else {
        formData.append('shares', ''); 
    }

    // Handle Upload File
    if (values.proof_image && Array.isArray(values.proof_image)) {
         // Jika array langsung (dari getValueFromEvent)
         if (values.proof_image.length > 0 && values.proof_image[0].originFileObj) {
            formData.append('proof_image', values.proof_image[0].originFileObj);
         }
    } else if (values.proof_image?.fileList && values.proof_image.fileList.length > 0) {
         // Jika struct ant design standard
         if (values.proof_image.fileList[0].originFileObj) {
            formData.append('proof_image', values.proof_image.fileList[0].originFileObj);
         }
    }
    
    if (isEditMode) {
      updateMutation.mutate({ id: initialData.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  // Helper untuk mendapatkan file list dari event upload
  const normFile = (e) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList;
  };

  return (
    <Modal
      title={isEditMode ? 'Edit Pendanaan' : 'Tambah Pendanaan Baru'}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={700}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={onFinish} style={{ marginTop: 24 }}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Nama Investor/Donatur" name="source_name" rules={[{ required: true, message: 'Wajib diisi' }]}>
              <Input prefix={<UserOutlined />} placeholder="Nama Pemberi Dana" />
            </Form.Item>
          </Col>
          <Col span={12}>
             <Form.Item label="Kontak (HP/Email)" name="contact_info">
              <Input prefix={<PhoneOutlined />} placeholder="Contoh: 0812..." />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
            <Col span={12}>
                <Form.Item label="Tipe Dana" name="source_type" rules={[{ required: true, message: 'Tipe wajib dipilih' }]}>
                    <Select placeholder="Pilih tipe...">
                        {Object.entries(SOURCE_TYPE_MAP).map(([k, v]) => (
                            <Option key={k} value={k}>{v.text}</Option>
                        ))}
                    </Select>
                </Form.Item>
            </Col>
            <Col span={12}>
                <Form.Item label="Metode Pembayaran" name="payment_method" rules={[{ required: true, message: 'Metode wajib dipilih' }]}>
                    <Select placeholder="Pilih metode...">
                        {Object.entries(PAYMENT_METHOD_MAP).map(([k, v]) => (
                            <Option key={k} value={k}>{v}</Option>
                        ))}
                    </Select>
                </Form.Item>
            </Col>
        </Row>
        
        {sourceType === 'investor' && (
            <div style={{ background: '#F9FAFB', padding: '16px', borderRadius: '8px', marginBottom: '24px', border: '1px solid #E5E7EB' }}>
                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 12}}>
                    <Text strong>Info Ketersediaan Saham</Text>
                </div>
                
                {isSharesExhausted ? (
                    <Alert 
                        message="Stok Saham Habis" 
                        description="Tidak ada lembar saham yang tersedia untuk dibeli." 
                        type="error" 
                        showIcon 
                        icon={<WarningOutlined />}
                        style={{ marginBottom: 12 }}
                    />
                ) : (
                    <Alert 
                        message="Stok Tersedia" 
                        description={
                          <span>
                              Tersedia <b>{availableShares.toLocaleString()}</b> lembar dari total <b>{globalTotalShares.toLocaleString()}</b> lembar.
                              <br />
                              Harga saat ini: <b style={{ color: '#1A56DB' }}>{formatRupiah(sharePrice)}</b> / lembar
                          </span>
                        } 
                        type="info" 
                        showIcon 
                        icon={<InfoCircleOutlined />}
                        style={{ marginBottom: 12 }}
                    />
                )}

                <Form.Item 
                    label="Jumlah Lembar Saham Dibeli" 
                    name="shares" 
                    rules={[
                        { required: true, message: 'Investor wajib membeli saham' },
                        { type: 'number', min: 1, message: 'Minimal 1 lembar' },
                        { type: 'number', max: availableShares, message: `Maksimal pembelian adalah ${availableShares} lembar` }
                    ]}
                    style={{ marginBottom: 0 }}
                >
                    <InputNumber 
                        style={{ width: '100%' }} 
                        min={1} 
                        max={availableShares} 
                        placeholder="Masukkan jumlah lembar saham" 
                        disabled={isSharesExhausted}
                    />
                </Form.Item>
                
                <div style={{ textAlign: 'right', marginTop: 10 }}>
                    <Text type="secondary">Total Dana Masuk (Otomatis):</Text>
                    <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1A56DB' }}>
                        {formatRupiah(calculatedAmount)}
                    </div>
                    <Text type="secondary" style={{fontSize: 12}}>
                        ({sharesInput || 0} lbr x {formatRupiah(sharePrice)})
                    </Text>
                </div>

                <Form.Item name="amount" hidden>
                    <InputNumber />
                </Form.Item>
            </div>
        )}

        {sourceType && sourceType !== 'investor' && (
            <Row gutter={16}>
                <Col span={24}>
                    <Form.Item label="Jumlah Dana (Rp)" name="amount" rules={[{ required: true, message: 'Jumlah wajib diisi' }]}>
                        <InputNumber 
                            style={{ width: '100%' }} 
                            formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} 
                            parser={v => v.replace(/\$\s?|(,*)/g, '')} 
                            placeholder='0' 
                            size="large"
                        />
                    </Form.Item>
                </Col>
            </Row>
        )}

        <Form.Item label="Tanggal Diterima" name="date_received" rules={[{ required: true, message: 'Tanggal wajib diisi' }]}>
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Pilih tanggal" />
        </Form.Item>

        <Form.Item 
            label="Bukti Transfer" 
            name="proof_image" 
            valuePropName="fileList" 
            getValueFromEvent={normFile} // Gunakan helper normFile
            rules={[
                { 
                    validator: (_, value) => {
                        // Jika ada file baru diupload
                        if (value && value.length > 0) return Promise.resolve();
                        // Jika mode edit dan ada gambar lama (meski fileList kosong karena hanya URL)
                        if (isEditMode && initialData?.proof_image) return Promise.resolve();
                        // Jika tidak ada keduanya
                        return Promise.reject(new Error);
                    }
                },
                { required: true, message: 'Bukti transfer wajib diupload!'}
            ]}
        >
            <Upload beforeUpload={() => false} maxCount={1} listType="picture">
                <Button icon={<UploadOutlined />}>Upload File</Button>
            </Upload>
        </Form.Item>

        {isEditMode && initialData?.proof_image && (
            <div style={{ marginTop: -12, marginBottom: 24 }}>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                    *Gambar saat ini tersimpan. Upload baru untuk mengganti.
                </Text>
            </div>
        )}

        <Form.Item label="Catatan / Tujuan" name="notes">
          <Input.TextArea rows={3} placeholder="Keterangan tambahan..." />
        </Form.Item>

        <Form.Item style={{ textAlign: 'right', marginTop: 32 }}>
          <Button onClick={onClose} style={{ marginRight: 8 }}>Batal</Button>
          <Button type="primary" htmlType="submit" loading={isSubmitting} disabled={sourceType === 'investor' && isSharesExhausted && !isEditMode} style={{ background: '#237804', borderColor: '#237804' }}>
            {isEditMode ? 'Simpan Perubahan' : 'Simpan'}
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

// 5. MAIN CONTENT
function PendanaanContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingFunding, setEditingFunding] = useState(null);
  const [form] = Form.useForm();
  
  const user = useAuthStore((state) => state.user);
  const userRole = user?.role?.name || user?.role;
  const canEdit = ['Admin', 'Superadmin'].includes(userRole);

  const { data: rawFundings, isLoading: isLoadingFundings } = useQuery({
    queryKey: ['fundings'],
    queryFn: () => getFundings({}),
  });

  const { data: settings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['settings'],
    queryFn: getSettings,
  });

  const fundings = useMemo(() => {
      if (!rawFundings) return [];
      let filtered = Array.isArray(rawFundings) ? rawFundings : (rawFundings.results || []);

      if (searchTerm) {
        filtered = filtered.filter(f => 
          f.source_name.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      if (selectedPaymentMethod) {
        filtered = filtered.filter(f => f.payment_method === selectedPaymentMethod);
      }

      return filtered;
  }, [rawFundings, searchTerm, selectedPaymentMethod]);

  const totalSoldShares = useMemo(() => {
      return fundings.reduce((acc, curr) => {
          if (curr.source_type === 'investor') {
              return acc + (parseInt(curr.shares) || 0);
          }
          return acc;
      }, 0);
  }, [fundings]);

  const globalTotalShares = parseInt(settings?.total_shares || 0);
  const sharePrice = parseFloat(settings?.share_price || 0);
  const availableShares = Math.max(0, globalTotalShares - totalSoldShares);

  const deleteMutation = useMutation({
    mutationFn: deleteFunding,
    onSuccess: () => {
        message.success('Data dihapus');
        queryClient.invalidateQueries({ queryKey: ['fundings'] });
    },
    onError: () => message.error('Gagal hapus')
  });

  const ringkasanData = useMemo(() => {
    const summary = new Map();
    fundings.forEach(funding => {
      const sourceName = funding.source_name || 'Tanpa Nama';
      const sourceType = funding.source_type || 'investor';
      if (!summary.has(sourceName)) {
        summary.set(sourceName, { source_name: sourceName, source_type: sourceType, totalAmount: 0 });
      }
      summary.get(sourceName).totalAmount += parseFloat(funding.amount);
    });
    return Array.from(summary.values());
  }, [fundings]);

  const totalDana = useMemo(() => {
      return fundings.reduce((acc, curr) => acc + parseFloat(curr.amount || 0), 0);
  }, [fundings]);

  const handleOpenModal = (funding) => {
    setEditingFunding(funding);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setEditingFunding(null);
    form.resetFields();
  };
  
  const handleDetail = (id) => {
    router.push(`/admin/pendanaan/${id}`);
  };

  return (
    <div style={{ padding: '24px', backgroundColor: '#F9FAFB', minHeight: '100vh' }}> 
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', gap: '16px' }}>
        <div>
          <Title level={2} style={{ fontSize: '30px', fontWeight: 700, margin: 0, marginBottom: '6px' }}>
            {canEdit ? "Manajemen Pendanaan" : "Laporan Pendanaan"}
          </Title>
          <Text style={{ fontSize: '16px', color: '#727272' }}>
            Kelola dan pantau aliran dana masuk.
          </Text>
        </div>
        {canEdit && (
          <Button type="primary" icon={<PlusCircleOutlined />} size="large" onClick={() => handleOpenModal(null)} style={{ background: '#237804', borderRadius: '24px' }}>
            Tambah Dana
          </Button>
        )}
      </div>

      <Card bodyStyle={{ padding: '20px' }} style={{ marginBottom: '24px', borderRadius: '12px', border: '1px solid #F0F0F0' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={12}>
            <Text style={{ fontWeight: 600, color: '#374151', marginBottom: '8px', display: 'block' }}>
              Cari Sumber Dana
            </Text>
            <Input 
                size="large" 
                prefix={<SearchOutlined />} 
                placeholder="Ketik nama investor atau donatur..." 
                onChange={(e) => setSearchTerm(e.target.value)}
                allowClear
            />
          </Col>
          <Col xs={24} md={12}>
             <Text style={{ fontWeight: 600, color: '#374151', marginBottom: '8px', display: 'block' }}>
              Filter Metode Pembayaran
            </Text>
            <Select 
                size="large" 
                placeholder="Semua Metode" 
                style={{ width: '100%' }}
                allowClear
                onChange={setSelectedPaymentMethod}
            >
                {Object.entries(PAYMENT_METHOD_MAP).map(([key, label]) => (
                    <Option key={key} value={key}>{label}</Option>
                ))}
            </Select>
          </Col>
        </Row>
      </Card>

      <div style={{ marginBottom: '24px' }}>
        <Row gutter={[24, 24]} align="stretch">
            <Col xs={24} md={12}>
                <StatCard 
                    title="Total Pendanaan Masuk" 
                    value={formatRupiah(totalDana)} 
                    icon={<FaMoneyBillTransfer size={34} />} 
                    bgColor="#7CB305" 
                    loading={isLoadingFundings} 
                />
            </Col>
            <Col xs={24} md={12}>
                <StatCard 
                    title="Lembar Saham Terjual" 
                    value={`${totalSoldShares.toLocaleString()} Lembar`} 
                    icon={<FaChartPie size={34} />} 
                    bgColor="#1A56DB" 
                    loading={isLoadingSettings || isLoadingFundings}
                    subtitle={`Dari Total Global: ${globalTotalShares.toLocaleString()} Lembar (Sisa: ${availableShares.toLocaleString()})`}
                />
            </Col>
        </Row>
      </div>

      {/* [FIX] LAYOUT DIKEMBALIKAN KE ATAS-BAWAH */}
      <Row gutter={[0, 24]}>
        <Col xs={24}> 
            <RingkasanCard data={ringkasanData} loading={isLoadingFundings} />
        </Col>
        
        <Col xs={24}> 
            <Card bodyStyle={{ padding: '24px' }} style={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}>
            <Title level={5} style={{ fontSize: '22px', marginBottom: '20px' }}>Daftar Riwayat Pendanaan</Title>
            
            <Spin spinning={isLoadingFundings}>
                {fundings && fundings.length > 0 ? (
                <div>
                    {fundings.map(funding => (
                    <FundingCard 
                        key={funding.id} 
                        funding={funding} 
                        canEdit={canEdit} 
                        onEditClick={handleOpenModal}
                        onDetailClick={handleDetail}
                        onDelete={deleteMutation.mutate}
                    />
                    ))}
                </div>
                ) : (
                !isLoadingFundings && <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>Tidak ada data ditemukan.</div>
                )}
            </Spin>
            </Card>
        </Col>
      </Row>
            
      <FundingModal 
        visible={modalVisible} 
        onClose={handleCloseModal} 
        initialData={editingFunding} 
        form={form} 
        sharePrice={sharePrice}
        availableShares={availableShares}
        globalTotalShares={globalTotalShares}
        totalSoldShares={totalSoldShares}
      />
    </div>
  );
}

export default function PendanaanPage() {
  return (
    <ProtectedRoute roles={['Superadmin', 'Admin', 'Operator', 'Investor', 'Viewer']}>
      <PendanaanContent />
    </ProtectedRoute>
  );
}