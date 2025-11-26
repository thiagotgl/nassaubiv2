// app/painel-imagemcor/page.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  LabelList,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Converte "R$ 29.487,86" em número 29487.86
function parseBRLToNumber(texto: string | null | undefined): number {
  if (!texto) return 0;
  const limpo = texto.replace(/[^\d,.-]/g, '');
  const normalizado = limpo.replace(/\./g, '').replace(',', '.');
  const n = Number(normalizado);
  return Number.isFinite(n) ? n : 0;
}

// Converte qualquer coisa para número (para quantidades, etc.)
function parseGenericNumber(v: any): number {
  if (v == null) return 0;
  if (typeof v === 'number') return v;
  const str = String(v).trim();
  if (!str) return 0;
  const num = Number(str.replace(/[^\d.-]/g, ''));
  return Number.isFinite(num) ? num : 0;
}

// Formata número em BRL
function formatBRL(v: number): string {
  return v.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

// Cores fixas para a pizza de convênios
const PIE_COLORS = [
  '#1d4ed8',
  '#0f766e',
  '#f97316',
  '#a855f7',
  '#22c55e',
  '#e11d48',
  '#06b6d4',
  '#facc15',
];

export default function ImagemCorDashboard() {
  // Datas padrão: 1º dia do mês até hoje
  const hoje = new Date();
  const hojeISO = hoje.toISOString().slice(0, 10);
  const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
    .toISOString()
    .slice(0, 10);

  const [dataInicio, setDataInicio] = useState<string>(primeiroDiaMes);
  const [dataFim, setDataFim] = useState<string>(hojeISO);

  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Cards
  const [volumeAtendimento, setVolumeAtendimento] = useState<number>(0); // R$
  const [novosPacientes, setNovosPacientes] = useState<number>(0);
  const [ticketMedio, setTicketMedio] = useState<string>('R$ 0,00');

  // Gráficos
  const [porConvenio, setPorConvenio] = useState<any[]>([]);
  const [porGrupo, setPorGrupo] = useState<any[]>([]);

  async function carregarTudo(inicio: string, fim: string) {
    try {
      setLoading(true);
      setErro(null);

      // 1) Volume de atendimento (R$)
      // Aqui estou usando o mesmo /api/faturamento que você já tem no outro painel.
      // Se para essa empresa for diferente, depois trocamos apenas este trecho.
      const totalRes = await fetch(
        `/api/faturamento?inicio=${inicio}&fim=${fim}`
      );
      const totalJson = await totalRes.json();
      const totalValor = totalJson?.valor_bruto ?? totalJson?.valor ?? 0;
      const totalNumero =
        typeof totalValor === 'number'
          ? totalValor
          : parseGenericNumber(totalValor);
      setVolumeAtendimento(totalNumero);

      // 2) APIs Biodata

      // Novos pacientes
      const urlNovos =
        'https://apis.biodataweb.net/ImagemCor544/biodata/dashboard/grafico' +
        '?target_url=null' +
        '&procedure=spBIPacientesCadastrados' +
        '&parametros=%40DATAINICIO,%40DATAFIM,%40UNIDADE,%40CONVENIO,%40TIPOENTRADA' +
        `&valores=${inicio},${fim},_,_,_,` +
        '&idSAC=544';

      // Ticket médio
      const urlTicket =
        'https://apis.biodataweb.net/ImagemCor544/biodata/dashboard/grafico' +
        '?target_url=null' +
        '&procedure=spBITicketMedioCard' +
        '&parametros=%40DATAINICIO,%40DATAFIM,%40Profissional' +
        `&valores=${inicio},${fim},_` +
        '&idSAC=544';

      // Receita por convênio
      const urlConvenio =
        'https://apis.biodataweb.net/ImagemCor544/biodata/dashboard/grafico' +
        '?target_url=null' +
        '&procedure=spBIFaturamentoPorConvenioValor' +
        '&parametros=%40DATAINICIO,%40DATAFIM,%40Profissional,%40UNIDADE' +
        `&valores=${inicio},${fim},_,_` +
        '&idSAC=544';

      // Faturamento por grupo de procedimento
      const urlGrupo =
        'https://apis.biodataweb.net/ImagemCor544/biodata/dashboard/grafico' +
        '?target_url=null' +
        '&procedure=spBIFaturamentoPorGrupodeProcedimentoValor' +
        '&parametros=%40DATAINICIO,%40DATAFIM,%40Profissional,%40UNIDADE,%40PROFISSIONAL' +
        `&valores=${inicio},${fim},_,_,_` +
        '&idSAC=544';

      const [novosRes, ticketRes, convRes, grupoRes] = await Promise.all([
        fetch(urlNovos),
        fetch(urlTicket),
        fetch(urlConvenio),
        fetch(urlGrupo),
      ]);

      const [novosJson, ticketJson, convJson, grupoJson] = await Promise.all([
        novosRes.json(),
        ticketRes.json(),
        convRes.json(),
        grupoRes.json(),
      ]);

      // ---- Novos Pacientes ----
      const npRow = novosJson?.[0] ?? {};
      const npValor =
        npRow.TOTAL ??
        npRow.total ??
        npRow.Qtde ??
        npRow.QTD ??
        npRow.Quantidade ??
        npRow.Pacientes ??
        0;
      setNovosPacientes(parseGenericNumber(npValor));

      // ---- Ticket Médio ----
      const tkRow = ticketJson?.[0] ?? {};
      const tkTexto =
        tkRow['R$'] ??
        tkRow.valor_formatado ??
        tkRow.VALOR_FORMATADO ??
        tkRow.VALOR ??
        tkRow.valor ??
        'R$ 0,00';
      setTicketMedio(String(tkTexto));

      // ---- Receita por Convênio ----
      const convData =
        Array.isArray(convJson) && convJson.length > 0
          ? convJson.map((item: any, idx: number) => {
              const nome =
                item.Convenio ??
                item.CONVENIO ??
                item.convenio ??
                item.Nome ??
                item.NOME ??
                `Convênio ${idx + 1}`;

              const textoValor =
                item['R$'] ??
                item.valor_formatado ??
                item.VALOR_FORMATADO ??
                item.VALOR ??
                item.valor ??
                'R$ 0,00';

              const valorNum = parseBRLToNumber(textoValor);

              return {
                convenio: String(nome),
                valor: valorNum,
                valorFormatado:
                  typeof textoValor === 'string'
                    ? textoValor
                    : formatBRL(valorNum),
              };
            })
          : [];

      setPorConvenio(convData);

      // ---- Faturamento por Grupo de Procedimento ----
      const grpData =
        Array.isArray(grupoJson) && grupoJson.length > 0
          ? grupoJson.map((item: any, idx: number) => {
              const grupo =
                item.Grupo ??
                item.GRUPO ??
                item.GrupoProcedimento ??
                item.GRUPO_PROCEDIMENTO ??
                `Grupo ${idx + 1}`;

              const textoValor =
                item['R$'] ??
                item.valor_formatado ??
                item.VALOR_FORMATADO ??
                item.VALOR ??
                item.valor ??
                'R$ 0,00';

              const qtd =
                item.Qtd ??
                item.QTD ??
                item.Quantidade ??
                item.QTDE ??
                item.QTDE_TOTAL ??
                0;

              const valorNum = parseBRLToNumber(textoValor);
              const qtdNum = parseGenericNumber(qtd);

              return {
                grupo: String(grupo),
                valor: valorNum,
                valorFormatado:
                  typeof textoValor === 'string'
                    ? textoValor
                    : formatBRL(valorNum),
                quantidade: qtdNum,
              };
            })
          : [];

      setPorGrupo(grpData);
    } catch (e: any) {
      console.error(e);
      setErro('Erro ao carregar dados. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarTudo(dataInicio, dataFim);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAplicarFiltros = () => {
    carregarTudo(dataInicio, dataFim);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="max-w-7xl mx-auto p-8 space-y-16">
        {/* TÍTULO */}
        <header className="space-y-4 text-center">
          <h1 className="text-4xl md:text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-yellow-400 to-pink-500 drop-shadow-2xl">
            Painel Financeiro & Atendimentos — ImagemCor
          </h1>
          <p className="text-lg md:text-xl text-gray-200 opacity-80">
            Dados integrados ao Biodata — atualizados conforme o período
            selecionado.
          </p>
        </header>

        {/* FILTRO DE DATAS */}
        <section className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 md:p-8 shadow-2xl border border-white/20">
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 justify-between">
            <div className="flex flex-col md:flex-row gap-4 md:gap-6 w-full md:w-auto">
              <label className="flex flex-col text-sm md:text-base">
                <span className="mb-1 text-gray-200">Data Início</span>
                <input
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  className="rounded-xl px-3 py-2 text-slate-900 text-sm md:text-base"
                />
              </label>

              <label className="flex flex-col text-sm md:text-base">
                <span className="mb-1 text-gray-200">Data Fim</span>
                <input
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                  className="rounded-xl px-3 py-2 text-slate-900 text-sm md:text-base"
                />
              </label>
            </div>

            <button
              onClick={handleAplicarFiltros}
              disabled={loading}
              className="mt-2 md:mt-0 inline-flex items-center justify-center px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed font-semibold text-lg shadow-lg shadow-emerald-500/40 transition"
            >
              {loading ? 'Atualizando...' : 'Aplicar filtros'}
            </button>
          </div>

          <p className="mt-4 text-sm text-gray-200 opacity-70">
            Período atual:{' '}
            <span className="font-semibold">
              {format(new Date(dataInicio), 'dd/MM/yyyy', { locale: ptBR })} a{' '}
              {format(new Date(dataFim), 'dd/MM/yyyy', { locale: ptBR })}
            </span>
          </p>

          {erro && (
            <p className="mt-3 text-sm text-red-300 bg-red-900/40 px-4 py-2 rounded-2xl inline-block">
              {erro}
            </p>
          )}
        </section>

        {/* CARDS RESUMO */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Volume de atendimento (R$) */}
          <div className="bg-white/10 rounded-3xl p-6 shadow-xl border border-white/20">
            <p className="text-sm uppercase tracking-wide text-gray-300">
              Volume de atendimento (R$)
            </p>
            <p className="mt-4 text-3xl md:text-4xl font-black text-emerald-400">
              {formatBRL(volumeAtendimento)}
            </p>
            <p className="mt-2 text-sm text-gray-300 opacity-80">
              Total faturado no período selecionado (todas as unidades /
              convênios).
            </p>
          </div>

          {/* Novos pacientes */}
          <div className="bg-white/10 rounded-3xl p-6 shadow-xl border border-white/20">
            <p className="text-sm uppercase tracking-wide text-gray-300">
              Novos pacientes
            </p>
            <p className="mt-4 text-3xl md:text-4xl font-black text-sky-400">
              {novosPacientes}
            </p>
            <p className="mt-2 text-sm text-gray-300 opacity-80">
              Pacientes cadastrados no sistema dentro do período.
            </p>
          </div>

          {/* Ticket médio */}
          <div className="bg-white/10 rounded-3xl p-6 shadow-xl border border-white/20">
            <p className="text-sm uppercase tracking-wide text-gray-300">
              Ticket médio por paciente
            </p>
            <p className="mt-4 text-3xl md:text-4xl font-black text-amber-300">
              {ticketMedio}
            </p>
            <p className="mt-2 text-sm text-gray-300 opacity-80">
              Valor médio faturado por paciente no período.
            </p>
          </div>
        </section>

        {/* RECEITA POR CONVÊNIO – BARRAS HORIZONTAIS + PIZZA */}
        <section className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl md:text-4xl font-bold">
              Receita por Convênio
            </h2>
            <p className="text-sm md:text-base text-gray-200 opacity-80 max-w-2xl mx-auto">
              Comparação de valores em reais entre convênios e participação de
              cada um no total.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Barras horizontais */}
            <div className="bg-slate-50 rounded-3xl p-6 md:p-8 shadow-2xl">
              <ResponsiveContainer width="100%" height={380}>
                <BarChart
                  data={porConvenio}
                  layout="vertical"
                  margin={{ top: 20, right: 40, left: 80, bottom: 20 }}
                >
                  <CartesianGrid stroke="#e5e7eb" strokeOpacity={0.7} />
                  <XAxis
                    type="number"
                    tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`}
                  />
                  <YAxis
                    type="category"
                    dataKey="convenio"
                    width={120}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    formatter={(value: any, _name: any, entry: any) =>
                      entry.payload?.valorFormatado ??
                      formatBRL(value as number)
                    }
                    labelFormatter={(label) => `Convênio: ${label}`}
                  />
                  <Bar
                    dataKey="valor"
                    barSize={22}
                    radius={[0, 10, 10, 0]}
                    fill="#1d4ed8"
                  >
                    <LabelList
                      dataKey="valorFormatado"
                      position="right"
                      offset={8}
                      style={{
                        fill: '#1f2937',
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Pizza de participação */}
            <div className="bg-slate-50 rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col items-center justify-center">
              <ResponsiveContainer width="100%" height={380}>
                <PieChart>
                  <Pie
                    data={porConvenio}
                    dataKey="valor"
                    nameKey="convenio"
                    innerRadius={70}
                    outerRadius={120}
                    paddingAngle={3}
                  >
                    {porConvenio.map((entry, index) => (
                      <Cell
                        key={entry.convenio}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any, _name: any, entry: any) => [
                      entry?.payload?.valorFormatado ??
                        formatBRL(value as number),
                      entry?.payload?.convenio ?? 'Convênio',
                    ]}
                  />
                  <Legend
                    verticalAlign="bottom"
                    align="center"
                    iconType="circle"
                    wrapperStyle={{ fontSize: 11 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <p className="mt-2 text-xs text-gray-500 text-center">
                Gráfico de pizza mostrando a participação percentual de cada
                convênio na receita total.
              </p>
            </div>
          </div>
        </section>

        {/* GRUPO DE PROCEDIMENTO – VALOR + QUANTIDADE */}
        <section className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl md:text-4xl font-bold">
              Faturamento por Grupo de Procedimento
            </h2>
            <p className="text-sm md:text-base text-gray-200 opacity-80 max-w-2xl mx-auto">
              Comparação do valor faturado (R$) e da quantidade de
              atendimentos por grupo de procedimento.
            </p>
          </div>

          <div className="bg-slate-50 rounded-3xl p-6 md:p-10 shadow-2xl">
            <ResponsiveContainer width="100%" height={420}>
              <BarChart
                data={porGrupo}
                margin={{ top: 20, right: 40, left: 20, bottom: 80 }}
              >
                <CartesianGrid
                  stroke="#e5e7eb"
                  strokeOpacity={0.7}
                  vertical={false}
                />
                <XAxis
                  dataKey="grupo"
                  tick={{ fontSize: 11 }}
                  angle={-25}
                  textAnchor="end"
                  height={80}
                />
                <YAxis
                  yAxisId="left"
                  tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  formatter={(value: any, name: any, entry: any) => {
                    if (name === 'valor') {
                      return [
                        entry.payload?.valorFormatado ??
                          formatBRL(value as number),
                        'Valor (R$)',
                      ];
                    }
                    if (name === 'quantidade') {
                      return [value, 'Quantidade'];
                    }
                    return [value, name];
                  }}
                  labelFormatter={(label) => `Grupo: ${label}`}
                />
                <Legend />

                {/* Valor em R$ */}
                <Bar
                  yAxisId="left"
                  dataKey="valor"
                  name="Valor (R$)"
                  barSize={26}
                  radius={[10, 10, 0, 0]}
                  fill="#0f766e"
                >
                  <LabelList
                    dataKey="valorFormatado"
                    position="top"
                    offset={6}
                    style={{
                      fill: '#065f46',
                      fontSize: 10,
                      fontWeight: 600,
                    }}
                  />
                </Bar>

                {/* Quantidade */}
                <Bar
                  yAxisId="right"
                  dataKey="quantidade"
                  name="Quantidade"
                  barSize={16}
                  radius={[10, 10, 0, 0]}
                  fill="#f97316"
                >
                  <LabelList
                    dataKey="quantidade"
                    position="insideTop"
                    offset={4}
                    style={{
                      fill: '#ffffff',
                      fontSize: 10,
                      fontWeight: 600,
                    }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <footer className="text-center pb-10 text-sm md:text-base opacity-70">
          Powered by Nassau Tecnologia · Integração Biodata ·{' '}
          {format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </footer>
      </div>
    </div>
  );
}
