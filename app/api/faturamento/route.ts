// app/api/faturamento/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const inicio = searchParams.get('inicio') || '2025-11-18';
  const fim = searchParams.get('fim') || '2025-11-18';

  // COLE AQUI SEU COOKIE DO POSTMAN (o que funcionou)
  const cookie = "ASP.NET_SessionId=SEU_SESSION; .ASPXAUTH=SEU_TOKEN_AQUI";

  const url = `https://apis.biodataweb.net/ImagemCor544/biodata/dashboard/grafico?target_url=null&procedure=spBIFaturamentoTotalValorCard&parametros=@DATAINICIO,@DATAFIM,@UNIDADE&valores=${inicio},${fim},_,&idSAC=544`;

  const res = await fetch(url, {
    headers: {
      'Cookie': cookie,
      'User-Agent': 'Mozilla/5.0'
    }
  });

  const data = await res.json();
  const valor = data[0]?.ValorTotal?.replace('.', '').replace(',', '.') || '0';
  
  return NextResponse.json({ 
    faturamento: Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
    valor_bruto: Number(valor)
  });
}
