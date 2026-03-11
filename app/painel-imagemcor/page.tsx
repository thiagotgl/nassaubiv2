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
  ResponsiveContainer,
  Legend,
  LabelList,
} from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Converte "R$ 29.487,86" em número 29487.86
function parseBRLToNumber(texto: string | null | undefined): number {
  if (!texto) return 0;
  const limpo = texto.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.');
  const n = Number(limpo);
  return Number.isFinite(n) ? n : 0;
}

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

  // NOVA VERIFICAÇÃO — aceita quem tem 'logado' = true
  useEffect(() => {
    try {
      const logado = window.localStorage.getItem('logado');
      if (!logado) {
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

  const [totalReceita, setTotalReceita] = useState<number>(0);
  const [novosPacientes, setNovosPacientes] = useState<number>(0);
  const [ticketMedio, setTicketMedio] = useState<number>(0);

  const [porConvenio, setPorConvenio] = useState<ConvenioRow[]>([]);
  const [porGrupo, setPorGrupo] = useState<GrupoRow[]>([]);
  const [consultaExame, setConsultaExame] = useState<any[]>([]);
const [faturamentoPorDia, setFaturamentoPorDia] = useState<any[]>([]);
  const [topProcedimentos, setTopProcedimentos] = useState<any[]>([]);
const [ticketPorConvenio, setTicketPorConvenio] = useState<any[]>([]);

  const baseUrl =
    'https://apis.biodataweb.net/ImagemCor544/biodata/dashboard/grafico';

  async function carregarDados() {
    try {
      setLoading(true);
      setErro(null);

 // NOVA CONSULTA - lista de atendimentos
const url =
`${baseUrl}?idSAC=544&procedure=usp_BI_FaturaAtendimento&parametros=%40DATAINICIO,%40DATAFIM&valores=${inicio},${fim}`;

const res = await fetch(url);

const json = await res.json();

if (!Array.isArray(json)) {
  console.error("API retornou formato inesperado", json);
  return;
}
      
const dados = json;
      console.log("TOTAL REGISTROS API:", dados.length);
console.log("PRIMEIRO REGISTRO:", dados[0]);

      
// AGRUPAR POR CONVÊNIO
const mapaConvenio: Record<string, number> = {};

const mapaGrupo: Record<string, { valor: number; quantidade: number }> = {};
const mapaTipoEntrada: Record<string, number> = {};
const mapaDia: Record<string, number> = {};
const mapaProcedimento: Record<string, number> = {};
const mapaTicketConvenio: Record<string, { valor: number; pacientes: Set<string> }> = {};
const pacientes = new Set<string>();

let total = 0;

const [anoI, mesI, diaI] = inicio.split("-").map(Number);
const dataInicio = new Date(anoI, mesI - 1, diaI);

const [anoF, mesF, diaF] = fim.split("-").map(Number);
const dataFim = new Date(anoF, mesF - 1, diaF);
dataFim.setHours(23, 59, 59, 999);

// LOOP ÚNICO

      dados.forEach((item: any) => {

  if (!item.datatende) return;

const dataTexto = item.datatende;

if (!dataTexto) return;

// exemplo: "08/01/2026 16:38:44"
const [dataParte] = dataTexto.split(" ");

const [dia, mes, ano] = dataParte.split("/").map(Number);

if (!dia || !mes || !ano) return;

const dataItem = new Date(ano, mes - 1, dia);

        console.log("DATA INICIO:", dataInicio);
console.log("DATA ITEM:", dataItem);
console.log("DATA FIM:", dataFim);
        
        if (
  dataItem < dataInicio ||
  dataItem > dataFim
) {
  return;
}

        console.log("DATA FILTRADA:", dataItem);


// if (
//   isNaN(dataItem.getTime()) ||
//   dataItem < dataInicio ||
//   dataItem > dataFim
// ) {
//   return;
// }

  const valor = parseGenericNumber(item.numvalor);
  total += valor;

  // PACIENTES
  if (item.strcliente) {
    pacientes.add(item.strcliente);
  }

  // CONVÊNIO
  const convenio = item.strconvenio?.trim() || "Sem convênio";
  mapaConvenio[convenio] = (mapaConvenio[convenio] || 0) + valor;

  // PROCEDIMENTO
 const procedimento =
  item.strdescrprocedimento ||
  item.strprocedimento ||
  "Sem procedimento";
  mapaProcedimento[procedimento] =
    (mapaProcedimento[procedimento] || 0) + valor;

  // TICKET MÉDIO CONVÊNIO
  if (!mapaTicketConvenio[convenio]) {
    mapaTicketConvenio[convenio] = {
      valor: 0,
      pacientes: new Set<string>()
    };
  }

  mapaTicketConvenio[convenio].valor += valor;

  if (item.strcliente) {
    mapaTicketConvenio[convenio].pacientes.add(item.strcliente);
  }

  // GRUPO
  const grupo = item.strgrupoProcedimento || "Outros";
  const qtd = Number(item.numquantidade || 1);

  if (!mapaGrupo[grupo]) {
    mapaGrupo[grupo] = { valor: 0, quantidade: 0 };
  }

  mapaGrupo[grupo].valor += valor;
  mapaGrupo[grupo].quantidade += qtd;

  // CONSULTA VS EXAME
  const tipo = item.strtipoentrada || "Outros";
  mapaTipoEntrada[tipo] = (mapaTipoEntrada[tipo] || 0) + valor;

  // FATURAMENTO POR DIA
  const dataISO = dataItem.toISOString().slice(0,10);
  mapaDia[dataISO] = (mapaDia[dataISO] || 0) + valor;

});
      
      
      // TOTAL
setTotalReceita(total);

// TICKET MÉDIO
const ticket = pacientes.size > 0 ? total / pacientes.size : 0;
setTicketMedio(ticket);

// PACIENTES
setNovosPacientes(pacientes.size);


// CONVÊNIO
const convData: ConvenioRow[] = Object.entries(mapaConvenio).map(([nome, valor]) => ({
  nome,
  valor,
  valorFormatado: valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  }),
}));

setPorConvenio(convData);


// GRUPO
const grpData: GrupoRow[] = Object.entries(mapaGrupo).map(([nome, obj]) => ({
  nome,
  valor: obj.valor,
  quantidade: obj.quantidade,
  valorFormatado: obj.valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  }),
}));

setPorGrupo(grpData);


// CONSULTA VS EXAME
const tipoEntradaData = Object.entries(mapaTipoEntrada).map(([nome, valor]) => ({
  nome,
  valor
}));

setConsultaExame(tipoEntradaData);


// FATURAMENTO POR DIA
const faturamentoDiaData = Object.entries(mapaDia)
  .map(([data, valor]) => {
    const d = new Date(data);

    return {
      nome: !isNaN(d.getTime()) ? d.toISOString().slice(0,10) : "Sem data",
      valor: Number.isFinite(valor) ? valor : 0
    };
  })
  .filter(item => item.nome !== "Sem data");

      faturamentoDiaData.sort(
  (a,b)=>new Date(a.nome).getTime()-new Date(b.nome).getTime()
);

setFaturamentoPorDia(faturamentoDiaData);
      // TOP 10 PROCEDIMENTOS
const topProcedimentosData = Object.entries(mapaProcedimento)
  .map(([nome, valor]) => ({
    nome,
    valor
  }))
  .sort((a, b) => b.valor - a.valor)
  .slice(0, 10);

setTopProcedimentos(topProcedimentosData);
      // TICKET MÉDIO POR CONVÊNIO
const ticketConvenioData = Object.entries(mapaTicketConvenio).map(([nome, obj]) => {

  const ticket =
    obj.pacientes.size > 0
      ? obj.valor / obj.pacientes.size
      : 0;

  return {
    nome,
    valor: ticket
  };
});

setTicketPorConvenio(ticketConvenioData);
      
    } catch (e) {
      console.error(e);
      setErro('Erro ao carregar dados. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  const totalReceitaFormatado = totalReceita.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
  const ticketMedioFormatado = ticketMedio.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  // Estilos (mantive exatamente como você já tinha)
  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    backgroundColor: '#f3f4f6',
    color: '#020617',
    fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, -system-ui, sans-serif',
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
    <>
      <Sidebar />
      <div style={containerStyle}>
      <div style={wrapperStyle}>
        <header style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 900, marginBottom: '8px' }}>
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
              onClick={carregarDados}
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

            {erro && <span style={{ fontSize: '12px', color: '#dc2626' }}>{erro}</span>}
          </div>
        </header>

        {/* CARDS KPIs */}
        <section style={cardGridStyle}>
          <div style={cardStyle}>
            <p style={{ fontSize: '11px', textTransform: 'uppercase', color: '#6b7280', letterSpacing: '0.06em' }}>
              Volume de atendimento (R$)
            </p>
            <p style={{ marginTop: '8px', fontSize: '22px', fontWeight: 900, color: '#047857' }}>
              {totalReceitaFormatado}
            </p>
            <p style={{ marginTop: '6px', fontSize: '11px', color: '#6b7280' }}>
              Soma da receita por convênio no período selecionado.
            </p>
          </div>

          <div style={cardStyle}>
            <p style={{ fontSize: '11px', textTransform: 'uppercase', color: '#6b7280', letterSpacing: '0.06em' }}>
              Novos pacientes
            </p>
            <p style={{ marginTop: '8px', fontSize: '22px', fontWeight: 900, color: '#0ea5e9' }}>
              {novosPacientes.toLocaleString('pt-BR')}
            </p>
            <p style={{ marginTop: '6px', fontSize: '11px', color: '#6b7280' }}>
              Pacientes cadastrados no período.
            </p>
          </div>

          <div style={cardStyle}>
            <p style={{ fontSize: '11px', textTransform: 'uppercase', color: '#6b7280', letterSpacing: '0.06em' }}>
              Ticket médio
            </p>
            <p style={{ marginTop: '8px', fontSize: '22px', fontWeight: 900, color: '#d97706' }}>
              {ticketMedioFormatado}
            </p>
            <p style={{ marginTop: '6px', fontSize: '11px', color: '#6b7280' }}>
              Valor médio por atendimento no período.
            </p>
          </div>
        </section>

        {/* GRÁFICOS */}
        <section style={chartSectionStyle}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '4px' }}>
            Receita por Convênio (R$)
          </h2>
          <p style={{ fontSize: '11px', color: '#6b7280', marginBottom: '8px' }}>
            Comparação do faturamento por convênio no período selecionado.
          </p>
          <div style={chartContainerStyle}>

