// app/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const [hoje, setHoje] = useState<any>(null);
  const [mensal, setMensal] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregarTudo = async () => {
      setLoading(true);

      const hojeRes = await fetch('/api/faturamento');
      const hojeData = await hojeRes.json();

      const hoje = new Date();
      const meses = [];
      for (let i = 11; i >= 0; i--) {
        const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
        const inicio = data.toISOString().slice(0, 10);
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
        return { mes: nome, valor };
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
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-pink-900 flex items-center justify-center">
        <p className="text-6xl font-bold text-white animate-pulse">Carregando PowerNassau BI...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="max-w-7xl mx-auto p-8 space-y-32">

        {/* TÍTULO */}
        <h1 className="text-7xl md:text-9xl font-black text-center bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-yellow-400 to-pink-500 drop-shadow-2xl">
          FATURAMENTO TOTAL CLÍNICA
        </h1>

        {/* CARD FATURAMENTO DO DIA — SUPER VISTOSO */}
        <section className="relative text-center">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-pink-500/20 blur-3xl rounded-full"></div>
          <div className="relative inline-block bg-black/40 backdrop-blur-3xl rounded-3xl p-20 border border-white/30 shadow-2xl">
            <p className="text-4xl md:text-5xl font-bold mb-8 opacity-90">Faturamento Hoje</p>
            <p className="text-9xl md:text-10xl font-black bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400 drop-shadow-2xl">
              {hoje.faturamento}
            </p>
            <p className="text-3xl mt-10 opacity-80 font-light">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </section>

        {/* GRÁFICO MENSAL — BARRAS FINAS E ELEGANTE */}
        <section>
          <h2 className="text-5xl font-bold text-center mb-16 opacity-90">
            Evolução Mensal — Últimos 12 Meses
          </h2>
          <div className="bg-white/5 backdrop-blur-3xl rounded-3xl p-12 shadow-2xl border border-white/10">
            <ResponsiveContainer width="100%" height={600}>
              <ComposedChart data={mensal} margin={{ top: 20, right: 30, left: 50, bottom: 60 }}>
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
                  labelStyle={{ color: '#e2e8f0' }}
                />
                {/* BARRA FINA E ELEGANTE */}
                <Bar 
                  dataKey="valor" 
                  fill="url(#colorGradient)" 
                  radius={[20, 20, 0, 0]} 
                  barSize={28}
                />
                {/* LINHA SUAVE */}
                <Line 
                  type="monotone" 
                  dataKey="valor" 
                  stroke="#fbbf24" 
                  strokeWidth={6} 
                  dot={{ fill: '#fbbf24', r: 12, stroke: '#1e293b', strokeWidth: 4 }}
                />
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.9}/>
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0.6}/>
                  </linearGradient>
                </defs>
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
