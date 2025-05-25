import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Admin Dashboard - Explorely",
  description: "Admin dashboard for managing Explorely platform",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
} 