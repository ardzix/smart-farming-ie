'use client';

import { unstableSetRender } from 'antd';
import { createRoot } from 'react-dom/client';

// Custom render untuk Ant Design component
unstableSetRender((node, container) => {
  container._reactRoot ||= createRoot(container);
  const root = container._reactRoot;
  root.render(node);
  return async () => {
    await new Promise(resolve => setTimeout(resolve, 0));
    root.unmount();
  };
});

export default function AntdRenderProvider({ children }) {
  return children; // hanya digunakan untuk trigger sekali saat mounting
}
