'use client';
import React, { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Card, Button, Typography, Space, Tag, Flex, Spin, Alert, Descriptions, Row, Col,
  Modal, Form, Input, Select, DatePicker, InputNumber, message, Popconfirm, Image, Upload
} from 'antd';
import {
  ArrowLeftOutlined, EditOutlined, DeleteOutlined,
  UserOutlined, PhoneOutlined, BankOutlined, UploadOutlined,
  InfoCircleOutlined, WarningOutlined
} from '@ant-design/icons';
import { FaMoneyBillTransfer } from 'react-icons/fa6';
import { BiSolidCalendar } from 'react-icons/bi';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import moment from 'moment';
import ProtectedRoute from '@/components/ProtectedRoute';
import useAuthStore from '@/lib/store/authStore'; 

import {
  getFunding,
  getFundings, // [NEW] Butuh ini untuk hitung totalSoldShares global
  updateFunding,
  deleteFunding, 
} from '@/lib/api/funding';
import { getSettings } from '@/lib/api/settings'; // [NEW] Import Settings

const { Title, Text } = Typography;
const { Option } = Select;

const formatRupiah = (value) =>
  value != null
    ? `Rp ${Number(value).toLocaleString('id-ID', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })}`
    : 'Rp 0';

const formatTanggal = (dateStr) => {
  if (!dateStr) return '-';
  return moment(dateStr, 'YYYY-MM-DD').format('D/M/YYYY');
};

const SOURCE_TYPE_MAP = {
  'investor': { text: 'Investor', color: 'blue' },
  'donation': { text: 'Donasi', color: 'green' },
};

const PAYMENT_METHOD_MAP = {
  'transfer': 'Transfer Bank',
  'cash': 'Tunai',
  'qris': 'QRIS/E-Wallet',
};

const getSourceTypeProps = (type) => {
  let text = type;
  let style = {
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
  } else {
      const map = SOURCE_TYPE_MAP[type];
      if (map) text = map.text;
  }
  
  return { text, style }; 
};

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

