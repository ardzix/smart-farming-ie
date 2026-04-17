'use client';

import { Alert, Card, Typography } from 'antd';
import ProtectedRoute from '@/components/ProtectedRoute';

const { Title, Text } = Typography;

export default function ProjectPage() {
  return (
    <ProtectedRoute roles={['Superadmin', 'Admin', 'Operator', 'Investor', 'Viewer']}>
      <div style={{ padding: 24 }}>
        <Card>
          <Title level={3}>Fitur Proyek Belum Aktif</Title>
          <Text type="secondary">
            Halaman proyek dinonaktifkan sementara. Implementasi lama masih berisi conflict Git
            dan bergantung pada modul API `project` yang tidak ada di codebase backend saat ini.
          </Text>
          <Alert
            type="warning"
            showIcon
            style={{ marginTop: 16 }}
            message="Perlu implementasi ulang"
            description="Jika modul proyek ingin dipakai lagi, backend dan API client-nya perlu dibuat ulang secara konsisten."
          />
        </Card>
      </div>
    </ProtectedRoute>
  );
}
