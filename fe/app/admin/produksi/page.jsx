'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button, Modal, Form, Select, InputNumber, DatePicker,
  Input, Typography, Space, message, Spin, Alert, Card, Row, Col,
  Tag, Skeleton, Popconfirm, List, Avatar, Upload, Divider
} from 'antd';
import {
  PlusOutlined, EditOutlined, SearchOutlined, DeleteOutlined, 
  CloseCircleOutlined, PlusCircleOutlined, AppstoreOutlined, EyeOutlined,
  ShopOutlined, UploadOutlined
} from '@ant-design/icons';
import { LuWheat } from 'react-icons/lu';
import { FaClipboardList, FaBalanceScale } from 'react-icons/fa';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import moment from 'moment';
import ProtectedRoute from '@/components/ProtectedRoute';
import useAuthStore from '@/lib/store/authStore';

import {
  getProductions, createProduction, patchProduction, deleteProduction
} from '@/lib/api/production';
import { getAssets } from '@/lib/api/asset';
import { getProducts, createProduct } from '@/lib/api/product';
import { getAdjustments, createAdjustment, deleteAdjustment } from '@/lib/api/stockAdjustment';

const { Title, Text } = Typography;
const { Option } = Select;

// --- HELPERS ---
const formatDate = (dateString) => dateString ? moment(dateString).format('D/M/YYYY') : '-';

const ASSET_TYPE_MAP = {
  lahan: { label: 'Lahan', color: '#1E429F' },
  alat: { label: 'Alat', color: '#1E429F' },
  bangunan: { label: 'Bangunan', color: '#1E429F' },
  ternak: { label: 'Ternak', color: '#1E429F' },
};

// --- COMPONENTS ---

// 1. Stat Card
const StatCard = ({ title, value, icon, loading, iconColor }) => (
  <Card
    bodyStyle={{ padding: '24px' }}
    style={{
      background: '#FFFFFF',
      border: '1px solid #F0F0F0',
      borderRadius: '12px',
      boxShadow: '0px 1px 4px rgba(12, 12, 13, 0.1)',
      height: '100%'
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: '24px', height: '100%' }}>
      <div style={{ flexShrink: 0, color: iconColor || '#7CB305', fontSize: '34px' }}>
        {icon}
      </div>
      <div>
        <Text style={{ fontSize: '16px', fontWeight: 600, color: '#585858', display: 'block' }}>{title}</Text>
        <Text style={{ fontSize: '28px', fontWeight: 700, color: '#111928' }}>
           {loading ? '...' : Number(value).toLocaleString('id-ID')}
        </Text>
      </div>
    </div>
  </Card>
);

// 2. Info Stok Gudang
const ProductStockSummary = ({ products, loading }) => {
  const totalStock = useMemo(() => {
    if (!products) return 0;
    return products.reduce((acc, curr) => acc + parseFloat(curr.current_stock || 0), 0);
  }, [products]);

  return (
    <Card
      title={<Space><AppstoreOutlined /> Ringkasan Stok Gudang</Space>}
      bodyStyle={{ padding: '0px' }}
      style={{ border: '1px solid #E5E7EB', borderRadius: '12px', marginTop: 24 }}
    >
      <Spin spinning={loading}>
        <div style={{ padding: '24px', background: '#F9FAFB', borderBottom: '1px solid #F0F0F0' }}>
            <Row align="middle" justify="space-between">
                <Col>
                    <Text type="secondary" style={{ fontSize: '14px' }}>Total Stok Tersedia (Global)</Text>
                    <div style={{ fontSize: '28px', fontWeight: 700, color: '#D97706', marginTop: '4px' }}>
                        {Number(totalStock).toLocaleString('id-ID')} <span style={{fontSize: '16px', fontWeight: 400, color: '#6B7280'}}>Unit</span>
                    </div>
                </Col>
                <Col>
                    <ShopOutlined style={{ fontSize: '42px', color: '#FCD34D', opacity: 0.8 }} />
                </Col>
            </Row>
        </div>

        <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
          <List
            itemLayout="horizontal"
            dataSource={products || []}
            renderItem={(item) => (
              <List.Item style={{ padding: '12px 24px', borderBottom: '1px solid #F3F4F6' }}>
                <List.Item.Meta
                  avatar={<Avatar style={{ backgroundColor: '#E1EFFE', color: '#1E429F' }}>{item.name[0]}</Avatar>}
                  title={<Text strong>{item.name}</Text>}
                  description={<Text type="secondary">Unit: {item.unit}</Text>}
                />
                <div style={{textAlign: 'right'}}>
                  <Text strong style={{fontSize: '18px', color: '#237804'}}>
                    {Number(item.current_stock || 0).toLocaleString('id-ID')}
                  </Text>
                  <div style={{fontSize: '11px', color: '#727272'}}>Tersedia</div>
                </div>
              </List.Item>
            )}
          />
          {products?.length === 0 && <div style={{ padding: 24, textAlign: 'center', color: '#999' }}>Gudang Kosong</div>}
        </div>
      </Spin>
    </Card>
  );
};

