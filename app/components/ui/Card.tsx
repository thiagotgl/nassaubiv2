'use client';

import type { CSSProperties, ReactNode } from 'react';
import { cores, estilos } from './tema';

interface CardProps {
  titulo?: string;
  subtitulo?: string;
  children: ReactNode;
  estilo?: CSSProperties;
}

// Seção branca padrão: card com borda e sombra suaves, usado por todas as abas.
export default function Card({ titulo, subtitulo, children, estilo }: CardProps) {
  return (
    <section style={{ ...estilos.cardSecao, ...estilo }}>
      {titulo && (
        <h2
          style={{
            fontSize: '18px',
            fontWeight: 600,
            marginBottom: subtitulo ? '4px' : '8px',
            color: cores.titulo,
          }}
        >
          {titulo}
        </h2>
      )}
      {subtitulo && (
        <p style={{ fontSize: '11px', color: cores.suave, marginBottom: '8px' }}>
          {subtitulo}
        </p>
      )}
      {children}
    </section>
  );
}
