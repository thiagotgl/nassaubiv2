// app/painel-imagemcor/page.tsx
'use client';

import { useEffect, useState } from 'react';
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
  ComposedChart,
  Line,
} from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Converte textos no padrão brasileiro ("R$ 29.487,86", "29.487,86")
 * em número (29487.86).
 */
function parseBRLToNumber(texto: string | null | undefined): number {
  if (!texto) return 0;
  const limpo = texto.replace(/[^\d,.,-]/g, '').replace(/\./g, '').replace(',', '.');
  const n = Number(limpo);
  return Number.isFinite(n) ? n : 0;
}

// Tipagens básicas
interface ConvenioRow {
  nome: string;
  valor: number;
  valorFormatado: string;
}

interface GrupoRow {
  nome: string;
  valor: number;
  valorFormatado: string;
}

export default function PainelImagemCor() {
  // Filtros
  const [inicio, setInicio] = useState<string>(() => {
    const hoje = new Date();
    return hoje.toISOString().slice(0, 10);
  });

  const [fim, setFim] = useState<string>(() => {
    const hoje = new Date();
    return hoje.toISOString().slice(0, 10);
  });

  // KPIs
  const [totalReceita, setTotalReceita] = useState<number>(0);
  const [novosPacientes, setNovosPacientes] = useState<number>(0);
  const [ticketMedio, setTicketMedio] = useState<number>(0);

  // Gráficos
  const [porConvenio, setPorConvenio] = useState<ConvenioRow[]>([]);
  const [porGrupo, setPorGrupo] = useState<GrupoRow[]>([]);

  const [loading, setLoading] = useState<boolean>(true);

  // Helper para montar URL da Biodata
  const baseUrl =
    'https://apis.biodataweb.net/ImagemCor544/biodata/dashboard/grafico';

  const carregarDados = async () => {
    setLoading(true);

    try {
      // ========= 1) Faturamento por Convênio =========
      {
        const url =
          `${baseUrl}` +
          '?target_url=null' +
          '&procedure=spBIFaturamentoPorConvenioValor' +
          '&parametros=%40DATAINICIO,%40DATAFIM,%40Profissional,%40UNIDADE' +
          `&valores=${inicio},${fim},_,_,` +
          '&idSAC=544';

        const res = await fetch(url);
        const json = await res.json();

        const conv: ConvenioRow[] = (json ?? []).map((row: any, idx: number) => {
          const nome =
            row.Convenio ||
            row.CONVENIO ||
            row.convenio ||
            row.Nome ||
            `Convênio ${idx + 1}`;

          const texto = row['R$'] ?? row.Valor ?? row.VALOR ?? 'R$ 0,00';
          const valor = parseBRLToNumber(texto);

          return {
            nome,
            valor,
            valorFormatado: texto,
          };
        });

        setPorConvenio(conv);

        // Volume de atendimento em R$ = soma da receita por convênio
        const total = conv.reduce((acc, item) => acc + item.valor, 0);
        setTotalReceita(total);
      }

      // ========= 2) Novos Pacientes =========
      {
        const url =
          `${baseUrl}` +
          '?target_url=null' +
          '&procedure=spBIPacientesCadastrados' +
          '&parametros=%40DATAINICIO,%40DATAFIM,%40UNIDADE,%40CONVENIO,%40TIPOENTRADA' +
          `&valores=${inicio},${fim},_,_,_,` +
          '&idSAC=544';

        const res = await fetch(url);
        const json = await res.json();
        const row = json?.[0] ?? {};

        const qtd =
          Number(row.Qtd ?? row.QTD ?? row.Quantidade ?? row.PACIENTES ?? 0) ||
          0;

        setNovosPacientes(qtd);
      }

      // ========= 3) Ticket Médio =========
      {
        const url =
          `${baseUrl}` +
          '?target_url=null' +
          '&procedure=spBITicketMedioCard' +
          '&parametros=%40DATAINICIO,%40DATAFIM,%40Profissional' +
          `&valores=${inicio},${fim},_` +
          '&idSAC=544';

        const res = await fetch(url);
        const json = await res.json();
        const row = json?.[0] ?? {};

        const texto =
          row['R$'] ??
          row.TICKETMEDIO ??
          row.TicketMedio ??
          row.Ticket ??
          'R$ 0,00';

        const valor = parseBRLToNumber(texto);
        setTicketMedio(valor);
      }

      // ========= 4) Faturamento por Grupo de Procedimento =========
      {
        const url =
          `${baseUrl}` +
          '?target_url=null' +
          '&procedure=spBIFaturamentoPorGrupodeProcedimentoValor' +
          '&parametros=%40DATAINICIO,%40DATAFIM,%40Profissional,%40UNIDADE,%40PROFISSIONAL' +
          `&valores=${inicio},${fim},_,_,_,` +
          '&idSAC=544';

        const res = await fetch(url);
        const json = await res.json();

        const grupos: GrupoRow[] = (json ?? []).map((row: any, idx: number) => {
          const nome =
            row.Grupo ||
            row.GRUPO ||
            row.GrupoProcedimento ||
            row.Nome ||
            `Grupo ${idx + 1}`;

          const texto = row['R$'] ?? row.Valor ?? row.VALOR ?? 'R$ 0,00';
          const valor = parseBRLToNumber(texto);

          return {
            nome,
            valor,
            valorFormatado: texto,
          };
        });

        setPorGrupo(grupos);
      }
    } catch (err) {
      console.error('Erro ao carregar dados do painel ImagemCor:', err);
    } finally {
      setLoading(false);
    }
  };

  // Carregar ao montar e sempre que trocar o período
  useEffect(() => {
    carregarDados();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inicio, fim]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <p className="text-4xl md:text-6xl font-bold animate-pulse">
          Carregando painel ImagemCor...
        </p>
      </div>
    );
  }

  const totalReceitaFormatado = totalReceita.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
  const ticketMedioFormatado = ticketMedio.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="max-w-7xl mx-auto px-6 py-10 space-y-12">
        {/* TÍTULO E PERÍODO */}
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight">
              Painel Financeiro — ImagemCor
            </h1>
            <p className="mt-2 text-slate-300 text-lg">
              Período:{' '}
              <span className="font-semibold">
                {format(new Date(inicio), "dd 'de' MMMM 'de' yyyy", {
                  locale: ptBR,
                })}{' '}
                —{' '}
                {format(new Date(fim), "dd 'de' MMMM 'de' yyyy", {
                  locale: ptBR,
                })}
              </span>
            </p>
          </div>

          {/* FILTROS DE DATA */}
          <div className="flex flex-wrap items-center gap-3 bg-slate-900/70 px-4 py-3 rounded-2xl border border-slate-700/60">
            <div className="flex flex-col text-sm">
              <span className="text-slate-400 mb-1">Data inicial</span>
              <input
                type="date"
                value={inicio}
                onChange={(e) => setInicio(e.target.value)}
                className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div className="flex flex-col text-sm">
              <span className="text-slate-400 mb-1">Data final</span>
              <input
                type="date"
                value={fim}
                onChange={(e) => setFim(e.target.value)}
                className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <button
              type="button"
              onClick={carregarDados}
              className="mt-4 md:mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-semibold text-sm shadow-md hover:bg-amber-400 transition"
            >
              Atualizar dados
            </button>
          </div>
        </header>

        {/* CARDS DE KPI */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Volume total em R$ */}
          <div className="bg-slate-900/80 rounded-3xl p-6 border border-slate-700/60 shadow-lg">
            <p className="text-sm font-medium text-slate-400">
              Volume de atendimento (R$)
            </p>
            <p className="mt-3 text-3xl md:text-4xl font-black text-amber-400">
              {totalReceitaFormatado}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Soma da receita por convênio no período selecionado.
            </p>
          </div>

          {/* Novos pacientes */}
          <div className="bg-slate-900/80 rounded-3xl p-6 border border-slate-700/60 shadow-lg">
            <p className="text-sm font-medium text-slate-400">
              Novos pacientes
            </p>
            <p className="mt-3 text-3xl md:text-4xl font-black text-emerald-400">
              {novosPacientes.toLocaleString('pt-BR')}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Pacientes cadastrados no período.
            </p>
          </div>

          {/* Ticket médio */}
          <div className="bg-slate-900/80 rounded-3xl p-6 border border-slate-700/60 shadow-lg">
            <p className="text-sm font-medium text-slate-400">Ticket médio</p>
            <p className="mt-3 text-3xl md:text-4xl font-black text-sky-400">
              {ticketMedioFormatado}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Valor médio por atendimento no período.
            </p>
          </div>
        </section>

        {/* GRÁFICOS PRINCIPAIS */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* RECEITA POR CONVÊNIO */}
          <div className="bg-slate-900/80 rounded-3xl p-6 border border-slate-700/60 shadow-lg">
            <h2 className="text-xl font-semibold mb-4">
              Receita por Convênio (R$)
            </h2>
            <div className="w-full h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={porConvenio}
                  margin={{ top: 20, right: 20, left: 0, bottom: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis
                    dataKey="nome"
                    angle={-30}
                    textAnchor="end"
                    interval={0}
                    height={60}
                    tick={{ fill: '#9ca3af', fontSize: 11 }}
                  />
                  <YAxis
                    tick={{ fill: '#9ca3af', fontSize: 11 }}
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
                  <Bar dataKey="valor" fill="#fb923c" radius={[8, 8, 0, 0]}>
                    <LabelList
                      dataKey="valorFormatado"
                      position="top"
                      formatter={(v: any) => v}
                      style={{
                        fontSize: 11,
                        fill: '#fed7aa',
                        fontWeight: 600,
                      }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* RECEITA POR GRUPO DE PROCEDIMENTO */}
          <div className="bg-slate-900/80 rounded-3xl p-6 border border-slate-700/60 shadow-lg">
            <h2 className="text-xl font-semibold mb-4">
              Receita por Grupo de Procedimento (R$)
            </h2>
            <div className="w-full h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={porGrupo}
                  margin={{ top: 20, right: 20, left: 0, bottom: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis
                    dataKey="nome"
                    angle={-30}
                    textAnchor="end"
                    interval={0}
                    height={60}
                    tick={{ fill: '#9ca3af', fontSize: 11 }}
                  />
                  <YAxis
                    tick={{ fill: '#9ca3af', fontSize: 11 }}
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
                  <Bar dataKey="valor" fill="#a855f7" radius={[8, 8, 0, 0]}>
                    <LabelList
                      dataKey="valorFormatado"
                      position="top"
                      formatter={(v: any) => v}
                      style={{
                        fontSize: 11,
                        fill: '#ddd6fe',
                        fontWeight: 600,
                      }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* GRÁFICO COMPLEMENTAR – COMPARAÇÃO ENTRE GRUPOS */}
        <section className="bg-slate-900/80 rounded-3xl p-6 border border-slate-700/60 shadow-lg">
          <h2 className="text-xl font-semibold mb-4">
            Comparativo entre Grupos (linha + barras)
          </h2>
          <div className="w-full h-96">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={porGrupo}
                margin={{ top: 20, right: 40, left: 0, bottom: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis
                  dataKey="nome"
                  angle={-30}
                  textAnchor="end"
                  interval={0}
                  height={60}
                  tick={{ fill: '#9ca3af', fontSize: 11 }}
                />
                <YAxis
                  tick={{ fill: '#9ca3af', fontSize: 11 }}
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
                <Bar dataKey="valor" fill="#22c55e" radius={[6, 6, 0, 0]} />
                <Line
                  type="monotone"
                  dataKey="valor"
                  stroke="#38bdf8"
                  strokeWidth={3}
                  dot={{ r: 5 }}
                  activeDot={{ r: 7 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </section>

        <footer className="pb-10 text-center text-xs text-slate-500">
          Dados provenientes do Biodata — ImagemCor • Painel em construção
        </footer>
      </div>
    </div>
  );
}
