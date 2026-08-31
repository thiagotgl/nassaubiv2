'use client';

import { useState } from 'react';
import Card from '../components/ui/Card';
import { cores } from '../components/ui/tema';

export default function LoginPage() {
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
      // também grava um cookie simples que o middleware pode ler
      try {
        document.cookie = `auth=true; path=/; max-age=${60 * 60 * 24}`; // 1 dia
      } catch (err) {}
    } catch {}

    // Navegação completa garante que o cookie recém-criado seja validado pelo
    // middleware antes de abrir o dashboard.
    try {
      const params = new URLSearchParams(window.location.search);
      const from = params.get('from');
      const destino =
        from?.startsWith('/') && !from.startsWith('//') ? from : '/dashboard';
      window.location.assign(destino);
    } catch {
      window.location.assign('/dashboard');
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: cores.fundo,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
      }}
    >
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <Card estilo={{ marginTop: 0, padding: '32px' }}>
          <header style={{ marginBottom: '24px' }}>
            <p
              style={{
                marginBottom: '8px',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: cores.suave,
              }}
            >
              Acesso ao dashboard
            </p>
            <h1
              style={{
                marginBottom: '8px',
                fontSize: '28px',
                fontWeight: 900,
                color: cores.primaria,
              }}
            >
              PowerNassau BI
            </h1>
            <p style={{ fontSize: '14px', color: cores.corpo }}>
              Informe a senha para continuar.
            </p>
          </header>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label htmlFor="senha" style={{ fontSize: '13px', fontWeight: 600, color: cores.corpo }}>
                Senha
              </label>
              <input
                id="senha"
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Digite sua senha"
                required
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  fontSize: '16px',
                  borderRadius: '8px',
                  border: `1px solid ${cores.borda}`,
                  backgroundColor: cores.card,
                  color: cores.titulo,
                  outline: 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = cores.primaria;
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0, 48, 135, 0.12)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = cores.borda;
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            {erro && (
              <p
                style={{
                  padding: '10px 12px',
                  border: `1px solid #fecaca`,
                  borderRadius: '8px',
                  backgroundColor: '#fef2f2',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: cores.erro,
                }}
              >
                {erro}
              </p>
            )}

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: '16px',
                fontWeight: 700,
                color: '#ffffff',
                backgroundColor: cores.acao,
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
                transition: 'background-color 0.2s, transform 0.2s',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = cores.acaoEscura;
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = cores.acao;
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Entrar no sistema
            </button>
          </form>

          <p style={{ marginTop: '24px', fontSize: '12px', color: cores.suave }}>
            Em caso de dúvida, fale com o time da Nassau Tecnologia.
          </p>
        </Card>
      </div>
    </div>
  );
}
