'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Card from '../ui/Card';
import CabecalhoPagina from '../ui/CabecalhoPagina';
import GraficoBarras from '../ui/GraficoBarras';
import { cores, estilos, paletaGraficos } from '../ui/tema';

interface PainelProps {
  periodo: { inicio: string; fim: string };
  consultaId: number;
}

export default function PainelDescontos({ periodo, consultaId }: PainelProps) {
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
      const res = await fetch(montarUrl(periodo.inicio, periodo.fim));
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
    // Recarrega quando o filtro global é aplicado
  }, [router, periodo.inicio, periodo.fim, consultaId]);

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
    ...estilos.containerPagina,
  };

  const wrapperStyle: React.CSSProperties = {
    ...estilos.pagina,
  };

  return (
    <div style={containerStyle}>
        <div style={wrapperStyle}>
          <CabecalhoPagina
            titulo="Painel de Descontos"
            periodoTexto={`${formatarData(periodo.inicio)} até ${formatarData(periodo.fim)}`}
          />

          <div
            style={{
              backgroundColor: cores.info.fundo,
              border: `1px solid ${cores.info.borda}`,
              borderRadius: '10px',
              padding: '12px 16px',
              fontSize: '14px',
              color: cores.info.texto,
              fontWeight: 600,
              display: 'inline-block',
              marginBottom: '8px',
            }}
          >
            Os valores desta aba são informados conforme a data do atendimento.
          </div>

          {loading && <p style={{ fontSize: '16px', color: cores.corpo }}>Carregando dados...</p>}

          {erro && <p style={{ fontSize: '16px', color: cores.erro }}>{erro}</p>}

          {!loading && !erro && porConvenio.length === 0 && (
            <p style={{ fontSize: '16px', color: cores.corpo }}>
              Nenhum registro encontrado no período.
            </p>
          )}

          {!loading && !erro && porConvenio.length > 0 && (
            <Card
              titulo="Top 10 Convênios por Faturamento"
              subtitulo="Comparação de faturado, desconto e valor líquido no período selecionado."
            >
              <GraficoBarras
                dados={top10}
                chaveX="convenio"
                rotulosInclinados
                series={[
                  { dataKey: 'desconto', nome: 'Total de Desconto', cor: paletaGraficos.ambar },
                  { dataKey: 'faturado', nome: 'Total Faturado', cor: paletaGraficos.azulPrincipal },
                  { dataKey: 'liquido', nome: 'Valor Líquido', cor: paletaGraficos.verdePositivo },
                ]}
              />
            </Card>
          )}

          {!loading && !erro && porConvenio.length > 0 && (
            <div
              style={{
                ...estilos.cardSecao,
                overflowX: 'auto',
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
                          borderBottom: `2px solid ${cores.borda}`,
                          color: cores.suave,
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
                      <td style={{ padding: '8px 12px', borderBottom: `1px solid ${cores.linha}`, fontWeight: 600 }}>
                        {linha.convenio}
                      </td>
                      <td style={{ padding: '8px 12px', borderBottom: `1px solid ${cores.linha}`, color: paletaGraficos.ambar, whiteSpace: 'nowrap' }}>
                        {formatBRL(linha.desconto)}
                      </td>
                      <td style={{ padding: '8px 12px', borderBottom: `1px solid ${cores.linha}`, color: paletaGraficos.azulPrincipal, whiteSpace: 'nowrap' }}>
                        {formatBRL(linha.faturado)}
                      </td>
                      <td style={{ padding: '8px 12px', borderBottom: `1px solid ${cores.linha}`, color: paletaGraficos.verdePositivo, whiteSpace: 'nowrap' }}>
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
                    <td style={{ padding: '10px 12px', fontWeight: 800, color: paletaGraficos.ambar, whiteSpace: 'nowrap' }}>
                      {formatBRL(totalDesconto)}
                    </td>
                    <td style={{ padding: '10px 12px', fontWeight: 800, color: paletaGraficos.azulPrincipal, whiteSpace: 'nowrap' }}>
                      {formatBRL(totalFaturado)}
                    </td>
                    <td style={{ padding: '10px 12px', fontWeight: 800, color: paletaGraficos.verdePositivo, whiteSpace: 'nowrap' }}>
                      {formatBRL(totalLiquido)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>
  );
}
