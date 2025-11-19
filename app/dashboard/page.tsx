// app/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';

export default function Dashboard() {
  const [faturamento, setFaturamento] = useState('Carregando...');
  const [dataInicio, setDataInicio] = useState('2025-11-18');
  const [dataFim, setDataFim] = useState('2025-11-18');
  const [loading, setLoading] = useState(true);

  const carregarFaturamento = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/faturamento?inicio=${dataInicio}&fim=${dataFim}`);
      const data = await res.json();
      setFaturamento(data.faturamento || 'R$ 0,00');
    } catch (err) {
      setFaturamento('Erro ao carregar');
    }
    setLoading(false);
  };

  useEffect(() => {
    carregarFaturamento();
  }, [dataInicio, dataFim]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-5xl md:text-7xl font-black text-center mb-16 bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-pink-500">
          PowerNassau BI — AO VIVO
        </h1>

        {/* CARD FATURAMENTO REAL */}
        <div className="text-center mb-16">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-12 inline-block shadow-2xl border border-white/20">
            <p className="text-3xl mb-6 opacity-90">Faturamento Real (Biodata)</p>
            <p className="text-8xl font-black text-green-400">
              {loading ? '...' : faturamento}
            </p>
            <p className="text-xl mt-6 opacity-80">
              {dataInicio === dataFim 
                ? format(new Date(dataInicio), 'dd/MM/yyyy')
                : `${format(new Date(dataInicio), 'dd/MM')} → ${format(new Date(dataFim), 'dd/MM/yyyy')}`
              }
            </p>
          </div>
        </div>

        {/* SELETOR DE DATA */}
        <div className="text-center space-x-6">
          <input
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
            className="px-6 py-4 rounded-xl text-black text-xl"
          />
          <input
            type="date"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
            className="px-6 py-4 rounded-xl text-black text-xl"
          />
          <button
            onClick={carregarFaturamento}
            className="px-8 py-4 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-xl text-xl transition"
          >
            Atualizar
          </button>
        </div>

        <p className="text-center mt-20 text-lg opacity-70">
          Dados 100% reais do sistema Biodata — atualizado em tempo real
        </p>
      </div>
    </div>
  );
}
