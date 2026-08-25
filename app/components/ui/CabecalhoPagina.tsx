'use client';

import type { ReactNode } from 'react';
import { cores } from './tema';

interface CabecalhoPaginaProps {
  titulo: string;
  /** Conteúdo opcional exibido como "Período: <conteúdo>" abaixo do título. */
  periodoTexto?: ReactNode;
}

// Cabeçalho padrão das abas: título em azul Nassau + subtítulo de período.
export default function CabecalhoPagina({ titulo, periodoTexto }: CabecalhoPaginaProps) {
  return (
    <header style={{ marginBottom: '24px' }}>
      <h1
        style={{
          fontSize: '28px',
          fontWeight: 900,
          marginBottom: periodoTexto != null ? '8px' : undefined,
          color: cores.primaria,
        }}
      >
        {titulo}
      </h1>
      {periodoTexto != null && (
        <p style={{ fontSize: '14px', color: cores.corpo }}>
          Período: <strong>{periodoTexto}</strong>
        </p>
      )}
    </header>
  );
}
