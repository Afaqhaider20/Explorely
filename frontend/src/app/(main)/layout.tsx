'use client';

import React from 'react';
import { Navbar } from '@/components/Navbar';
import { MobileNavbar } from '@/components/MobileNavbar';
import { Sidebar } from '@/components/Sidebar';
import { RightSidebar } from '@/components/RightSidebar';

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      {/* Desktop Navbar */}
      <div className="hidden md:block">
        <Navbar />
      </div>
      {/* Mobile Navbar */}
      <div className="md:hidden">
        <MobileNavbar />
      </div>
      {/* Sidebar visible only on larger screens */}
      <div className="hidden md:block">
        <Sidebar />
      </div>
      {/* RightSidebar visible only on larger screens */}
      <div className="hidden lg:block">
        <RightSidebar />
      </div>
      <main className={`pt-16 px-4 sm:px-6 md:pl-72 lg:pr-96 min-h-[calc(100vh-4rem)]`}>
        {children}
      </main>
    </>
  );
} 