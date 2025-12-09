'use client';

import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
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
import { useRouter } from 'next/navigation';

// Converte "R$ 29.487,86" em número 29487.86
function parseBRLToNumber(texto: string | null | undefined): number {
  if (!texto) return 0;
  const limpo = texto.replace(/[^\d,.-]/g, '');
  const normalizado = limpo.replace(/\./g, '').replace(',', '.');
  const n = Number(normalizado);
  return Number.isFinite(n) ? n : 0;
}

export default function Dashboard() {
  const router = useRouter();

  // Verificação de login
  useEffect(() => {
    try {
      const logado = window.localStorage.getItem('logado');
      if (!logado) {
        router.replace('/login');
      }
    } catch {
      router.replace('/login');
    }
  }, [router]);

  // ←←← NOVO: seletor de ano (de 2020 até o ano atual + 2)
  const anoAtual = new Date().getFullYear();
  const [anoSelecionado, setAnoSelecionado] = useState(anoAtual);

  const [hoje, setHoje] = useState<any>(null);
  const [mensal, setMensal] = useState<any[]>([]);
  const [mensalDespesas, setMensalDespesas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregarTudo = async () => {
      setLoading(true);

      // Faturamento de hoje
      const hojeStr = new Date().toISOString().slice(0, 10);
      const hojeRes = await fetch(`/api/faturamento?inicio=${hojeStr}&fim=${hojeStr}`);
      const hojeData = await hojeRes.json();
      setHoje(hojeData);

      // 12 meses do ano selecionado
      const meses: { inicio: string; fim: string; nome: string }[] = [];
      for (let i = 0; i < 12; i++) {
        const data = new Date(anoSelecionado, i, 1);
        const inicio = data.toISOString().slice(0, 10);
        const fimMes = new Date(anoSelecionado, i + 1, 0);
        const fim = fimMes.toISOString().slice(0, 10);
        const nomeMes = data.toLocaleString('pt-BR', { month: 'short' }).replace('.', '');
        meses.push({ inicio, fim, nome: `${nomeMes} ${anoSelecionado}` });
      }

      const mensalData = await Promise.all(
        meses.map(async ({ inicio, fim, nome }) => {
          const res = await fetch(`/api/faturamento?inicio=${inicio}&fim=${fim}`);
          const data = await res.json();
          const valor = data.valor_bruto || 0;
          return {
            mes: nome,
            valor,
            valorFormatado: valor.toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            }),
          };
        })
      );

      const mensalDespesasData = await Promise.all(
        meses.map(async ({ inicio, fim, nome }) => {
          const url =
            'https://apis.biodataweb.net/ImagemCor544/biodata/dashboard/grafico' +
            '?target_url=null' +
            '&procedure=spBITotalDespesas' +
            '&parametros=%40DATAINICIO,%40DATAFIM,%40UNIDADE' +
            `&valores=${inicio},${fim},_,` +
            '&idSAC=544';
          const res = await fetch(url);
          const json = await res.json();
          const texto = json?.[0]?.['R$'] ?? 'R$ 0,00';
          const valor = parseBRLToNumber(texto);
          return {
            mes: nome,
            valor,
            valorFormatado: texto,
          };
        })
      );

      setHoje(hojeData);
      setMensal(mensalData);
      setMensalDespesas(mensalDespesasData);
      setLoading(false);
    };

    carregarTudo();
  }, [anoSelecionado]); // ←←← recarrega quando muda o ano

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
    <>
      <Sidebar />
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
        <div style={{ maxWidth: '1120px', margin: '0 auto', padding: '32px 16px 40px' }} className="space-y-32">

          <h1 className="text-7xl md:text-9xl font-black text-center bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-yellow-400 to-pink-500 drop-shadow-2xl">
            FATURAMENTO TOTAL CLÍNICA
          </h1>

          {/* SELECT DE ANO – BONITO, SEGURO E FUNCIONAL */}
          <div className="flex justify-center -mt-16 mb-10">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl px-8 py-6 border border-white/20 shadow-2xl">
              <label className="text-2xl font-bold text-white mr-6">Ano:</label>
              <select
                value={anoSelecionado}
                onChange={(e) => setAnoSelecionado(Number(e.target.value))}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-3xl font-bold px-8 py-4 rounded-xl cursor-pointer focus:outline-none focus:ring-4 focus:ring-purple-400"
              >
                {Array.from({ length: 8 }, (_, i) => anoAtual - 4 + i).map(ano => (
                  <option key={ano} value={ano} className="bg-gray-900 text-xl">
                    {ano}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* CARD DO DIA */}
          <section className="text-center">
            <div className="inline-block bg-white/10 backdrop-blur-3xl rounded-3xl p-20 shadow-2xl border border-white/30">
              <p className="text-5xl font-bold mb-8">Faturamento Hoje</p>
              <p className="text-9xl font-black text-green-400">
                {hoje.faturamento}
              </p>
              <p className="text-3xl mt-10 opacity-80">
                {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </div>
          </section>

          {/* GRÁFICO FATURAMENTO */}
          <section>
            <div className="text-center">
              <h2 className="text-5xl font-bold mb-4">
                Evolução Mensal — {anoSelecionado}
              </h2>
              <p className="text-lg md:text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed opacity-90">
                Os valores exibidos referem-se ao faturamento efetivamente registrado. <strong>PDVs particulares</strong> aparecem somente após a efetivação e <strong>convênios</strong> após o recebimento do crédito.
              </p>
            </div>

            <div className="mt-12 bg-slate-50 rounded-3xl p-12 shadow-2xl">
              <ResponsiveContainer width="100%" height={500}>
                <ComposedChart data={mensal} margin={{ top: 60, right: 40, left: 20, bottom: 40 }}>
                  <CartesianGrid stroke="#e5e7eb" strokeOpacity={0.4} vertical={false} />
                  <XAxis dataKey="mes" stroke="#6b7280" fontSize={14} tickMargin={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`} />
                  <Bar dataKey="valor" barSize={45} radius={[6, 6, 0, 0]} fill="#1e3a8a">
                    <LabelList dataKey="valorFormatado" position="top" offset={18} style={{ fill: '#1e3a8a', fontSize: 15, fontWeight: 700 }} />
                  </Bar>
                  <Line
                    type="monotone"
                    dataKey="valor"
                    stroke="#60a5fa"
                    strokeWidth={4}
                    strokeDasharray="8 8"
                    dot={{ r: 7, fill: '#1e3a8a', strokeWidth: 3, stroke: '#60a5fa' }}
                    activeDot={{ r: 9 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* GRÁFICO DESPESAS */}
          <section>
            <h2 className="text-5xl font-bold text-center mb-16">
              Despesas Mensais — {anoSelecionado}
            </h2>
            <div className="bg-orange-50 rounded-3xl p-12 shadow-2xl">
              <ResponsiveContainer width="100%" height={500}>
                <ComposedChart data={mensalDespesas} margin={{ top: 60, right: 40, left: 20, bottom: 40 }}>
                  <CartesianGrid stroke="#fed7aa" strokeOpacity={0.5} vertical={false} />
                  <XAxis dataKey="mes" stroke="#9a3412" fontSize={14} tickMargin={12} />
                  <YAxis stroke="#9a3412" fontSize={12} tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`} />
                  <Bar dataKey="valor" barSize={45} radius={[6, 6, 0, 0]} fill="#ea580c">
                    <LabelList dataKey="valorFormatado" position="top" offset={18} style={{ fill: '#9a3412', fontSize: 15, fontWeight: 700 }} />
                  </Bar>
                  <Line
                    type="monotone"
                    dataKey="valor"
                    stroke="#fb923c"
                    strokeWidth={4}
                    strokeDasharray="10 8"
                    dot={{ r: 7, fill: '#ea580c', strokeWidth: 3, stroke: '#fb923c' }}
                    activeDot={{ r: 9 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </section>

          <footer className="text-center pb-20 text-xl opacity-70">
            Dados 100% reais do Biodata — atualizado automaticamente
          </footer>
        </div>
      </div>
    </>
  );
}