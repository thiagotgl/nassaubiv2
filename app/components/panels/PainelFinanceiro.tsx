'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import CabecalhoPagina from '../ui/CabecalhoPagina';
import GraficoBarras from '../ui/GraficoBarras';
import { cores, estilos, paletaGraficos } from '../ui/tema';

// Converte "R$ 29.487,86" em número 29487.86
function parseBRLToNumber(texto: string | null | undefined): number {
  if (!texto) return 0;
  const limpo = texto.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.');
  const n = Number(limpo);
  return Number.isFinite(n) ? n : 0;
}

function parseGenericNumber(v: any): number {
  if (v == null) return 0;

  const str = String(v).trim();

  if (!str) return 0;

  // converte formato brasileiro
  const normalizado = str.replace(".", "").replace(",", ".");

  const num = Number(normalizado);

  return Number.isFinite(num) ? num : 0;
}

interface GrupoRow {
  nome: string;
  valor: number;
  valorFormatado: string;
  quantidade: number;
}

interface PainelProps {
  periodo: { inicio: string; fim: string };
  consultaId: number;
}

export default function PainelFinanceiro({ periodo, consultaId }: PainelProps) {
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

  const [loading, setLoading] = useState<boolean>(false);
  const [erro, setErro] = useState<string | null>(null);

  const [totalReceita, setTotalReceita] = useState<number>(0);
  const [novosPacientes, setNovosPacientes] = useState<number>(0);
  const [ticketMedio, setTicketMedio] = useState<number>(0);

  const [porGrupo, setPorGrupo] = useState<GrupoRow[]>([]);




  const baseUrl =
    'https://apis.biodataweb.net/ImagemCor544/biodata/dashboard/grafico';

  async function carregarDados() {
    try {
      setLoading(true);
      setErro(null);

 // NOVA CONSULTA - lista de atendimentos
const url =
`${baseUrl}?idSAC=544&procedure=usp_BI_FaturaAtendimento&parametros=%40DATAINICIO,%40DATAFIM&valores=${periodo.inicio},${periodo.fim}`;

const res = await fetch(url);

const json = await res.json();

if (!Array.isArray(json)) {
  console.error("API retornou formato inesperado", json);
  return;
}



      const dados = json;

// DATA INICIO
const [anoI, mesI, diaI] = periodo.inicio.split("-").map(Number);
const dataInicio = new Date(anoI, mesI - 1, diaI);

// DATA FIM
const [anoF, mesF, diaF] = periodo.fim.split("-").map(Number);
const dataFim = new Date(anoF, mesF - 1, diaF);
dataFim.setHours(23, 59, 59, 999);

// FILTRO POR DATA
const dadosFiltrados = dados.filter((item:any) => {

  if (!item.datatende) return false;

  const [dataParte] = item.datatende.split(" ");
  const [dia, mes, ano] = dataParte.split("/").map(Number);

  if (!dia || !mes || !ano) return false;

  const dataItem = new Date(ano, mes - 1, dia);

  return dataItem >= dataInicio && dataItem <= dataFim;

});

console.log("TOTAL REGISTROS API:", dados.length);
console.log("REGISTROS FILTRADOS:", dadosFiltrados.length);

// MAPAS PARA AGRUPAMENTO

const mapaGrupo: Record<string, { valor: number; quantidade: number }> = {}

const pacientes = new Set<string>()
     const atendimentos = new Set<string>()

let total = 0

// LOOP PRINCIPAL

      dadosFiltrados.forEach((item:any) => {

const valor = parseGenericNumber(item.numvalor);
const quantidade = Number(item.numquantidade) || 1;

const valorTotalItem = valor * quantidade;

total += valorTotalItem;

// REGISTRA ATENDIMENTO (evita duplicação)
atendimentos.add(item.strcodigoatendimento)

        console.log(
  item.datatende,
  valor,
  quantidade,
  valorTotalItem
);
// PACIENTES NOVOS (primeira visita)
if (item.strcodigoatendimento?.endsWith("-1")) {
  pacientes.add(item.strcliente);
}

  // GRUPO
  const grupo = item.strgrupoProcedimento || "Outros";
  const qtd = Number(item.numquantidade || 1);

  if (!mapaGrupo[grupo]) {
    mapaGrupo[grupo] = { valor: 0, quantidade: 0 };
  }

  mapaGrupo[grupo].valor += valorTotalItem;
  mapaGrupo[grupo].quantidade += qtd;

});

      // TOTAL
setTotalReceita(total);

// TICKET MÉDIO
const ticket = atendimentos.size > 0 ? total / atendimentos.size : 0;
setTicketMedio(ticket);

// PACIENTES
setNovosPacientes(pacientes.size);


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


    } catch (e) {
      console.error(e);
      setErro('Erro ao carregar dados. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarDados();
    // Recarrega quando o filtro global é aplicado
  }, [periodo.inicio, periodo.fim, consultaId]);

  const totalReceitaFormatado = totalReceita.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
  const ticketMedioFormatado = ticketMedio.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  // Cada gráfico usa seu próprio critério de ordenação, do maior para o menor.
  // A cópia evita mutar o estado original recebido da API.
  const gruposPorQuantidade = [...porGrupo].sort(
    (a, b) => b.quantidade - a.quantidade || a.nome.localeCompare(b.nome, 'pt-BR')
  );
  const gruposPorReceita = [...porGrupo].sort(
    (a, b) => b.valor - a.valor || a.nome.localeCompare(b.nome, 'pt-BR')
  );

  // Estilos padronizados via tema compartilhado
  const containerStyle: React.CSSProperties = {
    ...estilos.containerPagina,
    fontFamily:
      '-apple-system, BlinkMacSystemFont, system-ui, -system-ui, sans-serif',
  };

  const wrapperStyle: React.CSSProperties = {
    ...estilos.pagina,
  };

  const cardGridStyle: React.CSSProperties = {
    ...estilos.gradeKpi,
  };

  const cardStyle: React.CSSProperties = {
    ...estilos.cardKpi,
  };

  const chartSectionStyle: React.CSSProperties = {
    ...estilos.cardSecao,
  };

  return (
    <div style={containerStyle}>
      <div style={wrapperStyle}>
        <CabecalhoPagina
          titulo="Painel Financeiro — ImagemCor"
          periodoTexto={`${format(new Date(periodo.inicio), 'dd/MM/yyyy', { locale: ptBR })} até ${format(new Date(periodo.fim), 'dd/MM/yyyy', { locale: ptBR })}`}
        />

        {erro && <p style={{ fontSize: '13px', color: cores.erro }}>{erro}</p>}

        {/* CARDS KPIs */}
        <section style={cardGridStyle}>
          <div style={cardStyle}>
            <p style={{ fontSize: '11px', textTransform: 'uppercase', color: cores.suave, letterSpacing: '0.06em' }}>
              Volume de atendimento (R$)
            </p>
            <p style={{ marginTop: '8px', fontSize: '22px', fontWeight: 900, color: paletaGraficos.verdePositivo }}>
              {totalReceitaFormatado}
            </p>
            <p style={{ marginTop: '6px', fontSize: '11px', color: cores.suave }}>
              Soma da receita por convênio no período selecionado.
            </p>
          </div>

          <div style={cardStyle}>
            <p style={{ fontSize: '11px', textTransform: 'uppercase', color: cores.suave, letterSpacing: '0.06em' }}>
              Novos pacientes
            </p>
            <p style={{ marginTop: '8px', fontSize: '22px', fontWeight: 900, color: paletaGraficos.ceuAzul }}>
              {novosPacientes.toLocaleString('pt-BR')}
            </p>
            <p style={{ marginTop: '6px', fontSize: '11px', color: cores.suave }}>
              Pacientes cadastrados no período.
            </p>
          </div>

          <div style={cardStyle}>
            <p style={{ fontSize: '11px', textTransform: 'uppercase', color: cores.suave, letterSpacing: '0.06em' }}>
              Ticket médio
            </p>
            <p style={{ marginTop: '8px', fontSize: '22px', fontWeight: 900, color: paletaGraficos.ambarKpi }}>
              {ticketMedioFormatado}
            </p>
            <p style={{ marginTop: '6px', fontSize: '11px', color: cores.suave }}>
              Valor médio por atendimento no período.
            </p>
          </div>
        </section>

        {/* GRÁFICOS */}
        <section style={chartSectionStyle}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '4px' }}>
            Quantidade de Atendimentos por Grupo
          </h2>
          <p style={{ fontSize: '11px', color: cores.suave, marginBottom: '8px' }}>
            Número de atendimentos realizados em cada grupo de procedimento.
          </p>
          <GraficoBarras
            dados={gruposPorQuantidade}
            chaveX="nome"
            rotulosInclinados
            moeda={false}
            series={[{ dataKey: 'quantidade', nome: 'Atendimentos', cor: paletaGraficos.verdeClaro }]}
          />
        </section>

        <section style={chartSectionStyle}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '4px' }}>
            Receita por Grupo de Procedimento (R$)
          </h2>
          <p style={{ fontSize: '11px', color: cores.suave, marginBottom: '8px' }}>
            Valor faturado por grupo de procedimento no período.
          </p>
          <GraficoBarras
            dados={gruposPorReceita}
            chaveX="nome"
            rotulosInclinados
            series={[{ dataKey: 'valor', nome: 'Receita', cor: paletaGraficos.violeta }]}
          />
        </section>

        <footer style={{ marginTop: '32px', fontSize: '11px', textAlign: 'center', color: cores.suave }}>
          Dados integrados ao Biodata — ImagemCor • Painel em construção
        </footer>
      </div>
    </div>
  );
}
