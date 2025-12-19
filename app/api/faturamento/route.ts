// app/api/faturamento/route.ts
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const inicio = searchParams.get('inicio') || '2025-11-18';
  const fim = searchParams.get('fim') || inicio;

  const cookie = "ASP.NET_SessionId=SEU_SESSION_ID; .ASPXAUTH=SEU_TOKEN_AQUI";

  const url = `https://apis.biodataweb.net/ImagemCor544/biodata/dashboard/grafico?target_url=null&procedure=spBIFaturamentoTotal&parametros=@DATAINICIO,@DATAFIM,@UNIDADE&valores=${inicio},${fim},_,&idSAC=544`;

  try {
    const res = await fetch(url, {
      headers: {
        'Cookie': cookie,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': 'application/json, text/plain, */*',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Erro na API Biodata', status: res.status },
        { status: 500 }
      );
    }

    const data = await res.json();
    const valorStr = data[0]?.ValorTotal || "0";
    const valorNum = parseFloat(valorStr.replace(/\./g, '').replace(',', '.'));

    return NextResponse.json({
      faturamento: valorNum.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      valor_bruto: valorNum,
      periodo: `${inicio} → ${fim}`,
      origem: 'Biodata spBIFaturamentoTotal'
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: 'Falha ao conectar com Biodata', message: error.message },
      { status: 500 }
    );
  }
}

