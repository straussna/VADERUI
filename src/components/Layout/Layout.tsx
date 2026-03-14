import React from 'react';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="layout">
      <header className="layout-header">
        <h1>VADER — Solute Transport UI</h1>
      </header>
      <main className="layout-main">{children}</main>
    </div>
  );
}