// EDIT MODAL (UPDATED LOGIC & VALIDATION)
const FundingModal = ({ visible, onClose, initialData, form }) => {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const sourceType = Form.useWatch('source_type', form);
  
  // [NEW] 1. Ambil Data Global (Settings & All Fundings) untuk hitung stok
  const { data: settings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['settings'],
    queryFn: getSettings,
    enabled: visible
  });

  const { data: allFundings } = useQuery({
    queryKey: ['fundings'],
    queryFn: () => getFundings({}), // Ambil semua untuk hitung total terjual
    enabled: visible
  });

  // [NEW] 2. Hitung Stok Saham
  const globalTotalShares = settings?.total_shares || 0;
  
  const totalSoldShares = useMemo(() => {
      if (!allFundings) return 0;
      return allFundings.reduce((acc, curr) => {
          if (curr.source_type === 'investor') {
              return acc + (parseInt(curr.shares) || 0);
          }
          return acc;
      }, 0);
  }, [allFundings]);

  // Saat edit, saham transaksi ini dikembalikan ke pool agar bisa diedit
  const currentTransactionShares = initialData?.shares || 0;
  const availableShares = Math.max(0, globalTotalShares - (totalSoldShares - currentTransactionShares));
  const isSharesExhausted = availableShares <= 0;

  const mutation = useMutation({ 
      mutationFn: ({ id, data }) => updateFunding({ id, data }), 
      onSuccess: () => { 
          message.success('Pendanaan diperbarui'); 
          queryClient.invalidateQueries({ queryKey: ['funding', initialData.id] }); 
          // Invalidate list juga agar total saham terupdate di halaman lain
          queryClient.invalidateQueries({ queryKey: ['fundings'] });
          onClose(); 
      },
      onError: (err) => message.error(`Gagal: ${err.message}`),
      onSettled: () => setIsSubmitting(false)
  });
  
  const onFinish = (values) => {
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('source_name', values.source_name);
    formData.append('contact_info', values.contact_info || '');
    formData.append('source_type', values.source_type);
    formData.append('amount', values.amount);
    if (values.date_received) formData.append('date_received', values.date_received.format('YYYY-MM-DD'));
    formData.append('payment_method', values.payment_method);
    formData.append('notes', values.notes || '');

    if (values.source_type === 'investor') {
        formData.append('shares', values.shares || 0);
    } else {
        formData.append('shares', ''); 
    }

    // [FIX ERROR] Handle Upload dengan aman
    if (values.proof_image && values.proof_image.fileList && values.proof_image.fileList.length > 0) {
        // Jika user mengupload file baru
        if (values.proof_image.fileList[0].originFileObj) {
            formData.append('proof_image', values.proof_image.fileList[0].originFileObj);
        }
    }

    mutation.mutate({ id: initialData.id, data: formData });
  };

  return (
    <Modal title="Edit Pendanaan" open={visible} onCancel={onClose} footer={null} width={700} centered destroyOnClose>
       <Form 
        form={form} 
        layout="vertical" 
        onFinish={onFinish} 
        initialValues={{
            ...initialData, 
            date_received: moment(initialData?.date_received),
            // [FIX ERROR] Jangan set proof_image string ke Upload component langsung
            // Biarkan kosong jika tidak ada perubahan, atau handle manual display
            proof_image: undefined 
        }} 
        style={{marginTop: 24}}
       >
          <Row gutter={16}>
            <Col span={12}>
                <Form.Item name="source_name" label="Nama Investor" rules={[{required:true}]}><Input prefix={<UserOutlined/>}/></Form.Item>
            </Col>
            <Col span={12}>
                <Form.Item name="contact_info" label="Kontak"><Input prefix={<PhoneOutlined/>}/></Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
             <Col span={12}>
                <Form.Item name="source_type" label="Tipe">
                    <Select>{Object.entries(SOURCE_TYPE_MAP).map(([k,v]) => <Option key={k} value={k}>{v.text}</Option>)}</Select>
                </Form.Item>
             </Col>
             <Col span={12}>
                <Form.Item name="payment_method" label="Metode Bayar">
                    <Select>{Object.entries(PAYMENT_METHOD_MAP).map(([k,v]) => <Option key={k} value={k}>{v}</Option>)}</Select>
                </Form.Item>
             </Col>
          </Row>
          
          {/* [NEW] INFO SAHAM & VALIDASI */}
          {sourceType === 'investor' && (
             <div style={{ background: '#F9FAFB', padding: '16px', borderRadius: '8px', marginBottom: '24px', border: '1px solid #E5E7EB' }}>
                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 12}}>
                    <Text strong>Info Ketersediaan Saham</Text>
                    {isLoadingSettings && <Spin size="small" />}
                </div>
                
                {isSharesExhausted ? (
                    <Alert 
                        message="Stok Saham Habis" 
                        description="Tidak ada lembar saham tambahan yang tersedia." 
                        type="warning" 
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
                              Harga: <b style={{ color: '#1A56DB' }}>{formatRupiah(settings?.share_price)}</b> / lembar
                          </span>
                        } 
                        type="info" 
                        showIcon 
                        icon={<InfoCircleOutlined />}
                        style={{ marginBottom: 12 }}
                    />
                )}

                <Form.Item 
                    name="shares" 
                    label="Saham Dimiliki" 
                    rules={[
                        { required: true, message: 'Wajib diisi' },
                        { 
                            type: 'number', 
                            max: availableShares, 
                            message: `Maksimal kepemilikan total (termasuk yang baru) adalah ${availableShares} lembar` 
                        }
                    ]}
                    style={{ marginBottom: 0 }}
                >
                    <InputNumber 
                        style={{ width: '100%' }} 
                        min={1} 
                        max={availableShares}
                        disabled={isSharesExhausted && currentTransactionShares >= availableShares} // Disable jika habis dan user mau nambah
                    />
                </Form.Item>
             </div>
          )}

          <Row gutter={16}>
            <Col span={12}><Form.Item name="amount" label="Jumlah (Rp)" rules={[{required:true}]}><InputNumber style={{width: '100%'}} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={v => v.replace(/,/g, '')}/></Form.Item></Col>
            <Col span={12}><Form.Item name="date_received" label="Tanggal" rules={[{required:true}]}><DatePicker style={{width: '100%'}} /></Form.Item></Col>
          </Row>

          <Form.Item label="Bukti Transfer (Upload Baru)" name="proof_image" valuePropName="fileList" getValueFromEvent={(e) => Array.isArray(e) ? e : e?.fileList}>
                <Upload beforeUpload={() => false} maxCount={1} listType="picture"><Button icon={<UploadOutlined />}>Ganti Bukti</Button></Upload>
          </Form.Item>

          <Form.Item name="notes" label="Catatan"><Input.TextArea /></Form.Item>
          
          <Form.Item style={{textAlign:'right', marginBottom: 0}}><Space style={{ width: '100%', justifyContent: 'flex-end' }}><Button onClick={onClose}>Batal</Button><Button type="primary" htmlType="submit" loading={mutation.isPending}>Simpan Perubahan</Button></Space></Form.Item>
       </Form>
    </Modal>
  );
};

