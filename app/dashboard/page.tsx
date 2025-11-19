// app/dashboard/page.tsx  (TUDO AQUI — 1 única rota)
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

      // FATURAMENTO HOJE
      const hojeRes = await fetch('/api/faturamento');
      const hojeData = await hojeRes.json();

      // FATURAMENTO MENSAL (últimos 12 meses)
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
        <p className="text-6xl font-bold text-white">Carregando PowerNassau BI...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white">
      <div className="max-w-7xl mx-auto p-8 space-y-32">

        {/* TÍTULO */}
        <h1 className="text-6xl md:text-8xl font-black text-center bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-pink-500">
          FATURAMENTO TOTAL CLÍNICA
        </h1>

        {/* CARD FATURAMENTO DO DIA */}
        <section className="text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-12 opacity-90">Faturamento Hoje</h2>
          <div className="inline-block bg-white/10 backdrop-blur-2xl rounded-3xl p-16 shadow-2xl border border-white/20">
            <p className="text-9xl md:text-10xl font-black text-green-400">
              {hoje.faturamento}
            </p>
            <p className="text-3xl mt-8 opacity-80">
              {new Date().toLocaleDateString('pt-BR')}
            </p>
          </div>
        </section>

        {/* GRÁFICO EVOLUÇÃO MENSAL */}
        <section>
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-12">
            Evolução Mensal — Últimos 12 Meses
          </h2>
          <div className="bg-white/10 backdrop-blur-2xl rounded-3xl p-10 shadow-2xl">
            <ResponsiveContainer width="100%" height={560}>
              <ComposedChart data={mensal}>
                <CartesianGrid strokeDasharray="4 4" stroke="#ffffff20" />
                <XAxis dataKey="mes" stroke="#fff" fontSize={18} />
                <YAxis stroke="#fff" fontSize={16} tickFormatter={(v) => `R$ ${(v/1000).toFixed(0)}k`} />
                <Tooltip 
                  formatter={(v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  contentStyle={{ background: '#1e1b4b', border: 'none', borderRadius: '16px', padding: '16px' }}
                />
                <Bar dataKey="valor" fill="#10b981" radius={12} />
                <Line type="monotone" dataKey="valor" stroke="#fbbf24" strokeWidth={6} dot={{ fill: '#fbbf24', r: 10 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </section>

        <footer className="text-center pb-20">
          <p className="text-xl opacity-70">
            Dados 100% reais do Biodata — atualizado automaticamente
          </p>
        </footer>
      </div>
    </div>
  );
}
