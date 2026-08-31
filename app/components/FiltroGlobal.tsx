'use client';

import { useState } from 'react';
import { cores, estilos } from './ui/tema';

interface FiltroGlobalProps {
  abaAtiva: string;
  periodoInicial: { inicio: string; fim: string };
  onAplicarPeriodo: (periodo: { inicio: string; fim: string }) => void;
  anoInicial: number;
  onAplicarAno: (ano: number) => void;
}

export default function FiltroGlobal({
  abaAtiva,
  periodoInicial,
  onAplicarPeriodo,
  anoInicial,
  onAplicarAno,
}: FiltroGlobalProps) {
  const [inicio, setInicio] = useState(periodoInicial.inicio);
  const [fim, setFim] = useState(periodoInicial.fim);
  const [ano, setAno] = useState(anoInicial);

  const modoAno = abaAtiva === 'operacional';
  const invalido = !modoAno && (!inicio || !fim || fim < inicio);

  const aplicar = () => {
    if (invalido) return;
    if (modoAno) {
      onAplicarAno(ano);
    } else {
      onAplicarPeriodo({ inicio, fim });
    }
  };

  return (
    <div style={{ maxWidth: '1120px', margin: '0 auto', padding: '16px 16px 0' }}>
      <div
        style={{
          backgroundColor: cores.card,
          borderRadius: '12px',
          padding: '12px 14px',
          border: `1px solid ${cores.borda}`,
          boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-end',
          gap: '12px',
        }}
      >
        {modoAno ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: '12px', color: cores.suave }}>Ano</label>
            <select
              value={ano}
              onChange={(e) => setAno(Number(e.target.value))}
              style={{
                ...estilos.campoData,
              }}
            >
              {Array.from({ length: 8 }, (_, i) => anoInicial - 4 + i).map((opcao) => (
                <option key={opcao} value={opcao}>
                  {opcao}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: '12px', color: cores.suave }}>Data inicial</label>
              <input
                type="date"
                value={inicio}
                onChange={(e) => setInicio(e.target.value)}
                style={{
                  ...estilos.campoData,
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: '12px', color: cores.suave }}>Data final</label>
              <input
                type="date"
                value={fim}
                onChange={(e) => setFim(e.target.value)}
                style={{
                  ...estilos.campoData,
                }}
              />
            </div>

            {invalido && (
              <span style={{ fontSize: '12px', color: cores.erro }}>
                A data final deve ser igual ou posterior à data inicial.
              </span>
            )}
          </>
        )}

        <button
          type="button"
          onClick={aplicar}
          disabled={invalido}
          title={
            modoAno
              ? 'Aplica o ano no Dashboard Operacional'
              : 'Aplica o período em todas as abas de data'
          }
          style={{
            marginTop: '18px',
            backgroundColor: invalido ? cores.desabilitado : cores.acao,
            color: '#ffffff',
            fontWeight: 600,
            fontSize: '13px',
            cursor: invalido ? 'default' : 'pointer',
            padding: '6px 14px',
            borderRadius: '9999px',
            border: 'none',
          }}
        >
          Atualizar dados
        </button>
      </div>
    </div>
  );
}
