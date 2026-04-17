'use client';

import { Alert, Card, Typography } from 'antd';
import ProtectedRoute from '@/components/ProtectedRoute';

const { Title, Text } = Typography;

export default function ProjectDetailPage() {
  return (
    <ProtectedRoute roles={['Superadmin', 'Admin', 'Operator', 'Investor', 'Viewer']}>
      <div style={{ padding: 24 }}>
        <Card>
          <Title level={3}>Detail Proyek Tidak Tersedia</Title>
          <Text type="secondary">
            Route detail proyek dipertahankan agar aplikasi tidak rusak, tetapi fitur ini belum
            memiliki backend aktif pada codebase saat ini.
          </Text>
          <Alert
            type="info"
            showIcon
            style={{ marginTop: 16 }}
            message="Placeholder route"
            description="Halaman ini sengaja dibuat minimal sampai modul proyek diimplementasikan ulang."
          />
        </Card>
      </div>
    </ProtectedRoute>
  );
}
