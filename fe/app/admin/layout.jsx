'use client';

import React, { useEffect, useState } from 'react';
import { Layout, Menu, Avatar, Typography, Flex, Dropdown, Spin } from 'antd';
import { FileTextFilled } from '@ant-design/icons';
import {
  UserOutlined,
  LogoutOutlined,
  MailOutlined,
  UserSwitchOutlined,
  ShoppingCartOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { BiSolidDashboard } from 'react-icons/bi';
import { FaDollarSign } from 'react-icons/fa';
import { HiUsers } from 'react-icons/hi';
import { GiPayMoney, GiSprout } from 'react-icons/gi';
import { LuWheat } from 'react-icons/lu';
import { AiFillDollarCircle, AiFillSetting } from 'react-icons/ai';
import { usePathname, useRouter } from 'next/navigation';
import useAuthStore from '@/lib/store/authStore';
import { useLogout } from '@/lib/hooks/useAuth';
import { useI18n } from '@/lib/i18n/I18nProvider';
import LanguageSwitcher from '@/components/LanguageSwitcher';

const { Header, Content, Sider } = Layout;
const { Title, Text } = Typography;

const menuConfig = [
  { key: '1', icon: <BiSolidDashboard />, labelKey: 'admin.dashboard', fallback: 'Dashboard', path: '/admin', permissions: [] },
  { key: '2', icon: <FileTextFilled />, labelKey: 'admin.asset', fallback: 'Asset', path: '/admin/asset', permissions: ['view.asset', 'manage.asset'] },
  { key: '8', icon: <LuWheat />, labelKey: 'admin.production', fallback: 'Production', path: '/admin/produksi', permissions: ['view.production', 'manage.production'] },
  { key: '7', icon: <ShoppingCartOutlined />, labelKey: 'admin.sales', fallback: 'Sales', path: '/admin/penjualan', permissions: ['view.sales', 'manage.sales'] },
  { key: '4', icon: <FaDollarSign />, labelKey: 'admin.funding', fallback: 'Funding', path: '/admin/pendanaan', permissions: ['view.funding', 'manage.funding'] },
  { key: '6', icon: <GiPayMoney />, labelKey: 'admin.expense', fallback: 'Expense', path: '/admin/pengeluaran', permissions: ['view.expense', 'manage.expense'] },
  { key: '9', icon: <AiFillDollarCircle />, labelKey: 'admin.profitDistribution', fallback: 'Profit Distribution', path: '/admin/bagi-hasil', permissions: ['view.cashflow', 'manage.cashflow'] },
  { key: '11', icon: <HiUsers />, labelKey: 'admin.userManagement', fallback: 'User Management', path: '/admin/user-management', permissions: ['manage.users'], ownerOnly: true },
  { key: '12', icon: <AiFillSetting />, labelKey: 'admin.settings', fallback: 'Settings', path: '/admin/pengaturan', permissions: [] },
  { key: '13', icon: <SafetyCertificateOutlined />, labelKey: 'admin.authentication', fallback: 'Authentication', path: '/admin/authentication', permissions: [] },
];

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useI18n();

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

  const isOwner = isOwnerFn();
  const userRoleName = user?.role || user?.roles?.[0] || (user?.is_owner ? t('common.owner') : t('admin.ssoUser'));

  const profileMenuItems = [
    {
      key: 'info',
      type: 'group',
      label: <Text strong>{user?.username || t('common.loading')}</Text>,
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
          label: userRoleName || t('common.user'),
          disabled: true,
          style: { cursor: 'default', color: 'rgba(0, 0, 0, 0.88)' },
        },
        ...(user?.org_name
          ? [
              {
                key: 'org',
                icon: <BiSolidDashboard />,
                label: user.org_name,
                disabled: true,
                style: { cursor: 'default', color: 'rgba(0, 0, 0, 0.88)' },
              },
            ]
          : []),
        ...(isOwner
          ? [
              {
                key: 'owner',
                icon: <UserSwitchOutlined />,
                label: `✓ ${t('common.owner')}`,
                disabled: true,
                style: { cursor: 'default', color: '#237804' },
              },
            ]
          : []),
      ],
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: t('common.logout'),
      danger: true,
    },
  ];

  let determinedKey = '1';
  const sortedMenuConfig = [...menuConfig].sort((a, b) => b.path.length - a.path.length);
  const matchedItem = sortedMenuConfig.find((item) => pathname.startsWith(item.path));
  if (matchedItem) determinedKey = matchedItem.key;
  const selectedKey = determinedKey;

  const baseStyle = {
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    paddingLeft: '24px',
    borderRadius: 0,
    width: '100%',
    margin: '0px',
    backgroundColor: 'rgba(255, 255, 255, 0.00001)',
  };
  const activeStyleAddons = { backgroundColor: '#E6FFE6' };
  const baseIconSize = '18px';
  const iconTextGap = '10px';

  const processedMenuItems = menuConfig
    .filter((item) => {
      if (!mounted || !user) return false;
      if (isOwner) return true;
      if (!item.permissions || item.permissions.length === 0) return !item.ownerOnly;
      if (item.ownerOnly && !isOwner) return false;
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
          <span
            style={{
              color: textColor,
              fontFamily: 'Roboto, sans-serif',
              fontSize: '14px',
              marginLeft: iconTextGap,
              flexGrow: 1,
            }}
          >
            {t(item.labelKey, item.fallback)}
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
          background: '#FFFFFF',
          padding: '0 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0px 1px 4px rgba(12, 12, 13, 0.1)',
          height: 84,
          position: 'sticky',
          top: 0,
          zIndex: 20,
          width: '100%',
        }}
      >
        <Flex align="center" gap="12px">
          <GiSprout style={{ fontSize: '32px', color: '#237804' }} />
          <Title level={4} style={{ margin: 0, color: '#111928', fontWeight: 600, fontSize: '24px' }}>
            {t('common.appName')}
          </Title>
        </Flex>

        <Flex align="center" gap={16}>
          <LanguageSwitcher />
          <Dropdown menu={{ items: profileMenuItems, onClick: handleMenuClick }} placement="bottomRight" arrow trigger={['click']}>
            <Flex align="center" gap={8} style={{ cursor: 'pointer' }}>
              {mounted && user ? (
                <>
                  <Text strong style={{ marginRight: 8 }}>
                    {user.username}
                  </Text>
                  <Avatar size={32} icon={<UserOutlined />} />
                </>
              ) : (
                <Spin size="small" />
              )}
            </Flex>
          </Dropdown>
        </Flex>
      </Header>

      <Layout style={{ background: '#F9FAFB' }}>
        <Sider
          width={256}
          style={{
            background: '#FFFFFF',
            boxShadow: 'inset -1px 0px 0px #F0F0F0',
            position: 'fixed',
            height: 'calc(100vh - 84px)',
            left: 0,
            top: '84px',
            overflow: 'auto',
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
          <Content style={{ padding: '24px', margin: 0 }}>{children}</Content>
        </Layout>
      </Layout>
    </Layout>
  );
}
