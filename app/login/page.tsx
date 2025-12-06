'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro('');

    if (senha !== 'admin123') {
      setErro('Senha inválida.');
      return;
    }

    try {
      localStorage.setItem('logado', 'true');
    } catch {}

    router.push('/menu');
  }

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
      <div style={{ width: '100%', maxWidth: 480, textAlign: 'center' }}>
        {/* Título */}
        <h1
          style={{
            fontSize: 42,
            fontWeight: 900,
            color: '#003087', // azul Holanda
            marginBottom: 12,
          }}
        >
          PowerNassau BI
        </h1>
        <p style={{ fontSize: 20, color: '#475569', marginBottom: 64 }}>
          Bem-vindo! Informe a senha para continuar.
        </p>

        {/* Campo de senha */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          <div>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Digite sua senha"
              required
              style={{
                width: '100%',
                padding: '20px 24px',
                fontSize: 18,
                borderRadius: 16,
                border: '2px solid #e2e8f0',
                backgroundColor: '#ffffff',
                color: '#0f172a',
                outline: 'none',
                boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                transition: 'all 0.3s',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#003087')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#e2e8f0')}
            />
          </div>

          {erro && (
            <p style={{ fontSize: 16, color: '#dc2626', fontWeight: 500 }}>
              {erro}
            </p>
          )}

          {/* Botão Entrar – Azul Nassau */}
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '24px',
              fontSize: 22,
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
              e.currentTarget.style.transform = 'translateY(-6px)';
              e.currentTarget.style.boxShadow = '0 32px 60px rgba(0,48,135,0.35)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,48,135,0.25)';
            }}
          >
            Entrar no sistema
          </button>
        </form>

        <p style={{ fontSize: 14, color: '#64748b', marginTop: 48 }}>
          Em caso de dúvida, fale com o time da Nassau Tecnologia.
        </p>
      </div>
    </div>
  );
}