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
      })
      .catch(() => setLoading(false));
  }, [inicio, fim]);

  if (loading) return <div className="flex items-center justify-center min-h-screen text-4xl text-white">Carregando dados reais...</div>;

  return (
    <div className="min-h-screen text-white p-8">
      <h1 className="text-5xl font-bold text-center mb-12">PowerNassau BI — Dados 100% Reais</h1>

      <div className="max-w-5xl mx-auto space-y-12">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white/10 backdrop-blur rounded-3xl p-10 text-center">
            <p className="text-2xl opacity-90">Total de Atendimentos</p>
            <p className="text-8xl font-bold mt-6">{data?.totalAtendimentos || 0}</p>
            <p className="mt-4 text-lg opacity-80">
              {inicio === fim ? format(new Date(inicio), 'dd/MM/yyyy', { locale: ptBR }) : `${inicio} → ${fim}`}
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur rounded-3xl p-10 text-center">
            <p className="text-2xl opacity-90">Tempo Médio</p>
            <p className="text-8xl font-bold mt-6">{data?.tempoMedioMinutos || '0'} min</p>
          </div>

          <div className="bg-white/10 backdrop-blur rounded-3xl p-10">
            <p className="text-2xl mb-6 text-center opacity-90">Top 10 Profissionais</p>
            {data?.topProfissionais?.map((p: any, i: number) => (
              <div key={p.id} className="flex justify-between py-3 border-b border-white/20">
                <span className="text-lg">{i + 1}º ID {p.id}</span>
                <span className="text-2xl font-bold">{p.qtd}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center space-x-6">
          <input type="date" value={inicio} onChange={e => setInicio(e.target.value)} className="p-4 rounded-lg text-black text-lg" />
          <input type="date" value={fim} onChange={e => setFim(e.target.value)} className="p-4 rounded-lg text-black text-lg" />
        </div>

        <p className="text-center text-lg opacity-70">Atualizado: {data?.atualizadoEm}</p>
      </div>
    </div>
  );
}