<ResponsiveContainer width="100%" height="100%">
  <BarChart data={porConvenio} margin={{ top: 20, right: 20, left: 0, bottom: 40 }}>
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
        style={{ fontSize: 11, fill: '#92400e', fontWeight: 600 }}
      />
    </Bar>
  </BarChart>
</ResponsiveContainer>

            
          </div>
        </section>

        <section style={chartSectionStyle}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '4px' }}>
            Receita por Grupo de Procedimento (R$)
          </h2>
          <p style={{ fontSize: '11px', color: '#6b7280', marginBottom: '8px' }}>
            Valor faturado por grupo de procedimento no período.
          </p>
          <div style={chartContainerStyle}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={porGrupo} margin={{ top: 20, right: 20, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="nome" angle={-30} textAnchor="end" interval={0} height={60} tick={{ fill: '#6b7280', fontSize: 11 }} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: any) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
                <Legend />
                <Bar dataKey="valor" fill="#a855f7">
                  <LabelList dataKey="valorFormatado" position="top" style={{ fontSize: 11, fill: '#4c1d95', fontWeight: 600 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section style={chartSectionStyle}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '4px' }}>
            Quantidade de Atendimentos por Grupo
          </h2>
          <p style={{ fontSize: '11px', color: '#6b7280', marginBottom: '8px' }}>
            Número de atendimentos realizados em cada grupo de procedimento.
          </p>
          <div style={chartContainerStyle}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={porGrupo} margin={{ top: 20, right: 20, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="nome" angle={-30} textAnchor="end" interval={0} height={60} tick={{ fill: '#6b7280', fontSize: 11 }} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="quantidade" fill="#22c55e">
                  <LabelList dataKey="quantidade" position="top" style={{ fontSize: 11, fill: '#166534', fontWeight: 600 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section style={chartSectionStyle}>
  <h2 style={{ fontSize: '18px', fontWeight: 600 }}>
    Consulta vs Exame
  </h2>

  <div style={chartContainerStyle}>
    <ResponsiveContainer width="100%" height="100%">
<BarChart data={consultaExame}>
        <CartesianGrid strokeDasharray="3 3" />
<XAxis dataKey="nome" interval={0} />
        <YAxis tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`} />
        <Tooltip formatter={(v:any)=>Number(v).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}/>
        <Legend />
        <Bar dataKey="valor" fill="#6366f1">   <LabelList     dataKey="valor"     position="top"    formatter={(v:any)=>{
  const n = Number(v);
  if (!Number.isFinite(n)) return "";
  return n.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
}}  /> </Bar>
      </BarChart>
    </ResponsiveContainer>
  </div>
</section>

      <section style={chartSectionStyle}>
  <h2 style={{ fontSize: '18px', fontWeight: 600 }}>
    Faturamento por Dia
  </h2>

  <div style={chartContainerStyle}>
    <ResponsiveContainer width="100%" height="100%">
<BarChart data={faturamentoPorDia}>
      
        <CartesianGrid strokeDasharray="3 3" />
<XAxis
  dataKey="nome"
  interval="preserveStartEnd"
  tickFormatter={(v:any)=>{
  const d = new Date(v);
  if (isNaN(d.getTime())) return v;
  return d.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'});
}}
  
/>
<YAxis tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`} />
        <Tooltip formatter={(v:any)=>Number(v).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}/>
        <Legend />
        <Bar dataKey="valor" fill="#14b8a6">   <LabelList     dataKey="valor"     position="top"     formatter={(v:any)=>{
  const n = Number(v);
  if (!Number.isFinite(n)) return "";
  return n.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
}}  /> </Bar>
      </BarChart>
    </ResponsiveContainer>
  </div>
</section>  

        <section style={chartSectionStyle}>
  <h2 style={{ fontSize: '18px', fontWeight: 600 }}>
    Top 10 Procedimentos (Faturamento)
  </h2>

  <div style={chartContainerStyle}>
    <ResponsiveContainer width="100%" height="100%">

<BarChart data={topProcedimentos}>
  
        <CartesianGrid strokeDasharray="3 3" />

<XAxis
  dataKey="nome"
  angle={-30}
  textAnchor="end"
  interval={0}
  height={70}
/>
        
        <YAxis tickFormatter={(v)=>`R$ ${(v/1000).toFixed(0)}k`} />
        <Tooltip formatter={(v:any)=>Number(v).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}/>
        <Legend />
        <Bar dataKey="valor" fill="#ef4444">
          <LabelList
            dataKey="valor"
            position="top"
         formatter={(v:any)=>{
  const n = Number(v);
  if (!Number.isFinite(n)) return "";
  return n.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
}}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  </div>
</section>

        <section style={chartSectionStyle}>
  <h2 style={{ fontSize: '18px', fontWeight: 600 }}>
    Ticket Médio por Convênio
  </h2>

  <div style={chartContainerStyle}>
    <ResponsiveContainer width="100%" height="100%">
 <BarChart data={ticketPorConvenio}>
        <CartesianGrid strokeDasharray="3 3" />

<XAxis
  dataKey="nome"
  angle={-30}
  textAnchor="end"
  interval={0}
  height={70}
/>
        
        <YAxis tickFormatter={(v)=>`R$ ${Number(v).toLocaleString('pt-BR')}`} />
        <Tooltip formatter={(v:any)=>Number(v).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}/>
        <Legend />
        <Bar dataKey="valor" fill="#0ea5e9">
          <LabelList
            dataKey="valor"
            position="top"
formatter={(v:any)=>{
  const n = Number(v);
  if (!Number.isFinite(n)) return "";
  return n.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
}}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  </div>
</section>

        

        <footer style={{ marginTop: '32px', fontSize: '11px', textAlign: 'center', color: '#6b7280' }}>
          Dados integrados ao Biodata — ImagemCor • Painel em construção
        </footer>
      </div>
    </div>
    </>
  );
}
