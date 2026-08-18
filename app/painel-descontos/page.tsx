'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../components/Sidebar';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export default function PainelDescontosPage() {
  const router = useRouter();

  // Converte "25,62" ou "472,1" em número 25.62 / 472.1
  function parseBRLToNumber(texto: string | null | undefined): number {
    if (!texto) return 0;
    const normalizado = String(texto).trim().replace('.', '').replace(',', '.');
    const n = Number(normalizado);
    return Number.isFinite(n) ? n : 0;
  }

  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [porConvenio, setPorConvenio] = useState<
    { convenio: string; faturado: number; desconto: number; liquido: number }[]
  >([]);

  const [inicio, setInicio] = useState<string>('2026-08-01');
  const [fim, setFim] = useState<string>('2026-08-18');

  const baseUrl =
    'https://apis.biodataweb.net/ImagemCor544/biodata/dashboard/grafico';

  function montarUrl(dataInicio: string, dataFim: string) {
    return (
      baseUrl +
      '?target_url=null' +
      '&procedure=spBIListaDescontoDtAtende' +
      '&parametros=%40DATAINICIO,%40DATAFIM,%40UNIDADE' +
      `&valores=${dataInicio},${dataFim},_,` +
      '&idSAC=544'
    );
  }

  const carregar = async () => {
    try {
      setLoading(true);
      setErro(null);
      const res = await fetch(montarUrl(inicio, fim));
      if (!res.ok) {
        throw new Error(`Erro HTTP ${res.status}`);
      }
      const json = await res.json();
      const dados = Array.isArray(json) ? json : [json];

      const mapa: Record<string, { faturado: number; desconto: number }> = {};

      dados.forEach((item: any) => {
        const convenio = String(item.Convenio ?? 'Sem convênio').trim();
        if (!mapa[convenio]) {
          mapa[convenio] = { faturado: 0, desconto: 0 };
        }
        mapa[convenio].faturado += parseBRLToNumber(item.Faturado);
        mapa[convenio].desconto += parseBRLToNumber(item.Desconto);
      });

      const agregado = Object.entries(mapa)
        .map(([convenio, v]) => ({
          convenio,
          ...v,
          liquido: v.faturado - v.desconto,
        }))
        .sort((a, b) => b.faturado - a.faturado);

      setPorConvenio(agregado);
    } catch (e: any) {
      console.error(e);
      setErro('Erro ao carregar dados. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    try {
      const logado = window.localStorage.getItem('logado');
      if (!logado) {
        router.replace('/login');
        return;
      }
    } catch {
      router.replace('/login');
      return;
    }

    carregar();
  }, [router]);

  function formatarData(iso: string) {
    const [ano, mes, dia] = iso.split('-');
    return `${dia}/${mes}/${ano}`;
  }

  const totalFaturado = porConvenio.reduce((soma, l) => soma + l.faturado, 0);
  const totalDesconto = porConvenio.reduce((soma, l) => soma + l.desconto, 0);
  const totalLiquido = totalFaturado - totalDesconto;

  const top10 = porConvenio.slice(0, 10);

  const formatBRL = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    backgroundColor: '#f3f4f6',
    color: '#020617',
    fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
  };

  const wrapperStyle: React.CSSProperties = {
    maxWidth: '1120px',
    margin: '0 auto',
    padding: '32px 16px 40px',
  };

  return (
    <>
      <Sidebar />
      <div style={containerStyle}>
        <div style={wrapperStyle}>
          <header style={{ marginBottom: '24px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 900, marginBottom: '8px' }}>
              Painel de Descontos
            </h1>
            <p style={{ fontSize: '14px', color: '#4b5563' }}>
              Período:{' '}
              <strong>
                {formatarData(inicio)} até {formatarData(fim)}
              </strong>
            </p>
            <div
              style={{
                marginTop: '12px',
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '10px',
                padding: '12px 16px',
                fontSize: '14px',
                color: '#1e40af',
                fontWeight: 600,
                display: 'inline-block',
              }}
            >
              Os valores desta aba são informados conforme a data do atendimento.
            </div>

            <div
              style={{
                marginTop: '16px',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'flex-end',
                gap: '12px',
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                padding: '12px 14px',
                border: '1px solid #e5e7eb',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: '12px', color: '#6b7280' }}>Data inicial</label>
                <input
                  type="date"
                  value={inicio}
                  onChange={(e) => setInicio(e.target.value)}
                  style={{
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    padding: '4px 8px',
                    fontSize: '13px',
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: '12px', color: '#6b7280' }}>Data final</label>
                <input
                  type="date"
                  value={fim}
                  onChange={(e) => setFim(e.target.value)}
                  style={{
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    padding: '4px 8px',
                    fontSize: '13px',
                  }}
                />
              </div>

              <button
                type="button"
                onClick={carregar}
                disabled={loading}
                style={{
                  marginTop: '18px',
                  backgroundColor: loading ? '#9ca3af' : '#10b981',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: loading ? 'default' : 'pointer',
                  padding: '6px 14px',
                  borderRadius: '9999px',
                  border: 'none',
                }}
              >
                {loading ? 'Atualizando...' : 'Atualizar dados'}
              </button>
            </div>
          </header>

          {loading && <p style={{ fontSize: '16px', color: '#4b5563' }}>Carregando dados...</p>}

          {erro && <p style={{ fontSize: '16px', color: '#dc2626' }}>{erro}</p>}

          {!loading && !erro && porConvenio.length === 0 && (
            <p style={{ fontSize: '16px', color: '#4b5563' }}>
              Nenhum registro encontrado no período.
            </p>
          )}

          {!loading && !erro && porConvenio.length > 0 && (
            <section
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                padding: '16px 20px',
                boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
                border: '1px solid #e5e7eb',
                marginTop: '24px',
              }}
            >
              <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
                Top 10 Convênios por Faturamento
              </h2>
              <p style={{ fontSize: '11px', color: '#6b7280', marginBottom: '8px' }}>
                Comparação de faturado, desconto e valor líquido no período selecionado.
              </p>
              <div style={{ width: '100%', height: 380 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={top10} margin={{ top: 20, right: 20, left: 0, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="convenio"
                      angle={-30}
                      textAnchor="end"
                      interval={0}
                      height={70}
                      tick={{ fill: '#6b7280', fontSize: 11 }}
                    />
                    <YAxis
                      tick={{ fill: '#6b7280', fontSize: 11 }}
                      tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      formatter={(v: any) =>
                        Number(v).toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })
                      }
                    />
                    <Legend
                      formatter={(value) => (
                        <span style={{ marginRight: 24 }}>{value}</span>
                      )}
                    />
                    <Bar dataKey="desconto" name="Total de Desconto" fill="#b45309" />
                    <Bar dataKey="faturado" name="Total Faturado" fill="#1d4ed8" />
                    <Bar dataKey="liquido" name="Valor Líquido" fill="#047857" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          )}

          {!loading && !erro && porConvenio.length > 0 && (
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                padding: '16px 20px',
                boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
                border: '1px solid #e5e7eb',
                overflowX: 'auto',
                marginTop: '24px',
              }}
            >
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '13px',
                }}
              >
                <thead>
                  <tr>
                    {['Convênio', 'Total de Desconto', 'Total Faturado', 'Valor Líquido'].map((col) => (
                      <th
                        key={col}
                        style={{
                          textAlign: 'left',
                          padding: '10px 12px',
                          borderBottom: '2px solid #e5e7eb',
                          color: '#6b7280',
                          textTransform: 'uppercase',
                          fontSize: '11px',
                          letterSpacing: '0.05em',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {porConvenio.map((linha, i) => (
                    <tr key={linha.convenio}>
                      <td style={{ padding: '8px 12px', borderBottom: '1px solid #f3f4f6', fontWeight: 600 }}>
                        {linha.convenio}
                      </td>
                      <td style={{ padding: '8px 12px', borderBottom: '1px solid #f3f4f6', color: '#b45309', whiteSpace: 'nowrap' }}>
                        {formatBRL(linha.desconto)}
                      </td>
                      <td style={{ padding: '8px 12px', borderBottom: '1px solid #f3f4f6', color: '#1d4ed8', whiteSpace: 'nowrap' }}>
                        {formatBRL(linha.faturado)}
                      </td>
                      <td style={{ padding: '8px 12px', borderBottom: '1px solid #f3f4f6', color: '#047857', whiteSpace: 'nowrap' }}>
                        {formatBRL(linha.liquido)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td style={{ padding: '10px 12px', fontWeight: 800 }}>
                      Total geral
                    </td>
                    <td style={{ padding: '10px 12px', fontWeight: 800, color: '#b45309', whiteSpace: 'nowrap' }}>
                      {formatBRL(totalDesconto)}
                    </td>
                    <td style={{ padding: '10px 12px', fontWeight: 800, color: '#1d4ed8', whiteSpace: 'nowrap' }}>
                      {formatBRL(totalFaturado)}
                    </td>
                    <td style={{ padding: '10px 12px', fontWeight: 800, color: '#047857', whiteSpace: 'nowrap' }}>
                      {formatBRL(totalLiquido)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
