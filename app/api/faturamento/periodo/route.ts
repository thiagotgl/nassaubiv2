// app/api/faturamento/periodo/route.ts
//
// Endpoint em lote para o Dashboard Operacional: dado um período (inicio/fim),
// retorna o faturamento de "hoje" + mês a mês (faturamento e despesas) do
// intervalo em UMA resposta. Meses futuros não geram chamada ao Biodata.
// Meses já fechados são cacheados por 24h; mês corrente e "hoje", por 10 min.
// O período é limitado a 24 meses por segurança.
import { NextResponse } from 'next/server';

const BASE_BIODATA =
  'https://apis.biodataweb.net/ImagemCor544/biodata/dashboard/grafico';

const COOKIE = 'ASP.NET_SessionId=SEU_SESSION_ID; .ASPXAUTH=SEU_TOKEN_AQUI';

const REVALIDATE_FECHADO = 60 * 60 * 24; // 24h
const REVALIDATE_CORRENTE = 10 * 60; // 10 min

const LIMITE_MESES = 24;

const NOMES_MESES = [
  'jan', 'fev', 'mar', 'abr', 'mai', 'jun',
  'jul', 'ago', 'set', 'out', 'nov', 'dez',
];

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

function isDataValida(iso: string | null): boolean {
  return Boolean(iso && /^\d{4}-\d{2}-\d{2}$/.test(iso) && !isNaN(new Date(`${iso}T00:00:00`).getTime()));
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
  const inicioParam = searchParams.get('inicio');
  const fimParam = searchParams.get('fim');

  if (!isDataValida(inicioParam) || !isDataValida(fimParam)) {
    return NextResponse.json(
      { error: 'Parâmetros obrigatórios: inicio e fim no formato AAAA-MM-DD.' },
      { status: 400 }
    );
  }

  const [anoI, mesI, diaI] = inicioParam!.split('-').map(Number);
  const [anoF, mesF, diaF] = fimParam!.split('-').map(Number);

  if (new Date(anoF, mesF - 1, diaF) < new Date(anoI, mesI - 1, diaI)) {
    return NextResponse.json(
      { error: 'A data final deve ser igual ou posterior à data inicial.' },
      { status: 400 }
    );
  }

  const agora = new Date();
  const avisos: string[] = [];

  // ---- Hoje (independente do período) ----
  const hojeISO = agora.toISOString().slice(0, 10);
  const hojeJson = await buscarPeriodo(
    hojeISO,
    hojeISO,
    'spBISomaTotaisRecebidos',
    REVALIDATE_CORRENTE
  );
  if (!hojeJson) avisos.push('Faturamento de hoje indisponível.');
  const hojeValor = extrairValorFaturamento(hojeJson);

  // ---- Lista de meses entre inicio e fim ----
  type MesAlvo = { nome: string; inicio: string; fim: string; futuro: boolean; fechado: boolean };
  const meses: MesAlvo[] = [];
  let ano = anoI;
  let mes = mesI - 1;

  while (ano < anoF || (ano === anoF && mes <= mesF - 1)) {
    if (meses.length >= LIMITE_MESES) {
      avisos.push(`Período limitado aos primeiros ${LIMITE_MESES} meses.`);
      break;
    }

    const primeiroDia = new Date(ano, mes, 1);
    const ultimoDia = new Date(ano, mes + 1, 0);

    meses.push({
      nome: `${NOMES_MESES[mes]} ${ano}`,
      inicio: primeiroDia.toISOString().slice(0, 10),
      fim: ultimoDia.toISOString().slice(0, 10),
      futuro: ano > agora.getFullYear() || (ano === agora.getFullYear() && mes > agora.getMonth()),
      fechado: ano < agora.getFullYear() || (ano === agora.getFullYear() && mes < agora.getMonth()),
    });

    mes += 1;
    if (mes > 11) {
      mes = 0;
      ano += 1;
    }
  }

  const resultados = await Promise.all(
    meses.map(async (m) => {
      if (m.futuro) {
        return { nome: m.nome, valorFat: 0, valorDesp: 0 };
      }

      const revalidate = m.fechado ? REVALIDATE_FECHADO : REVALIDATE_CORRENTE;

      const [fat, desp] = await Promise.all([
        buscarPeriodo(m.inicio, m.fim, 'spBISomaTotaisRecebidos', revalidate),
        buscarPeriodo(m.inicio, m.fim, 'spBITotalDespesas', revalidate),
      ]);

      if (!fat) avisos.push(`Faturamento de ${m.nome} indisponível.`);
      if (!desp) avisos.push(`Despesas de ${m.nome} indisponíveis.`);

      return {
        nome: m.nome,
        valorFat: extrairValorFaturamento(fat),
        valorDesp: extrairValorDespesa(desp),
      };
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
    inicio: inicioParam,
    fim: fimParam,
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
