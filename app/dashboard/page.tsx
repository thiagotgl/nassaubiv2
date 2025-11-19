// app/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Dashboard() {
  const [hoje, setHoje] = useState<any>(null);
  const [mensal, setMensal] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregarTudo = async () => {
      setLoading(true);

      // FATURAMENTO DO DIA REAL (hoje mesmo!)
      const hojeStr = new Date().toISOString().slice(0, 10);
      const hojeRes = await fetch(`/api/faturamento?inicio=${hojeStr}&fim=${hojeStr}`);
      const hojeData = await hojeRes.json();

      // FATURAMENTO MENSAL (últimos 12 meses)
      const hoje = new Date();
      const meses = [];
      for (let i = 11; i >= 0; i--) {
        const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
        const inicio = data.toISOString().slice(0, พิ10);
        const fimMes = new Date(data.getFullYear(), data.getMonth() + 1, 0);
        const fim = fimMes.toISOString().slice(0, 10);
        const nome = data.toLocaleString('pt-BR', { month: 'short', year: 'numeric' }).replace('.', '');
        meses.push({ inicio, fim, nome });
      }

      const mensalPromises = meses.map(async ({ inicio, fim, nome }) => {
        const url = `/api/faturamento?inicio=${inicio}&fim=${fim}`;
        const res = await fetch(url);
        const data = await res.json();
        const valor = data.valor_bruto || 0;
        return { mes: nome, valor, valorFormatado: valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) };
      });

      const mensalData = await Promise.all(mensalPromises);

      setHoje(hojeData);
      setMensal(mensalData);
      setLoading(false);
    };

    carregarTudo();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <p className="text-6xl font-bold text-white animate-pulse">Carregando PowerNassau BI...</p>
      </div>
    );
  }

  // Cores para barras (verde mais claro no topo)
  const COLORS = ['#34d399', '#10b981', '#059669', '#047857', '#065f46'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="max-w-7xl mx-auto p-8 space-y-32">

        {/* TÍTULO */}
        <h1 className="text-7xl md:text-9xl font-black text-center bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-yellow-400 to-pink-500 drop-shadow-2xl">
          FATURAMENTO TOTAL CLÍNICA
        </h1>

        {/* FATURAMENTO DO DIA REAL — HOJE MESMO */}
        <section className="relative text-center">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-pink-500/20 blur-3xl rounded-full"></div>
          <div className="relative inline-block bg-black/40 backdrop-blur-3xl rounded-3xl p-20 border border-white/30 shadow-2xl">
            <p className="text-4xl md:text-5xl font-bold mb-8 opacity-90">Faturamento Hoje</p>
            <p className="text-9xl md:text-10xl font-black bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400 drop-shadow-2xl">
              {hoje.faturamento}
            </p>
            <p className="text-3xl mt-10 opacity-80 font-light">
              {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </div>
        </section>

        {/* GRÁFICO MENSAL — VALOR VISÍVEL SEM HOVER */}
        <section>
          <h2 className="text-5xl font-bold text-center mb-16 opacity-90">
            Evolução Mensal — Últimos 12 Meses
          </h2>
          <div className="bg-white/5 backdrop-blur-3xl rounded-3xl p-12 shadow-2xl border border-white/10">
            <ResponsiveContainer width="100%" height={620}>
              <ComposedChart data={mensal} margin={{ top: 40, right: 30, left: 50, bottom: 80 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis 
                  dataKey="mes" 
                  stroke="#e2e8f0" 
                  fontSize={18}
                  tick={{ fill: '#e2e8f0' }}
                />
                <YAxis 
                  stroke="#e2e8f0" 
                  fontSize={16}
                  tickFormatter={(v) => `R$ ${(v/1000).toFixed(0)}k`}
                  tick={{ fill: '#e2e8f0' }}
                />
                <Tooltip 
                  formatter={(v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: '16px' }}
                />
                {/* BARRAS FINAS E ELEGANTE */}
                <Bar dataKey="valor" radius={20} barSize={32}>
                  {mensal.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
                {/* LINHA SUAVE */}
                <Line 
                  type="monotone" 
                  dataKey="valor" 
                  stroke="#fbbf24" 
                  strokeWidth={6} 
                  dot={{ fill: '#fbbf24', r: 12, stroke: '#1e293b', strokeWidth: 4 }}
                />
                {/* VALOR NA BARRA (SEMPRE VISÍVEL) */}
                {mensal.map((entry, index) => (
                  <text 
                    key={`label-${index}`}
                    x={index * (1000 / mensal.length) + 500 / mensal.length} 
                    y={entry.valor > 10000 ? entry.valor - 20000 : entry.valor + 30000}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="18"
                    fontWeight="bold"
                  >
                    {entry.valorFormatado}
                  </text>
                ))}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </section>

        <footer className="text-center pb-20">
          <p className="text-2xl opacity-70">
            Dados 100% reais do Biodata — atualizado automaticamente
          </p>
        </footer>
      </div>
    </div>
  );
}
