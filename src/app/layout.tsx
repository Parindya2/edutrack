
'use client';

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/app/components/Sidebar';
import { usePathname } from 'next/navigation';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

// Create a client component for the layout content
function LayoutContent({ children }: { children: React.ReactNode }) {
  const { teacher } = useAuth();
  const pathname = usePathname();
  
  // Define routes that should NOT have sidebar (public routes)
  const publicRoutes = ['/', '/login', '/register'];
  const isPublicRoute = publicRoutes.includes(pathname);
  
  // Show sidebar only if user is authenticated and not on public routes
  const showSidebar = teacher && !isPublicRoute;

  if (showSidebar) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    );
  }

  // For public routes or unauthenticated users, render without sidebar
  return <main className="min-h-screen">{children}</main>;
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} h-full`}>
        <AuthProvider>
          <LayoutContent>{children}</LayoutContent>
        </AuthProvider>
      </body>
    </html>
  );
}