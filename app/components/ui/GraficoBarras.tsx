'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  LabelList,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { cores } from './tema';

export interface SerieGrafico {
  dataKey: string;
  nome: string;
  cor: string;
}

interface GraficoBarrasProps {
  dados: any[];
  chaveX: string;
  series: SerieGrafico[];
  /** Padrão: 320 (ou 360 com rótulos inclinados). */
  altura?: number;
  /** Rótulos do eixo X em -30° para nomes longos. */
  rotulosInclinados?: boolean;
  /** Padrão: exibe quando há mais de uma série. */
  legenda?: boolean;
  /** Formata valores como BRL no Tooltip/Eixo Y. Padrão: true. */
  moeda?: boolean;
  /** Opcional: formata os rótulos do eixo X (ex.: datas). */
  formatarEixoX?: (valor: any) => string;
  /** Linha de tendência desenhada atrás das barras e dos valores do topo. */
  linhaTendencia?: { cor: string };
  /**
   * Exibe o valor monetário no topo de cada barra (apenas 1 série).
   * Quando dois valores vizinhos podem se sobrepor, os labels sobem em
   * fileiras alternadas e a margem superior cresce automaticamente.
   */
  mostrarValoresNoTopo?: boolean;
}

const ALTURA_LINHA_LABEL = 14;

