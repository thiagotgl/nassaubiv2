// app/components/ui/tema.ts
//
// Fonte única de verdade visual do projeto (padronização claro corporativo):
// marca azul Nassau nos títulos/detalhes, verde restrito a ações,
// cards brancos sobre fundo cinza claro e paleta única para gráficos.

import type { CSSProperties } from 'react';

export const cores = {
  primaria: '#003087', // azul Nassau — títulos e detalhes de marca
  acao: '#10b981', // verde — botões e item ativo da navegação
  acaoEscura: '#059669',
  fundo: '#f3f4f6',
  card: '#ffffff',
  borda: '#e5e7eb',
  linha: '#f3f4f6', // separadores internos (linhas de tabela)
  titulo: '#0f172a',
  corpo: '#475569',
  suave: '#6b7280',
  erro: '#dc2626',
  desabilitado: '#9ca3af',
  info: {
    fundo: '#eff6ff',
    borda: '#bfdbfe',
    texto: '#1e40af',
  },
};

export const paletaGraficos = {
  azulPrincipal: '#1d4ed8', // faturado / receita principal
  azulLinha: '#60a5fa', // linha de tendência sobre barras azuis
  verdePositivo: '#047857', // líquido / valores positivos
  verdeClaro: '#22c55e',
  laranjaAlerta: '#ea580c', // descontos / despesas
  laranjaClaro: '#fb923c',
  ambar: '#b45309',
  ambarKpi: '#d97706',
  indigo: '#6366f1',
  ceuAzul: '#0ea5e9',
  violeta: '#a855f7',
  teal: '#14b8a6',
  vermelho: '#ef4444',
};

const sombraCard = '0 4px 12px rgba(15, 23, 42, 0.08)';
const fontFamilySistema =
  "-apple-system, BlinkMacSystemFont, system-ui, sans-serif";

export const estilos = {
  // Base tipográfica das páginas. O fundo cinza NÃO vive aqui: quem pinta o
  // fundo é o shell do dashboard (uma única fonte, sem emendas sob o filtro).
  containerPagina: {
    minHeight: '100vh',
    color: cores.titulo,
    fontFamily: fontFamilySistema,
  } as CSSProperties,

  pagina: {
    maxWidth: '1120px',
    margin: '0 auto',
    padding: '32px 16px 40px',
  } as CSSProperties,

  cardSecao: {
    backgroundColor: cores.card,
    borderRadius: '16px',
    padding: '16px 20px',
    boxShadow: sombraCard,
    border: `1px solid ${cores.borda}`,
    marginTop: '24px',
  } as CSSProperties,

  cardKpi: {
    backgroundColor: cores.card,
    borderRadius: '16px',
    padding: '16px 20px',
    boxShadow: sombraCard,
    border: `1px solid ${cores.borda}`,
  } as CSSProperties,

  gradeKpi: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '16px',
  } as CSSProperties,

  alturaGrafico: {
    width: '100%',
    height: 320,
  } as CSSProperties,

  campoData: {
    borderRadius: '8px',
    border: `1px solid #d1d5db`,
    padding: '4px 8px',
    fontSize: '13px',
  } as CSSProperties,

  botaoAcao: (desabilitado = false): CSSProperties => ({
    marginTop: '18px',
    backgroundColor: desabilitado ? cores.desabilitado : cores.acao,
    color: '#ffffff',
    fontWeight: 600,
    fontSize: '13px',
    cursor: desabilitado ? 'default' : 'pointer',
    padding: '6px 14px',
    borderRadius: '9999px',
    border: 'none',
  }),
};
