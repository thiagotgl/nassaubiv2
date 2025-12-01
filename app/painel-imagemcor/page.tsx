// app/painel-imagemcor/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LabelList,
} from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Converte "R$ 29.487,86" em número 29487.86
function parseBRLToNumber(texto: string | null | undefined): number {
  if (!texto) return 0;
  const limpo = texto.replace(/[^\d,.,-]/g, '').replace(/\./g, '').replace(',', '.');
  const n = Number(limpo);
  return Number.isFinite(n) ? n : 0;
}

// Converte qualquer coisa em número
function parseGenericNumber(v: any): number {
  if (v == null) return 0;
  if (typeof v === 'number') return v;
  const str = String(v).trim();
  if (!str) return 0;
  const num = Number(str.replace(/[^\d.-]/g, ''));
  return Number.isFinite(num) ? num : 0;
}

interface ConvenioRow {
  nome: string;
  valor: number;
  valorFormatado: string;
}

interface GrupoRow {
  nome: string;
  valor: number;
  valorFormatado: string;
  quantidade: number;
}

export default function PainelImagemCorPage() {
  const router = useRouter();

  useEffect(() => {
    try {
      const cliente = window.localStorage.getItem('painelCliente');
      // só permite quem logou como painel "imagemcor"
      if (cliente !== 'imagemcor') {
        router.replace('/login');
      }
    } catch {
      router.replace('/login');
    }
  }, [router]);
  
  const hoje = new Date();
  const hojeISO = hoje.toISOString().slice(0, 10);

  const [inicio, setInicio] = useState<string>(hojeISO);
  const [fim, setFim] = useState<string>(hojeISO);

  const [loading, setLoading] = useState<boolean>(false);
  const [erro, setErro] = useState<string | null>(null);

  // KPIs
  const [totalReceita, setTotalReceita] = useState<number>(0);
  const [novosPacientes, setNovosPacientes] = useState<number>(0);
  const [ticketMedio, setTicketMedio] = useState<number>(0);

  // Gráficos
  const [porConvenio, setPorConvenio] = useState<ConvenioRow[]>([]);
  const [porGrupo, setPorGrupo] = useState<GrupoRow[]>([]);

  const baseUrl =
    'https://apis.biodataweb.net/ImagemCor544/biodata/dashboard/grafico';

  async function carregarDados() {
    try {
      setLoading(true);
      setErro(null);

      // 1) Receita por convênio
      const urlConvenio =
        `${baseUrl}` +
        '?target_url=null' +
        '&procedure=spBIFaturamentoPorConvenioValor' +
        '&parametros=%40DATAINICIO,%40DATAFIM,%40Profissional,%40UNIDADE' +
        `&valores=${inicio},${fim},_,_,` +
        '&idSAC=544';

      const convRes = await fetch(urlConvenio);
      const convJson = await convRes.json();

      const convData: ConvenioRow[] = (convJson ?? []).map(
        (row: any, idx: number) => {
          const nome =
            row.Convenio ||
            row.CONVENIO ||
            row.convenio ||
            row.Nome ||
            row.NOME ||
            `Convênio ${idx + 1}`;

          const texto =
            row['R$'] ??
            row.valor_formatado ??
            row.VALOR_FORMATADO ??
            row.Valor ??
            row.VALOR ??
            'R$ 0,00';

          const valor = parseBRLToNumber(texto);

          return {
            nome: String(nome),
            valor,
            valorFormatado:
              typeof texto === 'string'
                ? texto
                : valor.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }),
          };
        }
      );

      setPorConvenio(convData);
      const total = convData.reduce((acc, item) => acc + item.valor, 0);
      setTotalReceita(total);

      // 2) Novos pacientes  ✅ AJUSTE AQUI (campo Unnamed1)
      const urlNovos =
        `${baseUrl}` +
        '?target_url=null' +
        '&procedure=spBIPacientesCadastrados' +
        '&parametros=%40DATAINICIO,%40DATAFIM,%40UNIDADE,%40CONVENIO,%40TIPOENTRADA' +
        `&valores=${inicio},${fim},_,_,_,` +
        '&idSAC=544';

      const novosRes = await fetch(urlNovos);
      const novosJson = await novosRes.json();
      const npRow = novosJson?.[0] ?? {};
      const npValor =
        npRow.Qtd ??
        npRow.QTD ??
        npRow.Quantidade ??
        npRow.TOTAL ??
        npRow.PACIENTES ??
        npRow.Unnamed1 ?? // <--- NOVO
        npRow.UNNAMED1 ?? // <--- NOVO
        0;
      setNovosPacientes(parseGenericNumber(npValor));

      // 3) Ticket médio
      const urlTicket =
        `${baseUrl}` +
        '?target_url=null' +
        '&procedure=spBITicketMedioCard' +
        '&parametros=%40DATAINICIO,%40DATAFIM,%40Profissional' +
        `&valores=${inicio},${fim},_` +
        '&idSAC=544';

      const ticketRes = await fetch(urlTicket);
      const ticketJson = await ticketRes.json();
      const tkRow = ticketJson?.[0] ?? {};
      const tkTexto =
        tkRow['R$'] ??
        tkRow.TicketMedio ??
        tkRow.TICKETMEDIO ??
        tkRow.Valor ??
        tkRow.VALOR ??
        'R$ 0,00';
      const tkValor = parseBRLToNumber(tkTexto);
      setTicketMedio(tkValor);

      // 4) Faturamento por grupo de procedimento  ✅ AJUSTE NO CAMPO Quant
      const urlGrupo =
        `${baseUrl}` +
        '?target_url=null' +
        '&procedure=spBIFaturamentoPorGrupodeProcedimentoValor' +
        '&parametros=%40DATAINICIO,%40DATAFIM,%40Profissional,%40UNIDADE,%40PROFISSIONAL' +
        `&valores=${inicio},${fim},_,_,_,` +
        '&idSAC=544';

      const grupoRes = await fetch(urlGrupo);
      const grupoJson = await grupoRes.json();

      const grpData: GrupoRow[] = (grupoJson ?? []).map(
        (row: any, idx: number) => {
          const nome =
            row.Grupo ||
            row.GRUPO ||
            row.GrupoProcedimento ||
            row.Grupo_Procedimento ||
            row.Nome ||
            `Grupo ${idx + 1}`;

          const texto =
            row['R$'] ??
            row.valor_formatado ??
            row.VALOR_FORMATADO ??
            row.Valor ??
            row.VALOR ??
            'R$ 0,00';
          const valor = parseBRLToNumber(texto);

          const qtd =
            row.Qtd ??
            row.QTD ??
            row.Quant ?? // <--- NOVO
            row.QUANT ?? // <--- NOVO
            row.Quantidade ??
            row.QTDE ??
            row.ATENDIMENTOS ??
            0;

          return {
            nome: String(nome),
            valor,
            valorFormatado:
              typeof texto === 'string'
                ? texto
                : valor.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }),
            quantidade: parseGenericNumber(qtd),
          };
        }
      );

      setPorGrupo(grpData);
    } catch (e) {
      console.error(e);
      setErro('Erro ao carregar dados. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarDados();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalReceitaFormatado = totalReceita.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
  const ticketMedioFormatado = ticketMedio.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  // Estilos base simples (sem Tailwind)
  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    backgroundColor: '#f3f4f6',
    color: '#020617',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, system-ui, -system-ui, sans-serif',
  };

  const wrapperStyle: React.CSSProperties = {
    maxWidth: '1120px',
    margin: '0 auto',
    padding: '32px 16px 40px',
  };

  const cardGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '16px',
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '16px 20px',
    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
    border: '1px solid #e5e7eb',
  };

  const chartSectionStyle: React.CSSProperties = {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '16px 20px',
    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
    border: '1px solid #e5e7eb',
    marginTop: '24px',
  };

  const chartContainerStyle: React.CSSProperties = {
    width: '100%',
    height: 320,
  };

  return (
    <div style={containerStyle}>
      <div style={wrapperStyle}>
        {/* TÍTULO */}
        <header style={{ marginBottom: '24px' }}>
          <h1
            style={{
              fontSize: '28px',
              fontWeight: 900,
              marginBottom: '8px',
            }}
          >
            Painel Financeiro — ImagemCor
          </h1>
          <p style={{ fontSize: '14px', color: '#4b5563' }}>
            Período:{' '}
            <strong>
              {format(new Date(inicio), 'dd/MM/yyyy', { locale: ptBR })} até{' '}
              {format(new Date(fim), 'dd/MM/yyyy', { locale: ptBR })}
            </strong>
          </p>

          {/* FILTROS */}
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
              <label style={{ fontSize: '12px', color: '#6b7280' }}>
                Data inicial
              </label>
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
              <label style={{ fontSize: '12px', color: '#6b7280' }}>
                Data final
              </label>
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
              onClick={carregarDados}
              disabled={loading}
              style={{
                marginTop: '18px',
                padding: '6px 14px',
                borderRadius: '9999px',
                border: 'none',
                backgroundColor: loading ? '#9ca3af' : '#10b981',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '13px',
                cursor: loading ? 'default' : 'pointer',
              }}
            >
              {loading ? 'Atualizando...' : 'Atualizar dados'}
            </button>

            {erro && (
              <span style={{ fontSize: '12px', color: '#dc2626' }}>{erro}</span>
            )}
          </div>
        </header>

        {/* CARDS KPIs */}
        <section style={cardGridStyle}>
          {/* Volume de atendimento */}
          <div style={cardStyle}>
            <p
              style={{
                fontSize: '11px',
                textTransform: 'uppercase',
                color: '#6b7280',
                letterSpacing: '0.06em',
              }}
            >
              Volume de atendimento (R$)
            </p>
            <p
              style={{
                marginTop: '8px',
                fontSize: '22px',
                fontWeight: 900,
                color: '#047857',
              }}
            >
              {totalReceitaFormatado}
            </p>
            <p
              style={{
                marginTop: '6px',
                fontSize: '11px',
                color: '#6b7280',
              }}
            >
              Soma da receita por convênio no período selecionado.
            </p>
          </div>

          {/* Novos pacientes */}
          <div style={cardStyle}>
            <p
              style={{
                fontSize: '11px',
                textTransform: 'uppercase',
                color: '#6b7280',
                letterSpacing: '0.06em',
              }}
            >
              Novos pacientes
            </p>
            <p
              style={{
                marginTop: '8px',
                fontSize: '22px',
                fontWeight: 900,
                color: '#0ea5e9',
              }}
            >
              {novosPacientes.toLocaleString('pt-BR')}
            </p>
            <p
              style={{
                marginTop: '6px',
                fontSize: '11px',
                color: '#6b7280',
              }}
            >
              Pacientes cadastrados no período.
            </p>
          </div>

          {/* Ticket médio */}
          <div style={cardStyle}>
            <p
              style={{
                fontSize: '11px',
                textTransform: 'uppercase',
                color: '#6b7280',
                letterSpacing: '0.06em',
              }}
            >
              Ticket médio
            </p>
            <p
              style={{
                marginTop: '8px',
                fontSize: '22px',
                fontWeight: 900,
                color: '#d97706',
              }}
            >
              {ticketMedioFormatado}
            </p>
            <p
              style={{
                marginTop: '6px',
                fontSize: '11px',
                color: '#6b7280',
              }}
            >
              Valor médio por atendimento no período.
            </p>
          </div>
        </section>

        {/* GRÁFICO 1 – Receita por Convênio */}
        <section style={chartSectionStyle}>
          <h2
            style={{
              fontSize: '18px',
              fontWeight: 600,
              marginBottom: '4px',
            }}
          >
            Receita por Convênio (R$)
          </h2>
          <p style={{ fontSize: '11px', color: '#6b7280', marginBottom: '8px' }}>
            Comparação do faturamento por convênio no período selecionado.
          </p>

          <div style={chartContainerStyle}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={porConvenio}
                margin={{ top: 20, right: 20, left: 0, bottom: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="nome"
                  angle={-30}
                  textAnchor="end"
                  interval={0}
                  height={60}
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
                <Legend />
                <Bar dataKey="valor" fill="#fb923c">
                  <LabelList
                    dataKey="valorFormatado"
                    position="top"
                    style={{
                      fontSize: 11,
                      fill: '#92400e',
                      fontWeight: 600,
                    }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* GRÁFICO 2 – Receita por Grupo */}
        <section style={chartSectionStyle}>
          <h2
            style={{
              fontSize: '18px',
              fontWeight: 600,
              marginBottom: '4px',
            }}
          >
            Receita por Grupo de Procedimento (R$)
          </h2>
          <p style={{ fontSize: '11px', color: '#6b7280', marginBottom: '8px' }}>
            Valor faturado por grupo de procedimento no período.
          </p>

          <div style={chartContainerStyle}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={porGrupo}
                margin={{ top: 20, right: 20, left: 0, bottom: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="nome"
                  angle={-30}
                  textAnchor="end"
                  interval={0}
                  height={60}
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
                <Legend />
                <Bar dataKey="valor" fill="#a855f7">
                  <LabelList
                    dataKey="valorFormatado"
                    position="top"
                    style={{
                      fontSize: 11,
                      fill: '#4c1d95',
                      fontWeight: 600,
                    }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* GRÁFICO 3 – Quantidade por Grupo */}
        <section style={chartSectionStyle}>
          <h2
            style={{
              fontSize: '18px',
              fontWeight: 600,
              marginBottom: '4px',
            }}
          >
            Quantidade de Atendimentos por Grupo
          </h2>
          <p style={{ fontSize: '11px', color: '#6b7280', marginBottom: '8px' }}>
            Número de atendimentos realizados em cada grupo de procedimento.
          </p>

          <div style={chartContainerStyle}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={porGrupo}
                margin={{ top: 20, right: 20, left: 0, bottom: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="nome"
                  angle={-30}
                  textAnchor="end"
                  interval={0}
                  height={60}
                  tick={{ fill: '#6b7280', fontSize: 11 }}
                />
                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="quantidade" fill="#22c55e">
                  <LabelList
                    dataKey="quantidade"
                    position="top"
                    style={{
                      fontSize: 11,
                      fill: '#166534',
                      fontWeight: 600,
                    }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <footer
          style={{
            marginTop: '32px',
            fontSize: '11px',
            textAlign: 'center',
            color: '#6b7280',
          }}
        >
          Dados integrados ao Biodata — ImagemCor • Painel em construção
        </footer>
      </div>
    </div>
  );
}
