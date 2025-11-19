// app/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
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
      const hojeRes = await fetch(`/api/faturamento?inicio=${hojeStr}&fim=${hojeStr}`);
      const hojeData = await hojeRes.json();

      // FATURAMENTO DOS ÚLTIMOS 12 MESES
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

      const mensalData = await Promise.all(
        meses.map(async ({ inicio, fim, nome }) => {
          const res = await fetch(`/api/faturamento?inicio=${inicio}&fim=${fim}`);
          const data = await res.json();
          const valor = data.valor_bruto || 0;
          return {
            mes: nome,
            valor,
            valorFormatado: valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
          };
        })
      );

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
            <p className="text-9xl font-black text-green-400">{hoje.faturamento}</p>
            <p className="text-3xl mt-10 opacity-80">
              {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </div>
        </section>

        {/* GRÁFICO MENSAL */}
        <section>
          <h2 className="text-5xl font-bold text-center mb-16">Evolução Mensal — Últimos 12 Meses</h2>
          <div className="bg-white/5 backdrop-blur-3xl rounded-3xl p-12 shadow-2xl">
            <ResponsiveContainer width="100%" height={600}>
              <ComposedChart data={mensal} margin={{ top: 60, right: 30, left: 50, bottom: 80 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="mes" stroke="#e2e8f0" fontSize={18} />
                <YAxis stroke="#e2e8f0" fontSize={16} tickFormatter={(v) => `R$ ${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
                <Bar dataKey="valor" fill="#10b981" radius={20} barSize={32} />
                <Line type="monotone" dataKey="valor" stroke="#fbbf24" strokeWidth={6} dot={{ fill: '#fbbf24', r: 12 }} />
                {mensal.map((entry, index) => (
                  <text key={index} x={index * (1000 / mensal.length) + 500 / mensal.length} y={entry.valor - 15000} textAnchor="middle" fill="#ffffff" fontSize="20" fontWeight="bold">
                    {entry.valorFormatado}
                  </text>
                ))}
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
