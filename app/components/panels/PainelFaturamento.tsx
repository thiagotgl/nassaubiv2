'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import Card from '../ui/Card';
import GraficoBarras from '../ui/GraficoBarras';
import CabecalhoPagina from '../ui/CabecalhoPagina';
import { cores, estilos, paletaGraficos } from '../ui/tema';

interface PainelProps {
  ano: number;
  anoConsultaId: number;
}

export default function PainelFaturamento({ ano, anoConsultaId }: PainelProps) {
  const router = useRouter();

  // Verificação de login
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

  const [hoje, setHoje] = useState<any>(null);
  const [mensal, setMensal] = useState<any[]>([]);
  const [mensalDespesas, setMensalDespesas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregarTudo = async () => {
      setLoading(true);

      // Endpoint em lote: hoje + os 12 meses do ano (faturamento e despesas)
      // em 1 chamada. Obedece ao filtro global de ano.
      try {
        const res = await fetch(`/api/faturamento/ano?ano=${ano}`);
        if (!res.ok) throw new Error(`Erro HTTP ${res.status}`);
        const json = await res.json();

        setHoje(json.hoje);
        setMensal(json.mensal ?? []);
        setMensalDespesas(json.mensalDespesas ?? []);
      } catch {
        setHoje({ faturamento: 'R$ 0,00', valor_bruto: 0 });
        setMensal([]);
        setMensalDespesas([]);
      } finally {
        setLoading(false);
      }
    };

    carregarTudo();
    // Recarrega quando o filtro global de ano é aplicado
  }, [router, ano, anoConsultaId]);

  if (loading) {
    return (
      <div style={{ ...estilos.containerPagina, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontSize: '28px', fontWeight: 700, color: cores.corpo }}>
          Carregando PowerNassau BI...
        </p>
      </div>
    );
  }

  return (
    <div style={estilos.containerPagina}>
      <div style={estilos.pagina}>
        <CabecalhoPagina titulo="Faturamento Total Clínica" />

        {/* CARD DO DIA */}
        <Card estilo={{ textAlign: 'center' }}>
          <p style={{ fontSize: '20px', fontWeight: 700, color: cores.corpo }}>
            Faturamento Hoje
          </p>
          <p
            style={{
              fontSize: '48px',
              fontWeight: 900,
              color: paletaGraficos.verdePositivo,
              margin: '8px 0',
            }}
          >
            {hoje.faturamento}
          </p>
          <p style={{ fontSize: '14px', color: cores.suave }}>
            {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </Card>

        {/* GRÁFICO FATURAMENTO */}
        <Card
          titulo={`Evolução Mensal — ${ano}`}
          subtitulo="Os valores exibidos referem-se ao faturamento efetivamente registrado. PDVs particulares aparecem somente após a efetivação e convênios após o recebimento do crédito."
        >
          <GraficoBarras
            dados={mensal}
            chaveX="mes"
            altura={360}
            mostrarValoresNoTopo
            linhaTendencia={{ cor: paletaGraficos.ambarKpi }}
            series={[{ dataKey: 'valor', nome: 'Faturamento', cor: paletaGraficos.azulPrincipal }]}
          />
        </Card>

        {/* GRÁFICO DESPESAS */}
        <Card titulo={`Despesas Mensais — ${ano}`}>
          <GraficoBarras
            dados={mensalDespesas}
            chaveX="mes"
            altura={360}
            mostrarValoresNoTopo
            linhaTendencia={{ cor: paletaGraficos.indigo }}
            series={[{ dataKey: 'valor', nome: 'Despesas', cor: paletaGraficos.laranjaAlerta }]}
          />
        </Card>

        <footer
          style={{
            textAlign: 'center',
            padding: '24px 0',
            fontSize: '12px',
            color: cores.suave,
          }}
        >
          Dados 100% reais do Biodata — atualizado automaticamente
        </footer>
      </div>
    </div>
  );
}
