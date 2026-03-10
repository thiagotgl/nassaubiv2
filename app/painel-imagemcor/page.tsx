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
      const logado = window.localStorage.getItem('logado');
      if (!logado) router.replace('/login');
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

      const url =
        `${baseUrl}?idSAC=544&procedure=usp_BI_FaturaAtendimento&parametros=%40DATAINICIO,%40DATAFIM&valores=${inicio},${fim}`;

      const res = await fetch(url);
      const json = await res.json();

      if (!Array.isArray(json)) {
        console.error('API retornou formato inesperado', json);
        return;
      }

      const dados = json;

      const mapaConvenio: Record<string, number> = {};
      const mapaGrupo: Record<string, { valor: number; quantidade: number }> =
        {};
      const mapaTipoEntrada: Record<string, number> = {};
      const mapaDia: Record<string, number> = {};
      const mapaProcedimento: Record<string, number> = {};
      const mapaTicketConvenio: Record<
        string,
        { valor: number; pacientes: Set<string> }
      > = {};

      const pacientes = new Set<string>();

      let total = 0;

      const dataInicio = new Date(inicio + 'T00:00:00');
      const dataFim = new Date(fim + 'T23:59:59');

      dados.forEach((item: any) => {
        if (!item.datatende) return;

        const partes = String(item.datatende).split(' ');
        const dataStr = partes[0] || '';
        const partesData = dataStr.split('/');

        if (partesData.length !== 3) return;

        const [dia, mes, ano] = partesData;
        const dataItem = new Date(`${ano}-${mes}-${dia}`);

        if (
          isNaN(dataItem.getTime()) ||
          dataItem < dataInicio ||
          dataItem > dataFim
        )
          return;

        const valor = parseGenericNumber(item.numvalor);
        total += valor;

        if (item.strcliente) pacientes.add(item.strcliente);

        const convenio = item.strconvenio?.trim() || 'Sem convênio';
        mapaConvenio[convenio] = (mapaConvenio[convenio] || 0) + valor;

        const procedimento =
          item.strdescrprocedimento ||
          item.strprocedimento ||
          'Sem procedimento';

        mapaProcedimento[procedimento] =
          (mapaProcedimento[procedimento] || 0) + valor;

        if (!mapaTicketConvenio[convenio]) {
          mapaTicketConvenio[convenio] = {
            valor: 0,
            pacientes: new Set<string>(),
          };
        }

        mapaTicketConvenio[convenio].valor += valor;

        if (item.strcliente)
          mapaTicketConvenio[convenio].pacientes.add(item.strcliente);

        const grupo = item.strgrupoProcedimento || 'Outros';
        const qtd = Number(item.numquantidade || 1);

        if (!mapaGrupo[grupo])
          mapaGrupo[grupo] = { valor: 0, quantidade: 0 };

        mapaGrupo[grupo].valor += valor;
        mapaGrupo[grupo].quantidade += qtd;

        const tipo = item.strtipoentrada || 'Outros';
        mapaTipoEntrada[tipo] = (mapaTipoEntrada[tipo] || 0) + valor;

        const dataISO = dataItem.toISOString().slice(0, 10);
        mapaDia[dataISO] = (mapaDia[dataISO] || 0) + valor;
      });

      setTotalReceita(total);
      setNovosPacientes(pacientes.size);

      const ticket = pacientes.size > 0 ? total / pacientes.size : 0;
      setTicketMedio(ticket);

      setPorConvenio(
        Object.entries(mapaConvenio).map(([nome, valor]) => ({
          nome,
          valor,
          valorFormatado: valor.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          }),
        }))
      );

      setPorGrupo(
        Object.entries(mapaGrupo).map(([nome, obj]) => ({
          nome,
          valor: obj.valor,
          quantidade: obj.quantidade,
          valorFormatado: obj.valor.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          }),
        }))
      );

      setConsultaExame(
        Object.entries(mapaTipoEntrada).map(([nome, valor]) => ({
          nome,
          valor,
        }))
      );

      setFaturamentoPorDia(
        Object.entries(mapaDia)
          .map(([data, valor]) => ({
            nome: data,
            valor,
          }))
          .sort((a, b) => new Date(a.nome).getTime() - new Date(b.nome).getTime())
      );

      setTopProcedimentos(
        Object.entries(mapaProcedimento)
          .map(([nome, valor]) => ({ nome, valor }))
          .sort((a, b) => b.valor - a.valor)
          .slice(0, 10)
      );

      setTicketPorConvenio(
        Object.entries(mapaTicketConvenio).map(([nome, obj]) => ({
          nome,
          valor:
            obj.pacientes.size > 0
              ? obj.valor / obj.pacientes.size
              : 0,
        }))
      );
    } catch (e) {
      console.error(e);
      setErro('Erro ao carregar dados.');
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

  return (
    <>
      <Sidebar />

      <div style={{ maxWidth: 1120, margin: '0 auto', padding: 20 }}>
        <h1>Painel Financeiro — ImagemCor</h1>

        <section>
          <h2>Receita por Convênio</h2>

          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={porConvenio}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nome" />
              <YAxis />
              <Tooltip />
              <Legend />

              <Bar dataKey="valor" fill="#fb923c">
                <LabelList dataKey="valorFormatado" position="top" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </section>

        <section>
          <h2>Receita por Grupo</h2>

          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={porGrupo}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nome" />
              <YAxis />
              <Tooltip />
              <Legend />

              <Bar dataKey="valor" fill="#a855f7" />
            </BarChart>
          </ResponsiveContainer>
        </section>

        <section>
          <h2>Consulta vs Exame</h2>

          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={consultaExame}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nome" />
              <YAxis />
              <Tooltip />
              <Legend />

              <Bar dataKey="valor" fill="#6366f1" />
            </BarChart>
          </ResponsiveContainer>
        </section>

        <section>
          <h2>Faturamento por Dia</h2>

          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={faturamentoPorDia}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nome" />
              <YAxis />
              <Tooltip />
              <Legend />

              <Bar dataKey="valor" fill="#14b8a6" />
            </BarChart>
          </ResponsiveContainer>
        </section>

        <section>
          <h2>Top Procedimentos</h2>

          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={topProcedimentos}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nome" />
              <YAxis />
              <Tooltip />
              <Legend />

              <Bar dataKey="valor" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </section>

        <section>
          <h2>Ticket Médio por Convênio</h2>

          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={ticketPorConvenio}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nome" />
              <YAxis />
              <Tooltip />
              <Legend />

              <Bar dataKey="valor" fill="#0ea5e9" />
            </BarChart>
          </ResponsiveContainer>
        </section>
      </div>
    </>
  );
}
