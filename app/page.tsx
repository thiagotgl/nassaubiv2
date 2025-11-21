// app/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  LabelList,
} from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Dashboard() {
  const [hoje, setHoje] = useState<any>(null);
  const [mensal, setMensal] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregarTudo = async () => {
      setLoading(true);

      // FATURAMENTO DO DIA HOJE
      const hojeStr = new Date().toISOString().slice(0, 10);
      const hojeRes = await fetch(
        `/api/faturamento?inicio=${hojeStr}&fim=${hojeStr}`
      );
      const hojeData = await hojeRes.json();

      // FATURAMENTO DOS ÚLTIMOS 12 MESES
      const hoje = new Date();
      const meses: { inicio: string; fim: string; nome: string }[] = [];

      for (let i = 11; i >= 0; i--) {
        const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
        const inicio = data.toISOString().slice(0, 10);
        const fimMes = new Date(data.getFullYear(), data.getMonth() + 1, 0);
        const fim = fimMes.toISOString().slice(0, 10);
        const nome = data
          .toLocaleString('pt-BR', { month: 'short', year: 'numeric' })
          .replace('.', '');
        meses.push({ inicio, fim, nome });
      }

      // Busca valores de faturamento por mês
      const mensalBase = await Promise.all(
        meses.map(async ({ inicio, fim, nome }) => {
          const res = await fetch(
            `/api/faturamento?inicio=${inicio}&fim=${fim}`
          );
          const data = await res.json();
          const valor = data.valor_bruto || 0;
          return { mes: nome, valor };
        })
      );

      // Calcula percentuais só para a linha (se quiser usar como no modelo)
      const totalPeriodo = mensalBase.reduce(
        (acc, item) => acc + (item.valor || 0),
        0
      );

      const mensalData =
        totalPeriodo > 0
          ? mensalBase.map((item) => {
              const perc = (item.valor / totalPeriodo) * 100;
              return {
                ...item,
                valorFormatado: item.valor.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }),
                percentual: perc,
              };
            })
          : mensalBase.map((item) => ({
              ...item,
              valorFormatado: item.valor.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }),
              percentual: 0,
            }));

      setHoje(hojeData);
      setMensal(mensalData);
      setLoading(false);
    };

    carregarTudo();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <p className="text-6xl font-bold text-white animate-pulse">
          Carregando PowerNassau BI...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="max-w-7xl mx-auto p-8 space-y-32">
        <h1 className="text-7xl md:text-9xl font-black text-center bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-yellow-400 to-pink-500 drop-shadow-2xl">
          FATURAMENTO TOTAL CLÍNICA
        </h1>

        {/* CARD DO DIA */}
        <section className="text-center">
          <div className="inline-block bg-white/10 backdrop-blur-3xl rounded-3xl p-20 shadow-2xl border border-white/30">
            <p className="text-5xl font-bold mb-8">Faturamento Hoje</p>
            <p className="text-9xl font-black text-green-400">
              {hoje.faturamento}
            </p>
            <p className="text-3xl mt-10 opacity-80">
              {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", {
                locale: ptBR,
              })}
            </p>
          </div>
        </section>

        {/* GRÁFICO MENSAL – VISUAL ESTILO DASHBOARD, COM VALOR BRUTO NO TOPO */}
        <section>
          <h2 className="text-5xl font-bold text-center mb-16">
            Evolução Mensal — Últimos 12 Meses
          </h2>

          <div className="bg-slate-50 rounded-3xl p-12 shadow-2xl">
            <ResponsiveContainer width="100%" height={500}>
              <ComposedChart
                data={mensal}
                margin={{ top: 40, right: 40, left: 20, bottom: 40 }}
              >
                {/* Grid suave */}
                <CartesianGrid
                  stroke="#e5e7eb"
                  strokeOpacity={0.4}
                  vertical={false}
                />

                {/* Meses */}
                <XAxis
                  dataKey="mes"
                  stroke="#6b7280"
                  fontSize={14}
                  tickMargin={12}
                />

                {/* Eixos Y ocultos */}
                <YAxis yAxisId="left" hide />
                <YAxis yAxisId="right" orientation="right" hide />

                {/* Linha pontilhada com a tendência (usando percentual, se quiser manter) */}
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="percentual"
                  stroke="#60a5fa"
                  strokeWidth={3}
                  strokeDasharray="6 6"
                  dot={{ r: 6, fill: '#1e3a8a' }}
                />

                {/* Barras azul-escuras com VALOR BRUTO no topo */}
                <Bar
                  yAxisId="left"
                  dataKey="valor"
                  barSize={45}
                  radius={[6, 6, 0, 0]}
                  fill="#1e3a8a"
                >
                  {/* Valor bruto no topo da barra */}
                  <LabelList
                    dataKey="valorFormatado"
                    position="top"
                    offset={10}
                    style={{
                      fill: '#1e3a8a',
                      fontSize: 15,
                      fontWeight: 700,
                    }}
                  />
                </Bar>
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </section>

        <footer className="text-center pb-20 text-xl opacity-70">
          Dados 100% reais do Biodata — atualizado automaticamente
        </footer>
      </div>
    </div>
  );
}
