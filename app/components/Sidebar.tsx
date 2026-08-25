'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface SidebarProps {
  abaAtiva: string;
  onTrocarAba: (id: string) => void;
}

export default function Sidebar({ abaAtiva, onTrocarAba }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const menuItems = [
    {
      id: 'descontos',
      name: 'Painel de Descontos',
      icon: '📉',
    },
    {
      id: 'financeiro',
      name: 'Painel Financeiro',
      icon: '📊',
    },
    {
      id: 'operacional',
      name: 'Dashboard Operacional',
      icon: '📈',
    },
  ];

  const isActive = (id: string) => id === abaAtiva;

  const handleNavigation = (id: string) => {
    onTrocarAba(id);
    setIsOpen(false);
  };

  return (
    <>
      {/* Regras responsivas:
          - Desktop (>=768px): sidebar fixa e sempre visível; hamburger/overlay escondidos;
            conteúdo com classe .with-sidebar ganha espaço à esquerda.
          - Mobile (<768px): comportamento drawer atual controlado por isOpen. */}
      <style>{`
        @media (min-width: 768px) {
          .sidebar-toggle,
          .sidebar-overlay {
            display: none !important;
          }
          .app-sidebar {
            left: 0 !important;
            box-shadow: 2px 0 12px rgba(0, 0, 0, 0.35);
          }
          .with-sidebar {
            padding-left: 280px;
          }
        }
        @media (max-width: 767px) {
          .app-sidebar-header {
            padding-left: 72px;
          }
        }
      `}</style>

      {/* Botão de Menu (Hamburger) — apenas mobile */}
      <button
        className="sidebar-toggle"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          top: '16px',
          left: '16px',
          zIndex: 1000,
          backgroundColor: '#10b981',
          border: 'none',
          borderRadius: '8px',
          padding: '8px 12px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          fontSize: '20px',
        }}
        aria-label="Abrir menu"
      >
        {isOpen ? '✕' : '☰'}
      </button>

      {/* Overlay (quando sidebar está aberta no mobile) */}
      {isOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999,
          }}
        />
      )}

      {/* Sidebar */}
      <div
        className="app-sidebar"
        style={{
          position: 'fixed',
          top: 0,
          left: isOpen ? 0 : '-280px',
          width: '280px',
          height: '100vh',
          backgroundColor: '#0f172a',
          color: '#ffffff',
          zIndex: 999,
          transition: 'left 0.3s ease',
          overflowY: 'auto',
          boxShadow: '2px 0 12px rgba(0, 0, 0, 0.35)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header do Sidebar */}
        <div
          className="app-sidebar-header"
          style={{ padding: '24px 16px', borderBottom: '1px solid #374151' }}
        >
          <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, marginBottom: '4px' }}>
            Biodata
          </h2>
          <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>
            Painéis de Análise
          </p>
        </div>

        {/* Menu Items */}
        <nav style={{ flex: 1, padding: '16px 0' }}>
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.id)}
              style={{
                width: '100%',
                padding: '12px 16px',
                textAlign: 'left',
                border: 'none',
                backgroundColor: isActive(item.id) ? '#10b981' : 'transparent',
                color: isActive(item.id) ? '#ffffff' : '#d1d5db',
                cursor: 'pointer',
                borderLeft: isActive(item.id) ? '4px solid #059669' : '4px solid transparent',
                transition: 'all 0.2s ease',
                fontSize: '14px',
                fontWeight: 500,
              }}
              onMouseEnter={(e) => {
                if (!isActive(item.id)) {
                  e.currentTarget.style.backgroundColor = '#374151';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive(item.id)) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '20px' }}>{item.icon}</span>
                <div style={{ fontSize: '13px', fontWeight: 600 }}>{item.name}</div>
              </div>
            </button>
          ))}
        </nav>

        {/* Footer do Sidebar */}
        <div
          style={{
            padding: '16px',
            borderTop: '1px solid #374151',
            fontSize: '11px',
            color: '#6b7280',
            textAlign: 'center',
          }}
        >
          <p style={{ margin: 0, marginBottom: '8px' }}>Biodata Dashboard</p>
          <button
            onClick={() => {
              if (typeof window !== 'undefined') {
                // limpa o armazenamento local e o cookie de autenticação
                try {
                  window.localStorage.removeItem('logado');
                } catch {}
                try {
                  document.cookie = 'auth=; path=/; max-age=0';
                } catch {}
                router.push('/login');
              }
            }}
            style={{
              width: '100%',
              padding: '8px 12px',
              backgroundColor: '#dc2626',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600,
              marginTop: '8px',
              transition: 'background-color 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#991b1b';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#dc2626';
            }}
          >
            Sair
          </button>
        </div>
      </div>
    </>
  );
}
