'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
      });
  }, [inicio, fim]);

  if (loading) return <div className="p-8 text-3xl text-center">Carregando dados reais...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 text-white p-8">
      <h1 className="text-5xl font-bold text-center mb-10">PowerNassau BI — Dados 100% Reais</h1>

      <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8 mb-10">
        <div className="bg-white/10 backdrop-blur rounded-2xl p-8 text-center">
          <p className="text-2xl opacity-90">Total de Atendimentos</p>
          <p className="text-7xl font-bold mt-4">{data?.totalAtendimentos || 0}</p>
          <p className="mt-4 opacity-80">{inicio === fim ? format(new Date(inicio), 'dd/MM/yyyy', { locale: ptBR }) : `${inicio} → ${fim}`}</p>
        </div>

        <div className="bg-white/10 backdrop-blur rounded-2xl p-8 text-center">
          <p className="text-2xl opacity-90">Tempo Médio</p>
          <p className="text-7xl font-bold mt-4">{data?.tempoMedioMinutos || '0'} min</p>
        </div>

        <div className="bg-white/10 backdrop-blur rounded-2xl p-8">
          <p className="text-xl opacity-90 mb-4">Top 10 Profissionais</p>
          {data?.topProfissionais?.map((p, i) => (
            <div key={p.id} className="flex justify-between py-2 border-b border-white/20">
              <span>{i + 1}º ID {p.id}</span>
              <span className="font-bold">{p.qtd}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center">
        <input type="date" value={inicio} onChange={e => setInicio(e.target.value)} className="p-3 rounded text-black mr-4" />
        <input type="date" value={fim} onChange={e => setFim(e.target.value)} className="p-3 rounded text-black" />
      </div>

      <p className="text-center mt-10 opacity-70">Atualizado: {data?.atualizadoEm}</p>
    </div>
  );
}
