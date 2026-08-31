'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Sidebar from '../components/Sidebar';
import FiltroGlobal from '../components/FiltroGlobal';
import PainelDescontos from '../components/panels/PainelDescontos';
import PainelFinanceiro from '../components/panels/PainelFinanceiro';
import PainelFaturamento from '../components/panels/PainelFaturamento';
import { cores } from '../components/ui/tema';

const IDS_ABAS = ['descontos', 'financeiro', 'operacional'];

interface Periodo {
  inicio: string;
  fim: string;
}

function periodoPadrao(): Periodo {
  const agora = new Date();
  const primeiroDia = new Date(agora.getFullYear(), agora.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
  return { inicio: primeiroDia, fim: agora.toISOString().slice(0, 10) };
}

function DashboardShell() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // O middleware é a proteção principal. Esta checagem cobre uma navegação
  // client-side que possa reutilizar o cache do dashboard após logout.
  useEffect(() => {
    try {
      if (window.localStorage.getItem('logado') === 'true') return;
    } catch {
      // Sem acesso ao storage, trate a sessão client-side como inválida.
    }

    const origem = `${window.location.pathname}${window.location.search}`;
    window.location.replace(`/login?from=${encodeURIComponent(origem)}`);
  }, []);

  const abaParam = searchParams.get('aba');
  const abaAtual = IDS_ABAS.includes(abaParam ?? '') ? abaParam! : 'descontos';

  // Filtro global: Descontos e Financeiro usam o período de datas; Operacional
  // usa apenas o ano. consultaId e anoConsultaId são separados para aplicar o
  // ano não disparar refetch desnecessário nas abas de data.
  const [periodo, setPeriodo] = useState<Periodo>(periodoPadrao);
  const [consultaId, setConsultaId] = useState(0);
  const [ano, setAno] = useState(new Date().getFullYear());
  const [anoConsultaId, setAnoConsultaId] = useState(0);

  const aplicarPeriodo = (novo: Periodo) => {
    setPeriodo(novo);
    setConsultaId((c) => c + 1);
  };

  const aplicarAno = (novoAno: number) => {
    setAno(novoAno);
    setAnoConsultaId((c) => c + 1);
  };

  // Cada painel só é montado na primeira visita e permanece montado (oculto),
  // preservando dados e filtros ao alternar de aba.
  const [visitadas, setVisitadas] = useState<Record<string, boolean>>({
    [abaAtual]: true,
  });

  useEffect(() => {
    setVisitadas((prev) => (prev[abaAtual] ? prev : { ...prev, [abaAtual]: true }));
  }, [abaAtual]);

  const trocarAba = (id: string) => {
    router.replace(`/dashboard?aba=${id}`, { scroll: false });
  };

  // Pré-aquecimento: pouco depois do primeiro paint da aba inicial, aquece o
  // cache server-side das duas rotas em lote (período vigente e ano vigente).
  // Assim, ao abrir qualquer aba pela primeira vez a resposta já vem pronta do
  // cache (sem montar painéis ocultos, o que quebraria os gráficos Recharts
  // renderizados dentro de display:none).
  useEffect(() => {
    const t = setTimeout(() => {
      fetch(
        `/api/faturamento/periodo?inicio=${periodo.inicio}&fim=${periodo.fim}`
      ).catch(() => {});
      fetch(`/api/faturamento/ano?ano=${ano}`).catch(() => {});
    }, 4000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodo.inicio, periodo.fim, ano]);

  return (
    <>
      <Sidebar abaAtiva={abaAtual} onTrocarAba={trocarAba} />
      {/* Fundo único do dashboard: cobre filtro e conteúdo sem emendas. */}
      <div
        className="with-sidebar"
        style={{ minHeight: '100vh', backgroundColor: cores.fundo }}
      >
        <FiltroGlobal
          abaAtiva={abaAtual}
          periodoInicial={periodo}
          onAplicarPeriodo={aplicarPeriodo}
          anoInicial={ano}
          onAplicarAno={aplicarAno}
        />

        {visitadas.descontos && (
          <div style={{ display: abaAtual === 'descontos' ? 'block' : 'none' }}>
            <PainelDescontos periodo={periodo} consultaId={consultaId} />
          </div>
        )}

        {visitadas.financeiro && (
          <div style={{ display: abaAtual === 'financeiro' ? 'block' : 'none' }}>
            <PainelFinanceiro periodo={periodo} consultaId={consultaId} />
          </div>
        )}

        {visitadas.operacional && (
          <div style={{ display: abaAtual === 'operacional' ? 'block' : 'none' }}>
            <PainelFaturamento ano={ano} anoConsultaId={anoConsultaId} />
          </div>
        )}
      </div>
    </>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <DashboardShell />
    </Suspense>
  );
}
