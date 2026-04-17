'use client';

import { Card, Typography } from 'antd';

const { Title, Paragraph } = Typography;

export default function TestAllApiPage() {
  return (
    <div style={{ padding: 24 }}>
      <Card>
        <Title level={3}>Test API Page Disabled</Title>
        <Paragraph>
          Halaman ini dinonaktifkan sementara karena masih bergantung pada modul API lama
          seperti `project`, `ownership`, `investor`, dan `funding_source` yang sudah tidak
          ada di codebase aktif.
        </Paragraph>
        <Paragraph>
          Jika fitur testing API dibutuhkan lagi, sebaiknya dibuat ulang berdasarkan endpoint
          backend yang benar-benar tersedia saat ini.
        </Paragraph>
      </Card>
    </div>
  );
}
