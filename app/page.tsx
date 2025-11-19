'use client';

import { useState, useEffect } from 'react';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [inicio, setInicio] = useState('2025-11-18');
  const [fim, setFim] = useState('2025-11-18');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/dashboard?inicio=${inicio}&fim=${fim}`)
      .then(r => r.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [inicio, fim]);

  if (loading) return <div className="flex items-center justify-center min-h-screen text-5xl text-white font-bold">Carregando dados reais...</div>;

  return (
    <div className="min-h-screen text-white p-12">
      <h1 className="text-6xl font-bold text-center mb-16">PowerNassau BI — Dados 100% Reais</h1>

      <div className="max-w-7xl mx-auto space-y-12">
        <div className="grid md:grid-cols-3 gap-10">
          <div className="bg-white/20 backdrop-blur-xl rounded-3xl p-12 text-center shadow-2xl">
            <p className="text-3xl opacity-90 mb-6">Total de Atendimentos</p>
            <p className="text-9xl font-black">{data?.totalAtendimentos || 0}</p>
            <p className="mt-6 text-2xl opacity-80">{inicio === fim ? inicio.split('-').reverse().join('/') : `${inicio.split('-').reverse().join('/')} → ${fim.split('-').reverse().join('/')}`}</p>
          </div>

          <div className="bg-white/20 backdrop-blur-xl rounded-3xl p-12 text-center shadow-2xl">
            <p className="text-3xl opacity-90 mb-6">Tempo Médio</p>
            <p className="text-9xl font-black">{data?.tempoMedioMinutos || '0'} min</p>
          </div>

          <div className="bg-white/20 backdrop-blur-xl rounded-3xl p-12 shadow-2xl">
            <p className="text-3xl mb-8 text-center opacity-90">Top 10 Profissionais</p>
            {data?.topProfissionais?.map((p: any, i: number) => (
              <div key={p.id} className="flex justify-between py-4 border-b border-white/30 last:border-0">
                <span className="text-2xl">{i + 1}º ID {p.id}</span>
                <span className="text-4xl font-bold">{p.qtd}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center space-x-8">
          <input type="date" value={inicio} onChange={e => setInicio(e.target.value)} className="p-4 text-xl rounded-xl text-black" />
          <input type="date" value={fim} onChange={e => setFim(e.target.value)} className="p-4 text-xl rounded-xl text-black" />
        </div>

        <p className="text-center text-2xl opacity-70">Atualizado: {data?.atualizadoEm}</p>
      </div>
    </div>
  );
}
