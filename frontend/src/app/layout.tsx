import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Campus Activity Tracker",
  description: "ระบบแจ้งเตือนกิจกรรมที่เข้าใช้งานผ่าน CSMJU Core Hub SSO",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