function FundingDetailContent() {
  const router = useRouter();
  const params = useParams();
  const fundingId = params.id;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  const user = useAuthStore((state) => state.user);
  const userRole = user?.role?.name || user?.role;
  const canEdit = ['Admin', 'Superadmin'].includes(userRole);

  const { data: funding, isLoading: isLoadingFunding, isError, error } = useQuery({
    queryKey: ['funding', fundingId],
    queryFn: () => getFunding(fundingId),
    enabled: !!fundingId,
  });

  const deleteMutation = useMutation({ 
      mutationFn: deleteFunding, 
      onSuccess: () => { message.success('Dihapus'); router.push('/admin/pendanaan'); },
      onError: (err) => message.error(`Gagal menghapus: ${err.message}`)
  });

  const handleBack = () => {
    router.push('/admin/pendanaan');
  };

  const handleEdit = () => {
    setIsModalOpen(true);
  };

  const handleDelete = () => {
    deleteMutation.mutate(funding.id);
  };

  if (isLoadingFunding) return <div style={{ textAlign: 'center', padding: 50 }}><Spin size="large" /></div>;
  if (isError) return <Alert message="Error" description={error?.message} type="error" showIcon />;
  if (!funding) return <Alert message="Tidak Ditemukan" type="warning" showIcon />;
  
  const sourceTypeProps = getSourceTypeProps(funding.source_type);

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
              Detail Pendanaan
            </Title>
            <Text style={{ fontSize: '16px', fontWeight: 500, color: '#727272', lineHeight: '19px' }}>
              Informasi lengkap mengenai alokasi dana
            </Text>
          </div>
        </Flex>
        
        {canEdit && (
          <Space>
              <Popconfirm 
                title="Hapus Pendanaan?" 
                description="Yakin hapus data ini?" 
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
                Edit Pendanaan
            </Button>
          </Space>
        )}
      </Flex>

      <Row gutter={[24, 24]}>
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
                  {funding.source_name}
                </Title>
                <Space wrap>
                  <Tag style={sourceTypeProps.style}>{sourceTypeProps.text}</Tag>
                  <Tag>{PAYMENT_METHOD_MAP[funding.payment_method] || funding.payment_method}</Tag>
                </Space>
              </div>
              <Text style={{ fontWeight: 600, fontSize: '24px', color: '#7CB305', flexShrink: 0 }}>
                {formatRupiah(funding.amount)}
              </Text>
            </Flex>

            <Space direction="vertical" style={{ width: '100%' }} size={16}>
              <Flex align="center" gap={12}>
                <BankOutlined style={{ color: '#D46B08', fontSize: '24px', flexShrink: 0 }} />
                <div>
                  <Text style={{ fontSize: '12px', color: '#6B7280', display: 'block' }}>Sumber Dana</Text>
                  <Text style={{ fontSize: '16px', fontWeight: 500, color: '#111928' }}>{funding.source_name}</Text>
                </div>
              </Flex>

              <Flex align="center" gap={12}>
                <BiSolidCalendar style={{ color: '#531DAB', fontSize: '24px', flexShrink: 0 }} />
                <div>
                  <Text style={{ fontSize: '12px', color: '#6B7280', display: 'block' }}>Tanggal Diterima</Text>
                  <Text style={{ fontSize: '16px', fontWeight: 500, color: '#111928' }}>{formatTanggal(funding.date_received)}</Text>
                </div>
              </Flex>
            </Space>
          </Card>

          <Card 
            title="Informasi Detail"
            style={{
              border: '1px solid #E5E7EB',
              borderRadius: '12px',
              boxShadow: '0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -2px rgba(0, 0, 0, 0.05)',
            }}
          >
            <Descriptions bordered column={1} size="middle">
              <Descriptions.Item label="Kontak">{funding.contact_info || '-'}</Descriptions.Item>
              <Descriptions.Item label="Catatan">{funding.notes || '-'}</Descriptions.Item>
              {funding.source_type === 'investor' && (
                 <Descriptions.Item label="Saham">{funding.shares} Lembar</Descriptions.Item>
              )}
              {funding.proof_image && (
                 <Descriptions.Item label="Bukti Transfer">
                    <Image src={funding.proof_image} alt="Bukti" style={{maxHeight: 200}} />
                 </Descriptions.Item>
              )}
            </Descriptions>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Space direction="vertical" style={{ width: '100%' }} size={24}>
            <InfoCard
              icon={<FaMoneyBillTransfer size={32} />}
              label="Total Dana Masuk"
              value={formatRupiah(funding.amount)}
              iconColor="#7CB305"
            />
          </Space>
        </Col>
      </Row>

      {canEdit && <FundingModal visible={isModalOpen} onClose={() => setIsModalOpen(false)} initialData={funding} form={form} />}
    </>
  );
}

export default function FundingDetailPage() {
  return (
    <ProtectedRoute roles={['Superadmin', 'Admin', 'Investor', 'Viewer']}>
      <FundingDetailContent />
    </ProtectedRoute>
  );
}