'use client';

import Link from 'next/link';

export default function MenuEscolhaModulo() {
  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        fontFamily: '-apple-system,BlinkMacSystemFont,system-ui,sans-serif',
      }}
    >
      <div style={{ width: '100%', maxWidth: 600, textAlign: 'center' }}>
        {/* Título */}
        <h1
          style={{
            fontSize: 42,
            fontWeight: 900,
            color: '#003087', // azul oficial da Holanda
            marginBottom: 12,
          }}
        >
          PowerNassau BI
        </h1>
        <p style={{ fontSize: 20, color: '#475569', marginBottom: 64 }}>
          Selecione o módulo desejado
        </p>

        {/* Botões grandes e limpos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {/* NASSAU – Azul Holanda */}
          <Link href="/dashboard">
            <button
              style={{
                width: '100%',
                padding: '28px',
                fontSize: 24,
                fontWeight: 800,
                color: 'white',
                background: 'linear-gradient(135deg, #003087, #0050c8)',
                border: 'none',
                borderRadius: 20,
                cursor: 'pointer',
                boxShadow: '0 20px 40px rgba(0,48,135,0.25)',
                transition: 'all 0.3s ease',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = '0 32px 60px rgba(0,48,135,0.35)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,48,135,0.25)';
              }}
            >
              Dashboard Operacional
            </button>
          </Link>

          {/* BIV – Laranja Real */}
          <Link href="/painel-imagemcor">
            <button
              style={{
                width: '100%',
                padding: '28px',
                fontSize: 24,
                fontWeight: 800,
                color: 'white',
                background: 'linear-gradient(135deg, #F36C21, #ff8c3a)',
                border: 'none',
                borderRadius: 20,
                cursor: 'pointer',
                boxShadow: '0 20px 40px rgba(243,108,33,0.25)',
                transition: 'all 0.3s ease',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = '0 32px 60px rgba(243,108,33,0.35)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(243,108,33,0.25)';
              }}
            >
              Painel Financeiro ImagemCor
            </button>
          </Link>
        </div>

        {/* Sair */}
        <button
          onClick={handleLogout}
          style={{
            marginTop: 72,
            color: '#64748b',
            fontSize: 17,
            fontWeight: 500,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          ← Sair do sistema
        </button>
      </div>
    </div>
  );
}