// app/api/faturamento/ano/route.ts
//
// Endpoint em lote para o Dashboard Operacional: retorna o faturamento de
// "hoje" + os 12 meses do ano (faturamento e despesas) em UMA resposta.
// Meses futuros não geram chamada ao Biodata. Meses já fechados são cacheados
// por 24h; mês corrente e "hoje", por 10 minutos.
import { NextResponse } from 'next/server';

const BASE_BIODATA =
  'https://apis.biodataweb.net/ImagemCor544/biodata/dashboard/grafico';

const COOKIE = 'ASP.NET_SessionId=SEU_SESSION_ID; .ASPXAUTH=SEU_TOKEN_AQUI';

const REVALIDATE_FECHADO = 60 * 60 * 24; // 24h
const REVALIDATE_CORRENTE = 10 * 60; // 10 min

function parseBRLToNumber(texto: string | null | undefined): number {
  if (!texto) return 0;
  const limpo = texto.replace(/[^\d,.-]/g, '');
  const normalizado = limpo.replace(/\./g, '').replace(',', '.');
  const n = Number(normalizado);
  return Number.isFinite(n) ? n : 0;
}

function formatarBRL(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

async function buscarPeriodo(
  inicio: string,
  fim: string,
  procedure: string,
  revalidate: number
): Promise<any[] | null> {
  const url =
    `${BASE_BIODATA}?target_url=null` +
    `&procedure=${procedure}` +
    '&parametros=%40DATAINICIO,%40DATAFIM,%40UNIDADE' +
    `&valores=${inicio},${fim},_` +
    '&idSAC=544';

  try {
    const res = await fetch(url, {
      headers: {
        Cookie: COOKIE,
        'User-Agent': 'Mozilla/5.0',
        Accept: 'application/json, text/plain, */*',
      },
      next: { revalidate },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function extrairValorFaturamento(json: any): number {
  const bruto =
    json?.[0]?.TotalGeral ??
    json?.[0]?.ValorTotal ??
    json?.[0]?.Valor ??
    json?.[0]?.['R$'] ??
    null;
  return parseBRLToNumber(bruto == null ? null : String(bruto));
}

function extrairValorDespesa(json: any): number {
  const texto = json?.[0]?.['R$'] ?? null;
  return texto == null ? 0 : parseBRLToNumber(String(texto));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const agora = new Date();
  const anoParam = Number(searchParams.get('ano'));
  const ano = Number.isFinite(anoParam) && anoParam > 1900 ? anoParam : agora.getFullYear();

  const avisos: string[] = [];

  // ---- Hoje ----
  const hojeISO = agora.toISOString().slice(0, 10);
  const hojeJson = await buscarPeriodo(
    hojeISO,
    hojeISO,
    'spBISomaTotaisRecebidos',
    REVALIDATE_CORRENTE
  );
  if (!hojeJson) avisos.push('Faturamento de hoje indisponível.');
  const hojeValor = extrairValorFaturamento(hojeJson);

  // ---- 12 meses do ano ----
  const nomesMeses = [
    'jan', 'fev', 'mar', 'abr', 'mai', 'jun',
    'jul', 'ago', 'set', 'out', 'nov', 'dez',
  ];
  const mesCorrente = agora.getMonth();
  const anoCorrente = agora.getFullYear();

  const resultados = await Promise.all(
    Array.from({ length: 12 }, (_, i) => {
      const inicio = new Date(ano, i, 1).toISOString().slice(0, 10);
      const fim = new Date(ano, i + 1, 0).toISOString().slice(0, 10);

      const futuro = ano > anoCorrente || (ano === anoCorrente && i > mesCorrente);
      const fechado = ano < anoCorrente || (ano === anoCorrente && i < mesCorrente);
      const revalidate = futuro ? 0 : fechado ? REVALIDATE_FECHADO : REVALIDATE_CORRENTE;
      const nome = `${nomesMeses[i]} ${ano}`;

      if (futuro) {
        return { nome, valorFat: 0, valorDesp: 0 };
      }

      return Promise.all([
        buscarPeriodo(inicio, fim, 'spBISomaTotaisRecebidos', revalidate),
        buscarPeriodo(inicio, fim, 'spBITotalDespesas', revalidate),
      ]).then(([fat, desp]) => {
        if (!fat) avisos.push(`Faturamento de ${nome} indisponível.`);
        if (!desp) avisos.push(`Despesas de ${nome} indisponíveis.`);
        return {
          nome,
          valorFat: extrairValorFaturamento(fat),
          valorDesp: extrairValorDespesa(desp),
        };
      });
    })
  );

  const mensal = resultados.map((r) => ({
    mes: r.nome,
    valor: r.valorFat,
    valorFormatado: formatarBRL(r.valorFat),
  }));

  const mensalDespesas = resultados.map((r) => ({
    mes: r.nome,
    valor: r.valorDesp,
    valorFormatado: formatarBRL(r.valorDesp),
  }));

  return NextResponse.json({
    ano,
    hoje: {
      faturamento: formatarBRL(hojeValor),
      valor_bruto: hojeValor,
      periodo: `${hojeISO} → ${hojeISO}`,
      origem: 'Biodata spBISomaTotaisRecebidos',
    },
    mensal,
    mensalDespesas,
    avisos,
    gerado_em: new Date().toISOString(),
  });
}
