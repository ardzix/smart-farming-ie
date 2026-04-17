import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ConfigProvider } from "antd";
import AntdRenderProvider from "./providers"; 
import QueryProvider from '@/lib/providers/QueryProvider'; 
// HAPUS IMPORT AuthHydrator DARI SINI

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata = {
  title: "Lahan Pintar App", 
  description: "Aplikasi Manajemen Lahan Pintar", 
};

import { GoogleOAuthProvider } from '@react-oauth/google';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENTID || ""}>
          <QueryProvider>
            {/* HAPUS <AuthHydrator /> DARI SINI */}
            <ConfigProvider>
              <AntdRenderProvider>
                {children}
              </AntdRenderProvider>
            </ConfigProvider>
          </QueryProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}