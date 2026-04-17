'use client';

import { Alert, Card, Typography } from 'antd';
import ProtectedRoute from '@/components/ProtectedRoute';

const { Title, Text } = Typography;

export default function OwnershipDetailPage() {
  return (
    <ProtectedRoute roles={['Superadmin', 'Admin', 'Operator', 'Investor', 'Viewer']}>
      <div style={{ padding: 24 }}>
        <Card>
          <Title level={3}>Detail Kepemilikan Belum Tersedia</Title>
          <Text type="secondary">
            Halaman ini sebelumnya bergantung pada modul `ownership`, `investor`, dan
            `funding_source` yang tidak tersedia di codebase aktif.
          </Text>
          <Alert
            type="warning"
            showIcon
            style={{ marginTop: 16 }}
            message="Fitur lama belum tersambung"
            description="Route dipertahankan sebagai placeholder agar proses build dan navigasi tetap aman."
          />
        </Card>
      </div>
    </ProtectedRoute>
  );
}