function formatarBRL(v: any) {
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const formatarNumero = (v: any) => Number(v).toLocaleString('pt-BR');

// Gráfico de barras padrão do projeto: mesmos eixos, grid, tooltip (valores
// apenas no hover, salvo quando mostrarValoresNoTopo é usado) e legend.
export default function GraficoBarras({
  dados,
  chaveX,
  series,
  altura,
  rotulosInclinados = false,
  legenda,
  moeda = true,
  formatarEixoX,
  linhaTendencia,
  mostrarValoresNoTopo = false,
}: GraficoBarrasProps) {
  const mostrarLegenda = legenda ?? series.length > 1;
  const formatarValor = moeda ? formatarBRL : formatarNumero;
  const alturaFinal = altura ?? (rotulosInclinados ? 360 : 320);

  // Largura real do gráfico, para calcular colisão entre labels do topo.
  const containerRef = useRef<HTMLDivElement>(null);
  const [largura, setLargura] = useState(0);

  useEffect(() => {
    if (!mostrarValoresNoTopo || !containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setLargura(entry.contentRect.width);
      }
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [mostrarValoresNoTopo]);

  // Distribuição dos labels em fileiras (greedy): cada label ocupa a menor
  // fileira cujo espaço horizontal já não está ocupado pelo vizinho anterior.
  let valoresFormatados: string[] = [];
  let largurasLabels: number[] = [];
  let fileiras: number[] = [];
  let totalFileiras = 1;

  if (mostrarValoresNoTopo && largura > 0 && dados.length > 0) {
    valoresFormatados = dados.map((d) => formatarValor(d[series[0].dataKey]));
    // Estimativa de largura de texto (~6.5px por caractere a 11px bold) + respiro.
    largurasLabels = valoresFormatados.map((t) => t.length * 6.5 + 10);

    fileiras = [];
    const fimUltimoLabelNaFileira: number[] = [];
    const centros = dados.map(
      (_, i) => (i + 0.5) * (largura / dados.length)
    );

    for (let i = 0; i < dados.length; i++) {
      const inicioLabel = centros[i] - largurasLabels[i] / 2;
      const fimLabel = centros[i] + largurasLabels[i] / 2;

      let fileiraEscolhida = -1;
      for (let f = 0; f < fimUltimoLabelNaFileira.length; f++) {
        if (fimUltimoLabelNaFileira[f] <= inicioLabel) {
          fileiraEscolhida = f;
          break;
        }
      }
      if (fileiraEscolhida === -1) {
        fileiraEscolhida = fimUltimoLabelNaFileira.length;
      }

      fimUltimoLabelNaFileira[fileiraEscolhida] = fimLabel;
      fileiras.push(fileiraEscolhida);
    }
    totalFileiras = Math.max(1, ...fileiras.map((f) => f + 1));
  }

  const margemTopo = mostrarValoresNoTopo ? 16 + totalFileiras * ALTURA_LINHA_LABEL : 10;

  const grade = (
    <CartesianGrid strokeDasharray="3 3" stroke={cores.borda} vertical={false} />
  );
  const eixoY = (
    <YAxis
      stroke={cores.suave}
      fontSize={11}
      tickFormatter={(v: any) => (moeda ? `R$ ${(Number(v) / 1000).toFixed(0)}k` : formatarNumero(v))}
    />
  );
  const tooltip = (
    <Tooltip formatter={(v: any) => formatarValor(v)} cursor={{ fill: 'rgba(15, 23, 42, 0.04)' }} />
  );
  const legendaEl = mostrarLegenda ? (
    <Legend formatter={(value) => <span style={{ marginRight: 24 }}>{value}</span>} />
  ) : null;

  const labelsDoTopo =
    mostrarValoresNoTopo && largura > 0 && dados.length > 0 ? (
      <LabelList
        content={(props: any) => {
          const index: number = props.index ?? 0;
          const texto = valoresFormatados[index];
          if (!texto) return null;
          return (
            <text
              x={(props.x ?? 0) + (props.width ?? 0) / 2}
              y={(props.y ?? 0) - 12 - (fileiras[index] ?? 0) * ALTURA_LINHA_LABEL}
              textAnchor="middle"
              fontSize={11}
              fontWeight={700}
              fill={series[0].cor}
            >
              {texto}
            </text>
          );
        }}
      />
    ) : null;

  return (
    <div ref={containerRef}>
      <ResponsiveContainer width="100%" height={alturaFinal}>
        {linhaTendencia ? (
          <ComposedChart
            data={dados}
            margin={{
              top: margemTopo,
              right: 20,
              left: 0,
              bottom: rotulosInclinados ? 10 : 0,
            }}
          >
            {grade}
            <XAxis
              dataKey={chaveX}
              stroke={cores.suave}
              fontSize={11}
              tickMargin={8}
              {...(rotulosInclinados
                ? { angle: -30, textAnchor: 'end' as const, interval: 0, height: 70 }
                : {})}
              {...(formatarEixoX
                ? { tickFormatter: formatarEixoX, interval: 'preserveStartEnd' as const }
                : {})}
            />
            {eixoY}
            {tooltip}
            {legendaEl}
            {/* A linha vem antes das barras para ficar atrás dos valores do topo. */}
            <Line
              type="monotone"
              dataKey={series[0].dataKey}
              stroke={linhaTendencia.cor}
              strokeWidth={2}
              strokeDasharray="4 4"
              strokeOpacity={0.8}
              dot={false}
              activeDot={false}
            />
            {series.map((s) => (
              <Bar
                key={s.dataKey}
                dataKey={s.dataKey}
                name={s.nome}
                fill={s.cor}
                radius={[6, 6, 0, 0]}
              >
                {labelsDoTopo}
              </Bar>
            ))}
          </ComposedChart>
        ) : (
          <BarChart
            data={dados}
            margin={{
              top: margemTopo,
              right: 20,
              left: 0,
              bottom: rotulosInclinados ? 10 : 0,
            }}
          >
            {grade}
            <XAxis
              dataKey={chaveX}
              stroke={cores.suave}
              fontSize={11}
              tickMargin={8}
              {...(rotulosInclinados
                ? { angle: -30, textAnchor: 'end' as const, interval: 0, height: 70 }
                : {})}
              {...(formatarEixoX
                ? { tickFormatter: formatarEixoX, interval: 'preserveStartEnd' as const }
                : {})}
            />
            {eixoY}
            {tooltip}
            {legendaEl}
            {series.map((s) => (
              <Bar
                key={s.dataKey}
                dataKey={s.dataKey}
                name={s.nome}
                fill={s.cor}
                radius={[6, 6, 0, 0]}
              >
                {labelsDoTopo}
              </Bar>
            ))}
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