// 3. Production Card
const ProductionCard = ({ production, onEditClick, onDetailClick, onDelete, canEdit }) => {
  const type = ASSET_TYPE_MAP[production.asset_details?.type] || { label: 'Umum', color: '#1E429F' };
  const productName = production.product_details?.name || production.name || 'Produk Tanpa Nama';
  const productUnit = production.product_details?.unit || production.unit || '';

  return (
    <Card
      bodyStyle={{ padding: '20px' }}
      style={{
        width: '100%',
        marginBottom: '0px', 
        border: '1px solid #E5E7EB',
        borderRadius: '8px',
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <Space size="small" style={{ marginBottom: '10px' }}>
            <div style={{
              display: 'inline-flex', padding: '4px 10px',
              background: '#E1EFFE', borderRadius: '6px',
            }}>
              <Text style={{ fontWeight: 600, fontSize: '14px', color: '#1E429F' }}>
                {type.label}
              </Text>
            </div>
          </Space>
          
          <Title level={4} style={{ margin: '0 0 10px 0', fontSize: '20px', fontWeight: 600, color: '#111928' }}>
            {productName}
          </Title>
          
          <Text style={{ fontSize: '16px', fontWeight: 500, color: '#111928', display: 'block', marginBottom: '16px' }}>
            {formatDate(production.date)}
          </Text>
          
          <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
            <div>
              <Text style={{ fontSize: '14px', fontWeight: 500, color: '#727272', display: 'block', marginBottom: '4px' }}>
                Kuantitas Hasil
              </Text>
              <Text style={{ fontSize: '16px', fontWeight: 600, color: '#111928' }}>
                {Number(production.quantity).toLocaleString('id-ID')} {productUnit}
              </Text>
            </div>
            <div>
              <Text style={{ fontSize: '14px', fontWeight: 500, color: '#727272', display: 'block', marginBottom: '4px' }}>
                Asal Aset
              </Text>
              <Text style={{ fontSize: '16px', fontWeight: 600, color: '#111928' }}>
                {production.asset_details?.name || '-'}
              </Text>
            </div>
          </div>
          
          <Space>
            <Button onClick={() => onDetailClick(production.id)} icon={<EyeOutlined />}>
                Detail
            </Button>
          </Space>
        </div>
      </div>
    </Card>
  );
};

// 4. Modal Produksi
const ProductionModal = ({ visible, onClose, initialData, form, assets, isLoadingAssets, products, isLoadingProducts }) => {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isNewProductMode, setIsNewProductMode] = useState(false);
  const isEditMode = Boolean(initialData);

  const mutationOptions = {
    onSuccess: () => {
      message.success(isEditMode ? 'Produksi diperbarui' : 'Produksi ditambahkan');
      queryClient.invalidateQueries({ queryKey: ['productions'] });
      queryClient.invalidateQueries({ queryKey: ['products'] }); 
      onClose();
    },
    onError: (err) => message.error(`Gagal menyimpan: ${err.response?.data?.detail || 'Terjadi kesalahan'}`),
    onSettled: () => setIsSubmitting(false),
  };

  const createMutation = useMutation({ mutationFn: createProduction, ...mutationOptions });
  const updateMutation = useMutation({ mutationFn: ({ id, data }) => patchProduction(id, data), ...mutationOptions });
  
  const createProductMutation = useMutation({ 
      mutationFn: createProduct,
      onSuccess: (newProduct) => {
          message.success('Produk baru berhasil dibuat!');
          queryClient.invalidateQueries({ queryKey: ['products'] });
          form.setFieldValue('product', newProduct.id); 
          setIsNewProductMode(false);
      },
      onError: () => message.error('Gagal membuat produk')
  });

  const handleSaveNewProduct = async () => {
      try {
          const values = await form.validateFields(['new_product_name', 'new_product_unit']);
          createProductMutation.mutate({ name: values.new_product_name, unit: values.new_product_unit, current_stock: 0 });
      } catch (e) {}
  };

  useEffect(() => {
    if (visible) {
      if (isEditMode && initialData) {
        setIsNewProductMode(false);
        form.setFieldsValue({
          asset: initialData.asset,
          product: initialData.product || initialData.product_details?.id,
          quantity: parseFloat(initialData.quantity),
          date: moment(initialData.date),
        });
      } else {
        form.resetFields();
        setIsNewProductMode(false);
      }
    }
  }, [visible, initialData, form, isEditMode]);

  const onFinish = (values) => {
    setIsSubmitting(true);
    const payload = {
      asset: values.asset,
      product: values.product,
      quantity: values.quantity,
      date: values.date.format('YYYY-MM-DD'),
      status: 'stok',
      unit_price: 0,
    };
    if (isEditMode) updateMutation.mutate({ id: initialData.id, data: payload });
    else createMutation.mutate(payload);
  };

  return (
    <Modal title={isEditMode ? 'Edit Hasil Panen' : 'Catat Hasil Panen'} open={visible} onCancel={onClose} footer={null} width={600} destroyOnClose>
      <Modal title="Tambah Produk Baru" open={isNewProductMode} onCancel={() => setIsNewProductMode(false)}
          footer={[
              <Button key="b" onClick={() => setIsNewProductMode(false)}>Batal</Button>,
              <Button key="s" type="primary" onClick={handleSaveNewProduct} loading={createProductMutation.isPending} style={{background: '#237804', borderColor: '#237804'}}>Simpan Produk</Button>
          ]} width={400} zIndex={1002} centered
      >
          <Form form={form} layout="vertical" component={false}>
             <div style={{ background: '#F6FFED', padding: '16px', borderRadius: '8px', border: '1px solid #B7EB8F', marginBottom: '24px' }}>
                <Text strong style={{ color: '#237804', display: 'block', marginBottom: '12px' }}>
                  📦 Pendaftaran Produk Baru ke Gudang
                </Text>
                <Row gutter={16}>
                  <Col span={24}>
                    <Form.Item name="new_product_name" label="Nama Produk Baru" rules={[{ required: isNewProductMode, message: 'Nama produk baru wajib diisi' }]}>
                      <Input placeholder="Contoh: Jagung Manis" />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item name="new_product_unit" label="Satuan Unit" rules={[{ required: isNewProductMode, message: 'Satuan wajib diisi' }]}>
                      <Input placeholder="Contoh: Kg, Liter, Ikat" />
                    </Form.Item>
                  </Col>
                </Row>
              </div>
          </Form>
      </Modal>

      <Form form={form} layout="vertical" onFinish={onFinish} style={{ marginTop: 20 }}>
        <Form.Item label="Pilih Produk" style={{marginBottom: 12}}>
             <div style={{ display: 'flex', gap: 8 }}>
                <Form.Item name="product" rules={[{ required: true, message: 'Wajib' }]} style={{ flex: 1, marginBottom: 0 }}>
                    <Select placeholder="Pilih produk..." showSearch optionFilterProp="children" loading={isLoadingProducts}>
                        {products?.map(p => <Option key={p.id} value={p.id}>{p.name}</Option>)}
                    </Select>
                </Form.Item>
                <Button icon={<PlusOutlined />} onClick={() => setIsNewProductMode(true)} title="Buat Produk Baru" />
             </div>
        </Form.Item>

        <Form.Item name="asset" label="Asal Lahan/Aset" rules={[{ required: true }]}>
          <Select placeholder="Pilih aset..." showSearch optionFilterProp="children" loading={isLoadingAssets}>
            {assets?.map(a => <Option key={a.id} value={a.id}>{a.name}</Option>)}
          </Select>
        </Form.Item>
        
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="quantity" label="Kuantitas" rules={[{ required: true }]}>
              <InputNumber min={0} style={{ width: '100%' }} placeholder="Jumlah" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="date" label="Tanggal" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY"/>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item style={{ textAlign: 'right', marginTop: 24, marginBottom: 0 }}>
          <Space>
            <Button onClick={onClose}>Batal</Button>
            <Button type="primary" htmlType="submit" loading={isSubmitting} style={{ background: '#237804', borderColor: '#237804' }}>
              Simpan
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

// ==========================================
// 5. MODAL STOCK ADJUSTMENT (BARU)
// ==========================================
const StockAdjustmentModal = ({ visible, onClose, products, isLoadingProducts }) => {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const mutation = useMutation({
    mutationFn: createAdjustment,
    onSuccess: () => {
      message.success('Stok berhasil disesuaikan');
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['adjustments'] });
      queryClient.invalidateQueries({ queryKey: ['productions'] });
      onClose();
      form.resetFields();
      setPreviewImage(null);
    },
    onError: (err) => {
      message.error(err.response?.data?.detail || 'Gagal menyimpan adjustment');
    },
    onSettled: () => setIsSubmitting(false)
  });

  const onFinish = (values) => {
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('product', values.product);
    formData.append('adjustment_type', values.adjustment_type);
    formData.append('quantity', values.quantity);
    formData.append('reason', values.reason);
    formData.append('date', values.date.format('YYYY-MM-DD'));

    if (values.notes) formData.append('notes', values.notes);
    if (values.proof_image?.[0]?.originFileObj) {
      formData.append('proof_image', values.proof_image[0].originFileObj);
    }

    mutation.mutate(formData);
  };

  const handleImageChange = (info) => {
    if (info.fileList.length > 0) {
      const file = info.fileList[0].originFileObj;
      const reader = new FileReader();
      reader.onload = (e) => setPreviewImage(e.target.result);
      reader.readAsDataURL(file);
    } else {
      setPreviewImage(null);
    }
  };

  return (
    <Modal
      title={
        <Space style={{ fontSize: '18px', fontWeight: 600 }}>
          <FaBalanceScale style={{color: '#D97706'}}/>
          Penyesuaian Stok
        </Space>
      }
      open={visible}
      onCancel={() => {
        onClose();
        form.resetFields();
        setPreviewImage(null);
      }}
      footer={null}
      width={650}
      destroyOnClose
    >
      <Alert
        message="Catatan Penting"
        description="Fitur ini untuk koreksi stok karena kerusakan, kehilangan, atau salah hitung. Perubahan akan langsung mempengaruhi stok gudang."
        type="warning"
        showIcon
        style={{ marginBottom: 24, marginTop: 16 }}
      />
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item
          name="product"
          label="Pilih Produk"
          rules={[{ required: true, message: 'Wajib dipilih' }]}
        >
          <Select
            placeholder="Pilih produk yang akan disesuaikan..."
            loading={isLoadingProducts}
            showSearch
            optionFilterProp="children"
            size="large"
          >
            {products?.map(p => (
              <Option key={p.id} value={p.id}>
                {p.name} (Stok Saat Ini: {parseFloat(p.current_stock)} {p.unit})
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="adjustment_type"
              label="Tipe Penyesuaian"
              rules={[{ required: true }]}
            >
              <Select placeholder="Pilih tipe..." size="large">
                <Option value="addition">
                  <Space><PlusCircleOutlined style={{color: '#237804'}}/> Penambahan Stok</Space>
                </Option>
                <Option value="reduction">
                  <Space><DeleteOutlined style={{color: '#DC2626'}}/> Pengurangan Stok</Space>
                </Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="quantity"
              label="Jumlah"
              rules={[{ required: true, message: 'Wajib diisi' }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                placeholder="0"
                size="large"
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="reason"
          label="Alasan Penyesuaian"
          rules={[{ required: true }]}
        >
          <Select placeholder="Pilih alasan..." size="large">
            <Option value="damaged">🔧 Barang Rusak</Option>
            <Option value="expired">📅 Kadaluarsa</Option>
            <Option value="pest">🐀 Dimakan Hama/Tikus</Option>
            <Option value="theft">🚨 Kehilangan/Pencurian</Option>
            <Option value="recount">📊 Koreksi Perhitungan</Option>
            <Option value="found">🔍 Stok Ditemukan</Option>
            <Option value="other">📝 Lainnya</Option>
          </Select>
        </Form.Item>

        <Form.Item name="notes" label="Catatan Tambahan (Opsional)">
          <Input.TextArea
            rows={3}
            placeholder="Jelaskan detail penyesuaian..."
          />
        </Form.Item>

        <Form.Item
          name="date"
          label="Tanggal Kejadian"
          rules={[{ required: true }]}
          initialValue={moment()}
        >
          <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" size="large" />
        </Form.Item>

        <Form.Item
          name="proof_image"
          label="Bukti Foto (Opsional)"
          valuePropName="fileList"
          getValueFromEvent={(e) => Array.isArray(e) ? e : e?.fileList}
        >
          <Upload
            listType="picture-card"
            maxCount={1}
            beforeUpload={() => false}
            onChange={handleImageChange}
          >
            <div><PlusOutlined /><div style={{ marginTop: 8 }}>Upload</div></div>
          </Upload>
        </Form.Item>

        {previewImage && (
          <div style={{ marginBottom: 16 }}>
            <img src={previewImage} alt="Preview" style={{ maxWidth: '100%', borderRadius: 8 }} />
          </div>
        )}

        <Form.Item style={{ textAlign: 'right', marginTop: 32, marginBottom: 0 }}>
          <Space>
            <Button onClick={() => { 
              onClose(); 
              form.resetFields(); 
              setPreviewImage(null); 
            }}>
              Batal
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={isSubmitting}
              style={{ backgroundColor: '#D97706', borderColor: '#D97706' }}
            >
              Simpan Penyesuaian
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

// --- MAIN PAGE ---
function ProductionManagementContent() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduction, setEditingProduction] = useState(null);
  const [form] = Form.useForm();
  
  const [selectedAsset, setSelectedAsset] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // State untuk Stock Adjustment Modal
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  
  const user = useAuthStore((state) => state.user);
  const canEdit = user?.is_owner || useAuthStore.getState().hasAnyPermission(['manage.production']);
  
  const { data: products, isLoading: isLoadingProducts } = useQuery({ queryKey: ['products'], queryFn: getProducts });
  const { data: assets, isLoading: isLoadingAssets } = useQuery({ queryKey: ['assets'], queryFn: getAssets });
  
  const filterParams = useMemo(() => ({
    asset: selectedAsset === 'all' ? undefined : selectedAsset,
    search: searchTerm || undefined,
  }), [selectedAsset, searchTerm]);
  
  const { data: productions, isLoading: isLoadingProductions, isError } = useQuery({
    queryKey: ['productions', filterParams],
    queryFn: () => getProductions(filterParams),
  });
  
  // Query untuk Adjustments
  const { data: adjustments, isLoading: isLoadingAdjustments } = useQuery({
    queryKey: ['adjustments'],
    queryFn: getAdjustments
  });
  
  const deleteMutation = useMutation({
    mutationFn: deleteProduction,
    onSuccess: () => {
      message.success('Dihapus');
      queryClient.invalidateQueries({ queryKey: ['productions'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (err) => message.error('Gagal hapus')
  });
  
  const deleteAdjustmentMutation = useMutation({
    mutationFn: deleteAdjustment,
    onSuccess: () => {
      message.success('Adjustment dihapus, stok dipulihkan');
      queryClient.invalidateQueries({ queryKey: ['adjustments'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (err) => message.error('Gagal hapus adjustment')
  });
  
  const stats = useMemo(() => {
    if (!productions) return { total_volume: 0, total_transaksi: 0 };
    return productions.reduce((acc, curr) => {
      acc.total_volume += parseFloat(curr.quantity || 0);
      acc.total_transaksi += 1;
      return acc;
    }, { total_volume: 0, total_transaksi: 0 });
  }, [productions]);
  
  const showAddModal = () => { setEditingProduction(null); form.resetFields(); setIsModalOpen(true); };
  const showEditModal = (prod) => { setEditingProduction(prod); setIsModalOpen(true); };
  const handleDetail = (id) => { router.push(`/admin/produksi/${id}`); };
  const handleCancel = () => { setIsModalOpen(false); form.resetFields(); };
  
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <Title level={2} style={{ margin: 0, fontSize: '30px' }}>{canEdit ? "Manajemen Produksi" : "Laporan Produksi"}</Title>
          <Text style={{ color: '#727272' }}>Kelola hasil produksi ternak dan lahan</Text>
        </div>
        {canEdit && (
          <Space>
            <Button
              icon={<FaBalanceScale />}
              size="large"
              onClick={() => setIsAdjustmentModalOpen(true)}
              style={{ borderRadius: '24px', borderColor: '#D97706', color: '#D97706' }}
            >
              Stok Adjustment
            </Button>
            <Button
              type="primary"
              icon={<PlusCircleOutlined />}
              size="large"
              onClick={showAddModal}
              style={{ background: '#237804', borderRadius: '24px' }}
            >
              Tambah Produksi
            </Button>
          </Space>
        )}
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} md={12}>
            <StatCard title="Total Volume Produksi" value={stats.total_volume} icon={<LuWheat />} loading={isLoadingProductions} />
        </Col>
        <Col xs={24} md={12}>
            <StatCard title="Total Transaksi Produksi" value={stats.total_transaksi} icon={<FaClipboardList />} loading={isLoadingProductions} iconColor="#1E429F" />
        </Col>
      </Row>

      <ProductStockSummary products={products} loading={isLoadingProducts} />

      <Card style={{ marginTop: 24, border: '1px solid #E5E7EB', borderRadius: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
            <Title level={4} style={{ margin: 0 }}>Riwayat Produksi</Title>
            <Space>
                <Input placeholder="Cari..." prefix={<SearchOutlined />} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                <Select value={selectedAsset} onChange={setSelectedAsset} style={{ width: 150 }}>
                    <Option value="all">Semua Aset</Option>
                    {assets?.map(a => <Option key={a.id} value={a.id}>{a.name}</Option>)}
                </Select>
            </Space>
        </div>

        {isLoadingProductions ? <div style={{textAlign:'center', padding:40}}><Spin /></div> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {productions?.length > 0 ? productions.map(prod => (
                    <ProductionCard
                        key={prod.id}
                        production={prod}
                        onEditClick={showEditModal}
                        onDetailClick={handleDetail}
                        onDelete={deleteMutation.mutate}
                        canEdit={canEdit}
                    />
                )) : <div style={{textAlign:'center', padding:20, color:'#999'}}>Tidak ada data</div>}
            </div>
        )}
      </Card>

      {/* Riwayat Stock Adjustment */}
      {canEdit && (
        <Card style={{ marginTop: 24, border: '1px solid #E5E7EB', borderRadius: '8px' }}>
          <Title level={4} style={{ marginBottom: 16 }}>
            <Space><FaBalanceScale style={{color: '#D97706'}}/> Riwayat Penyesuaian Stok</Space>
          </Title>
          
          {isLoadingAdjustments ? (
            <div style={{textAlign:'center', padding:20}}><Spin /></div>
          ) : adjustments?.length > 0 ? (
            <List
              dataSource={adjustments}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Popconfirm
                      key="delete"
                      title="Hapus adjustment ini?"
                      description="Stok akan dikembalikan ke kondisi sebelum adjustment."
                      onConfirm={() => deleteAdjustmentMutation.mutate(item.id)}
                      okText="Ya, Hapus"
                      cancelText="Batal"
                      okButtonProps={{ danger: true }}
                    >
                      <Button danger size="small" icon={<DeleteOutlined />}>Hapus</Button>
                    </Popconfirm>
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar style={{ 
                        backgroundColor: item.adjustment_type === 'addition' ? '#DEF7EC' : '#FEE2E2',
                        color: item.adjustment_type === 'addition' ? '#057A55' : '#DC2626',
                        fontSize: '18px'
                      }}>
                        {item.adjustment_type === 'addition' ? '+' : '-'}
                      </Avatar>
                    }
                    title={
                      <Space>
                        <Tag color={item.adjustment_type === 'addition' ? 'success' : 'error'}>
                          {item.adjustment_type === 'addition' ? '+' : '-'} {Number(item.quantity).toLocaleString('id-ID')} {item.product_details?.unit}
                        </Tag>
                        <Text strong>{item.product_details?.name}</Text>
                      </Space>
                    }
                    description={
                      <Space split={<Divider type="vertical" />}>
                        <Text type="secondary">{item.reason_display}</Text>
                        <Text type="secondary">{formatDate(item.date)}</Text>
                        <Text type="secondary">oleh {item.created_by_name}</Text>
                      </Space>
                    }
                  />
                  {item.notes && (
                    <div style={{ marginTop: 8, padding: '8px 12px', background: '#F9FAFB', borderRadius: 6 }}>
                      <Text type="secondary" style={{ fontSize: '13px' }}>{item.notes}</Text>
                    </div>
                  )}
                </List.Item>
              )}
            />
          ) : (
            <div style={{ textAlign: 'center', padding: 32, color: '#999' }}>
              Belum ada riwayat penyesuaian stok
            </div>
          )}
        </Card>
      )}

      <ProductionModal
        visible={isModalOpen}
        onClose={handleCancel}
        initialData={editingProduction}
        form={form}
        assets={assets}
        products={products}
        isLoadingAssets={isLoadingAssets}
        isLoadingProducts={isLoadingProducts}
      />

      <StockAdjustmentModal
        visible={isAdjustmentModalOpen}
        onClose={() => setIsAdjustmentModalOpen(false)}
        products={products}
        isLoadingProducts={isLoadingProducts}
      />
    </>
  );
}

export default function ProductionPage() {
  return (
    <ProtectedRoute roles={['Superadmin', 'Admin', 'Operator', 'Investor', 'Viewer']}>
      <ProductionManagementContent />
    </ProtectedRoute>
  );
}
