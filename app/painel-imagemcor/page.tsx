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
} from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Converte textos tipo "R$ 29.487,86" em número 29487.86
 */
function parseBRLToNumber(texto: string | null | undefined): number {
  if (!texto) return 0;
  const limpo = texto.replace(/[^\d,.,-]/g, '').replace(/\./g, '').replace(',', '.');
  const n = Number(limpo);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Converte valores genéricos (string/number) em número
 */
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
  // Datas padrão: hoje
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

      // ========== 1) Receita por Convênio ==========
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

      // Volume total em R$ (soma por convênio)
      const total = convData.reduce((acc, item) => acc + item.valor, 0);
      setTotalReceita(total);

      // ========== 2) Novos Pacientes ==========
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
        0;
      setNovosPacientes(parseGenericNumber(npValor));

      // ========== 3) Ticket Médio ==========
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

      // ========== 4) Faturamento por Grupo de Procedimento ==========
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

  // Carrega na montagem inicial
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

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-10">
        {/* TÍTULO E PERÍODO */}
        <header className="space-y-3">
          <h1 className="text-3xl md:text-4xl font-black">
            Painel Financeiro — ImagemCor
          </h1>
          <p className="text-sm md:text-base text-slate-600">
            Período:{' '}
            <span className="font-semibold">
              {format(new Date(inicio), "dd/MM/yyyy")} até{' '}
              {format(new Date(fim), "dd/MM/yyyy")}
            </span>
          </p>

          {/* FILTROS DE DATA */}
          <div className="mt-4 flex flex-wrap items-end gap-4 bg-white rounded-2xl px-4 py-3 shadow-sm border border-slate-200">
            <div className="flex flex-col text-sm">
              <span className="text-slate-500 mb-1">Data inicial</span>
              <input
                type="date"
                value={inicio}
                onChange={(e) => setInicio(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-1 text-sm"
              />
            </div>

            <div className="flex flex-col text-sm">
              <span className="text-slate-500 mb-1">Data final</span>
              <input
                type="date"
                value={fim}
                onChange={(e) => setFim(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-1 text-sm"
              />
            </div>

            <button
              type="button"
              onClick={carregarDados}
              disabled={loading}
              className="mt-2 md:mt-0 inline-flex items-center justify-center rounded-lg px-4 py-2 bg-emerald-500 text-white font-semibold text-sm shadow hover:bg-emerald-400 disabled:opacity-60"
            >
              {loading ? 'Atualizando...' : 'Atualizar dados'}
            </button>

            {erro && (
              <span className="text-sm text-red-600 ml-auto">{erro}</span>
            )}
          </div>
        </header>

        {/* CARDS DE KPI */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Volume total em R$ */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Volume de atendimento (R$)
            </p>
            <p className="mt-3 text-2xl md:text-3xl font-black text-emerald-600">
              {totalReceitaFormatado}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Soma da receita por convênio no período selecionado.
            </p>
          </div>

          {/* Novos pacientes */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Novos pacientes
            </p>
            <p className="mt-3 text-2xl md:text-3xl font-black text-sky-600">
              {novosPacientes.toLocaleString('pt-BR')}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Pacientes cadastrados no período.
            </p>
          </div>

          {/* Ticket médio */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Ticket médio
            </p>
            <p className="mt-3 text-2xl md:text-3xl font-black text-amber-600">
              {ticketMedioFormatado}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Valor médio por atendimento no período.
            </p>
          </div>
        </section>

        {/* GRÁFICO 1 – RECEITA POR CONVÊNIO */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
          <div>
            <h2 className="text-lg md:text-xl font-semibold">
              Receita por Convênio (R$)
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Comparação do faturamento por convênio no período selecionado.
            </p>
          </div>

          <div className="w-full h-80">
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
                <Bar dataKey="valor" fill="#fb923c" radius={[8, 8, 0, 0]}>
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

        {/* GRÁFICO 2 – RECEITA POR GRUPO */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
          <div>
            <h2 className="text-lg md:text-xl font-semibold">
              Receita por Grupo de Procedimento (R$)
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Valor faturado por grupo de procedimento no período.
            </p>
          </div>

          <div className="w-full h-80">
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
                <Bar dataKey="valor" fill="#a855f7" radius={[8, 8, 0, 0]}>
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

        {/* GRÁFICO 3 – QUANTIDADE POR GRUPO */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
          <div>
            <h2 className="text-lg md:text-xl font-semibold">
              Quantidade de Atendimentos por Grupo
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Número de atendimentos realizados em cada grupo de procedimento.
            </p>
          </div>

          <div className="w-full h-80">
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
                <Bar
                  dataKey="quantidade"
                  fill="#22c55e"
                  radius={[8, 8, 0, 0]}
                >
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

        <footer className="pb-8 text-center text-xs text-slate-500">
          Dados integrados ao Biodata — ImagemCor • Painel em construção
        </footer>
      </div>
    </div>
  );
}
