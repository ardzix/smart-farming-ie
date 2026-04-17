'use client';

import React, { useState, useEffect } from 'react';
import {
  Layout, Menu, Avatar, Typography, Flex, Dropdown, Spin 
} from 'antd';
import { BiSolidDashboard, BiSolidCalculator, BiUser } from 'react-icons/bi';
import { FileTextFilled } from '@ant-design/icons';
import { FaDollarSign } from 'react-icons/fa';
import { HiUserGroup, HiUsers } from 'react-icons/hi';
import { GiPayMoney, GiSprout } from 'react-icons/gi';
import { LuWheat } from 'react-icons/lu';
import { AiFillDollarCircle, AiOutlineAreaChart, AiFillSetting } from 'react-icons/ai';
import { UserOutlined, LogoutOutlined, MailOutlined, UserSwitchOutlined, ShoppingCartOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { usePathname, useRouter } from 'next/navigation';
import useAuthStore from '@/lib/store/authStore';
import { useLogout } from '@/lib/hooks/useAuth';

const { Header, Content, Sider } = Layout;
const { Title, Text } = Typography;

// KONFIGURASI MENU (Berbasis Permission dari SSO Arnatech)
const menuConfig = [
  // Dashboard: Semua user yang sudah login
  { key: '1', icon: <BiSolidDashboard />, label: 'Dashboard', path: '/admin', permissions: [] },
  
  // Aset
  { key: '2', icon: <FileTextFilled />, label: 'Asset', path: '/admin/asset', permissions: ['view.asset', 'manage.asset'] },
  
  // Produksi
  { key: '8', icon: <LuWheat />, label: 'Produksi', path: '/admin/produksi', permissions: ['view.production', 'manage.production'] },

  // Penjualan
  { key: '7', icon: <ShoppingCartOutlined />, label: 'Penjualan', path: '/admin/penjualan', permissions: ['view.sales', 'manage.sales'] },

  // Pendanaan
  { key: '4', icon: <FaDollarSign />, label: 'Pendanaan', path: '/admin/pendanaan', permissions: ['view.funding', 'manage.funding'] },
  
  // Pengeluaran
  { key: '6', icon: <GiPayMoney />, label: 'Pengeluaran', path: '/admin/pengeluaran', permissions: ['view.expense', 'manage.expense'] },
  
  // Bagi Hasil
  { key: '9', icon: <AiFillDollarCircle />, label: 'Bagi Hasil', path: '/admin/bagi-hasil', permissions: ['view.cashflow', 'manage.cashflow'] },
  
  // User Management (hanya owner)
  { key: '11', icon: <HiUsers />, label: 'User Management', path: '/admin/user-management', permissions: ['manage.users'], ownerOnly: true },
  
  // Pengaturan
  { key: '12', icon: <AiFillSetting />, label: 'Pengaturan', path: '/admin/pengaturan', permissions: [] },

  // Keamanan / Authentication
  { key: '13', icon: <SafetyCertificateOutlined />, label: 'Authentication', path: '/admin/authentication', permissions: [] },
];

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  
  const user = useAuthStore((state) => state.user);
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const hasAnyPermission = useAuthStore((state) => state.hasAnyPermission);
  const isOwnerFn = useAuthStore((state) => state.isOwner);
  
  const logoutMutation = useLogout();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    initializeAuth();
    setMounted(true);
  }, [initializeAuth]);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const handleMenuClick = ({ key }) => {
    if (key === 'logout') handleLogout();
  };

  const userRoleName = user?.role?.name || user?.role;
  const isOwner = isOwnerFn();

  const profileMenuItems = [
    {
      key: 'info',
      type: 'group',
      label: <Text strong>{user?.username || 'Loading...'}</Text>,
      children: [
        {
          key: 'email',
          icon: <MailOutlined />,
          label: user?.email || '...',
          disabled: true,
          style: { cursor: 'default', color: 'rgba(0, 0, 0, 0.88)' },
        },
        {
          key: 'role',
          icon: <UserSwitchOutlined />,
          label: userRoleName || 'User', 
          disabled: true,
          style: { cursor: 'default', color: 'rgba(0, 0, 0, 0.88)' },
        },
        ...(user?.org_name ? [{
          key: 'org',
          icon: <BiSolidDashboard />,
          label: user.org_name,
          disabled: true,
          style: { cursor: 'default', color: 'rgba(0, 0, 0, 0.88)' },
        }] : []),
        ...(isOwner ? [{
          key: 'owner',
          icon: <UserSwitchOutlined />,
          label: '✓ Owner',
          disabled: true,
          style: { cursor: 'default', color: '#237804' },
        }] : []),
      ],
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      danger: true,
    },
  ];

  let determinedKey = '1';
  const sortedMenuConfig = [...menuConfig].sort((a, b) => b.path.length - a.path.length);
  const matchedItem = sortedMenuConfig.find((item) => pathname.startsWith(item.path));
  if (matchedItem) determinedKey = matchedItem.key;
  const selectedKey = determinedKey;

  const baseStyle = {
    height: '40px', display: 'flex', alignItems: 'center', paddingLeft: '24px',
    borderRadius: 0, width: '100%', margin: '0px', backgroundColor: 'rgba(255, 255, 255, 0.00001)',
  };
  const activeStyleAddons = { backgroundColor: '#E6FFE6' };
  const baseIconSize = '18px';
  const iconTextGap = '10px';

  const processedMenuItems = menuConfig
    .filter(item => {
      if (!mounted || !user) return false;
      // Owner bisa akses semua menu
      if (isOwner) return true;
      // Menu tanpa permission requirement (Dashboard, Pengaturan) → tampilkan untuk semua
      if (!item.permissions || item.permissions.length === 0) return !item.ownerOnly;
      // Menu hanya untuk owner
      if (item.ownerOnly && !isOwner) return false;
      // Cek apakah user punya salah satu permission yang dibutuhkan
      return hasAnyPermission(item.permissions);
    })
    .map((item) => {
      const isActive = selectedKey === item.key;
      const currentStyle = isActive ? { ...baseStyle, ...activeStyleAddons } : baseStyle;
      const iconColor = isActive ? '#237804' : 'rgba(0, 0, 0, 0.85)';
      const textColor = isActive ? '#237804' : 'rgba(0, 0, 0, 0.85)';

      return {
        key: item.key,
        icon: React.cloneElement(item.icon, {
          style: { fontSize: baseIconSize, color: iconColor, width: baseIconSize, height: baseIconSize },
        }),
        label: (
          <span style={{ color: textColor, fontFamily: 'Roboto, sans-serif', fontSize: '14px', marginLeft: iconTextGap, flexGrow: 1 }}>
            {item.label}
          </span>
        ),
        style: currentStyle,
        onClick: () => router.push(item.path),
      };
    });

  return (
    <Layout style={{ minHeight: '100vh', background: '#F9FAFB' }} suppressHydrationWarning>
      <Header
        style={{
          background: '#FFFFFF', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          boxShadow: '0px 1px 4px rgba(12, 12, 13, 0.1)', height: 84, position: 'sticky', top: 0, zIndex: 20, width: '100%',
        }}
      >
        <Flex align="center" gap="12px">
          <GiSprout style={{ fontSize: '32px', color: '#237804' }} />
          <Title level={4} style={{ margin: 0, color: '#111928', fontWeight: 600, fontSize: '24px' }}>
            Lahan Pintar
          </Title>
        </Flex>
        
        <Dropdown menu={{ items: profileMenuItems, onClick: handleMenuClick }} placement="bottomRight" arrow trigger={['click']}>
          <Flex align="center" gap={8} style={{ cursor: 'pointer' }}>
             {mounted && user ? (
                 <>
                   <Text strong style={{ marginRight: 8 }}>{user.username}</Text>
                   <Avatar size={32} icon={<UserOutlined />} />
                 </>
             ) : (
                 <Spin size="small" /> 
             )}
          </Flex>
        </Dropdown>
      </Header>

      <Layout style={{ background: '#F9FAFB' }}>
        <Sider
          width={256}
          style={{
            background: '#FFFFFF', boxShadow: 'inset -1px 0px 0px #F0F0F0', position: 'fixed',
            height: 'calc(100vh - 84px)', left: 0, top: '84px', overflow: 'auto',
          }}
          theme="light"
          suppressHydrationWarning
        >
          {mounted && user && (
            <Menu
              mode="inline"
              selectedKeys={[selectedKey]}
              items={processedMenuItems}
              style={{ borderRight: 0, width: '100%', padding: '0px', gap: '8px', display: 'flex', flexDirection: 'column' }}
            />
          )}
        </Sider>

        <Layout style={{ marginLeft: 256, background: '#F9FAFB' }}>
          <Content style={{ padding: '24px', margin: 0 }}>
            {children}
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
}