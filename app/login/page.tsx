// app/login/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Painéis “cadastrados” (sem banco, só aqui no código)
const CLIENTES = {
  dashboard: {
    label: 'Clínica — Faturamento geral',
    path: '/dashboard',
    senha: 'admin123',      // <<< AJUSTE AQUI SE QUISER
  },
  imagemcor: {
    label: 'ImagemCor — Painel Financeiro',
    path: '/painel-imagemcor',
    senha: 'admin123',    // <<< AJUSTE AQUI SE QUISER
  },
} as const;

type ClienteKey = keyof typeof CLIENTES;

export default function LoginPage() {
  const router = useRouter();

  const [cliente, setCliente] = useState<ClienteKey>('dashboard');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(true);

  // Se já estiver logado, redireciona pro painel salvo
  useEffect(() => {
    try {
      const salvo = window.localStorage.getItem('painelCliente');
      if (salvo && salvo in CLIENTES) {
        const key = salvo as ClienteKey;
        router.replace(CLIENTES[key].path);
        return;
      }
    } catch {
      // se der erro no localStorage, só segue pro login mesmo
    }
    setCarregando(false);
  }, [router]);

  if (carregando) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg,#0f172a,#1e293b)',
          color: '#e5e7eb',
          fontFamily:
            '-apple-system,BlinkMacSystemFont,system-ui,-system-ui,sans-serif',
        }}
      >
        <p style={{ fontSize: 24, fontWeight: 600 }}>Carregando...</p>
      </div>
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro('');

    const config = CLIENTES[cliente];

    if (senha !== config.senha) {
      setErro('Senha inválida para este painel.');
      return;
    }

    try {
      window.localStorage.setItem('painelCliente', cliente);
    } catch {
      // se não conseguir salvar, ainda assim deixa entrar
    }

    router.push(config.path);
  }

  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background:
      'radial-gradient(circle at top, #22c55e33 0, transparent 45%), linear-gradient(135deg,#020617,#0f172a)',
    color: '#e5e7eb',
    fontFamily:
      '-apple-system,BlinkMacSystemFont,system-ui,-system-ui,sans-serif',
    padding: '16px',
  };

  const cardStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#020617',
    borderRadius: 20,
    padding: '28px 24px 24px',
    boxShadow: '0 24px 60px rgba(15,23,42,0.8)',
    border: '1px solid rgba(148,163,184,0.3)',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: '#9ca3af',
    marginBottom: 6,
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    borderRadius: 10,
    border: '1px solid #4b5563',
    backgroundColor: '#020617',
    color: '#e5e7eb',
    padding: '8px 10px',
    fontSize: 14,
    outline: 'none',
  };

  const buttonStyle: React.CSSProperties = {
    width: '100%',
    borderRadius: 9999,
    border: 'none',
    padding: '10px 12px',
    marginTop: 12,
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    background: 'linear-gradient(90deg,#22c55e,#a3e635)',
    color: '#022c22',
    boxShadow: '0 12px 30px rgba(34,197,94,0.5)',
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 800,
            marginBottom: 6,
          }}
        >
          PowerNassau BI
        </h1>
        <p
          style={{
            fontSize: 13,
            color: '#9ca3af',
            marginBottom: 20,
          }}
        >
          Escolha o painel e informe a senha de acesso.
        </p>

        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
        >
          {/* Seleção de painel/cliente */}
          <div>
            <label style={labelStyle}>Cliente / Painel</label>
            <select
              value={cliente}
              onChange={(e) => setCliente(e.target.value as ClienteKey)}
              style={{
                ...inputStyle,
                paddingTop: 9,
                paddingBottom: 9,
              }}
            >
              {Object.entries(CLIENTES).map(([key, cfg]) => (
                <option key={key} value={key}>
                  {cfg.label}
                </option>
              ))}
            </select>
          </div>

          {/* Senha */}
          <div>
            <label style={labelStyle}>Senha de acesso</label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Digite a senha do painel"
              style={inputStyle}
            />
          </div>

          {erro && (
            <p
              style={{
                fontSize: 12,
                color: '#f97316',
                marginTop: 4,
              }}
            >
              {erro}
            </p>
          )}

          <button type="submit" style={buttonStyle}>
            Entrar no painel
          </button>
        </form>

        <p
          style={{
            fontSize: 11,
            color: '#6b7280',
            marginTop: 16,
          }}
        >
          Em caso de dúvida ou esquecimento da senha, fale com o time da
          Nassau Tecnologia.
        </p>
      </div>
    </div>
  );
}
