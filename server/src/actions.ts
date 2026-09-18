import { defineAction, z, type ActionsModule, type Ctx } from "@hatch/space-sdk";
import { and, desc, eq } from "drizzle-orm";
import * as schema from "./schema";
import { getHistorical } from "./yahoo-finance";
import { authenticateToken, loginAccount, registerAccount, revokeAuthSession } from "./auth";
import { privileged } from "@space/privileged";

const CATALOG = [
  ["FUNO11","FUNO11.MX","Fibra Uno","Diversificado","funo.png"],
  ["FIBRAPL14","FIBRAPL14.MX","Fibra Prologis","Industrial","fibrapl.png"],
  ["FIBRAUP18","FIBRAUP18.MX","Fibra Upsite","Industrial","upsite.png"],
  ["FIBRAMQ12","FIBRAMQ12.MX","Fibra Macquarie","Industrial","fibramq.png"],
  ["DANHOS13","DANHOS13.MX","Fibra Danhos","Comercial","danhos.png"],
  ["FSHOP13","FSHOP13.MX","Fibra Shop","Comercial","fshop.png"],
  ["FINN13","FINN13.MX","Fibra Inn","Hotelero","finn.png"],
  ["FIHO12","FIHO12.MX","Fibra Hotel","Hotelero","fiho.png"],
  ["FMTY14","FMTY14.MX","Fibra Monterrey","Diversificado","fmty.png"],
  ["FPLUS16","FPLUS16.MX","Fibra Plus","Diversificado","fplus.png"],
  ["FNOVA17","FNOVA17.MX","Fibra Nova","Industrial","fnova.png"],
  ["FHIPO14","FHIPO14.MX","FHipo","Hipotecario","fhipo.png"],
  ["EDUCA18","EDUCA18.MX","Fibra Educa","Educativo","educa.png"],
  ["STORAGE18","STORAGE18.MX","Fibra Storage","Almacenaje","storage.png"],
  ["FCFE18","FCFE18.MX","Fibra CFE","Energía","fcfe.png"],
  ["FMX23","FMX23.MX","FIBRAeMX","Infraestructura","fmx23.png"],
] as const;

const REFERENCE_DATA: Record<string, {
  referencePrice: number;
  lastDistribution: string;
  lastPaymentDate: string;
  distributed12m: string;
  annualYield: string;
  paymentFrequency: string;
  referenceSource: string;
  distributionNote: string | null;
}> = {
  FUNO11: { referencePrice:29.77, lastDistribution:"$0.6398 por CBFI", lastPaymentDate:"Pago aprox. 10–11 ago 2026", distributed12m:"$2.5348 por CBFI", annualYield:"≈8.5%", paymentFrequency:"Trimestral", referenceSource:"twelvedata, avisos BMV, TradingView", distributionNote:null },
  FIBRAPL14: { referencePrice:75.74, lastDistribution:"$0.7314 en efectivo por CBFI", lastPaymentDate:"Pago 4 ago 2026", distributed12m:"$2.8256 en efectivo por CBFI", annualYield:"3.7% en efectivo", paymentFrequency:"Trimestral", referenceSource:"PR Newswire, Morningstar", distributionNote:"Parte del resultado fiscal anual se distribuye en CBFIs adicionales, lo que diluye. El yield mostrado considera únicamente efectivo." },
  FIBRAUP18: { referencePrice:36.00, lastDistribution:"USD$0.55 por CBFI", lastPaymentDate:"Pago 29 dic 2025", distributed12m:"USD$0.55 pagado por CBFI", annualYield:"No recurrente", paymentFrequency:"Irregular", referenceSource:"BMV eventos relevantes, fibra-upsite.com, Finnhub", distributionNote:"Pago único en su historia; no es un yield recurrente." },
  FIBRAMQ12: { referencePrice:43.55, lastDistribution:"$0.2042 mensual por CBFI", lastPaymentDate:"Pago aprox. 7 ago 2026", distributed12m:"≈$2.45 por CBFI", annualYield:"≈5.6%", paymentFrequency:"Mensual", referenceSource:"Morningstar, Business Wire, Finnhub", distributionNote:"Cambió de frecuencia trimestral a mensual en julio de 2026." },
  DANHOS13: { referencePrice:29.24, lastDistribution:"$0.45 por CBFI", lastPaymentDate:"Pago 13 ago 2026", distributed12m:"$1.80 por CBFI", annualYield:"≈6.2%", paymentFrequency:"Trimestral", referenceSource:"IR fibradanhos.com.mx, avisos BMV", distributionNote:"Cada pago se divide entre resultado fiscal y reembolso de capital." },
  FSHOP13: { referencePrice:11.87, lastDistribution:"$0.2040 por CBFI", lastPaymentDate:"Pago 5 ago 2026, según BolsApp", distributed12m:"$0.5494+ verificado por CBFI", annualYield:"≈4.6%+", paymentFrequency:"Trimestral", referenceSource:"reportes trimestrales BMV, Inbursa, BolsApp", distributionNote:null },
  FINN13: { referencePrice:4.70, lastDistribution:"$0.09 por CBFI", lastPaymentDate:"Pagadera a más tardar 31 ago 2026", distributed12m:"$0.3603 por CBFI", annualYield:"≈7.7%", paymentFrequency:"Trimestral", referenceSource:"fibrainn.mx IR, BMV", distributionNote:"Distribución declarada como 100% reembolso de capital." },
  FIHO12: { referencePrice:7.60, lastDistribution:"$0.1555 por CBFI", lastPaymentDate:"Pago 3 ago 2026", distributed12m:"$0.611 por CBFI", annualYield:"≈8.0%", paymentFrequency:"Trimestral", referenceSource:"reportes trimestrales BMV, axisnegocios", distributionNote:"Distribución declarada como 100% retorno de capital." },
  FMTY14: { referencePrice:14.09, lastDistribution:"$0.07592 por CBFI", lastPaymentDate:"Pago 31 jul 2026", distributed12m:"≈$1.14 por CBFI", annualYield:"≈8.1%", paymentFrequency:"Mensual", referenceSource:"Finnhub, BMV", distributionNote:null },
  FPLUS16: { referencePrice:5.01, lastDistribution:"$0.0863 por CBFI", lastPaymentDate:"Pago 21 abr 2023", distributed12m:"$0.00", annualYield:"0%", paymentFrequency:"Suspendida", referenceSource:"reportes trimestrales BMV", distributionNote:"Única distribución en su historia. No es una FIBRA de ingreso y no se presenta como tal." },
  FNOVA17: { referencePrice:39.98, lastDistribution:"$0.6216 por CBFI", lastPaymentDate:"Pago 30 abr 2026", distributed12m:"$2.4260 por CBFI", annualYield:"≈6.1%", paymentFrequency:"Trimestral", referenceSource:"Grupo Bafar, Actinver", distributionNote:"Distribución declarada como 100% reembolso de capital, sin retención de ISR." },
  FHIPO14: { referencePrice:14.20, lastDistribution:"$0.3491 por CBFI", lastPaymentDate:"Pago 21 may 2026", distributed12m:"$1.0259 por CBFI", annualYield:"≈7.2%", paymentFrequency:"Trimestral", referenceSource:"stockanalysis.com, Finnhub", distributionNote:null },
  EDUCA18: { referencePrice:52.00, lastDistribution:"$0.6514 por CBFI", lastPaymentDate:"Pago 26 ago 2026", distributed12m:"$2.5899 por CBFI", annualYield:"≈5.0%", paymentFrequency:"Trimestral", referenceSource:"axisnegocios, reportes trimestrales Fibra Educa", distributionNote:null },
  STORAGE18: { referencePrice:25.49, lastDistribution:"$0.9052 por CBFI", lastPaymentDate:"Pago 13 mar 2026", distributed12m:"$0.9052 por CBFI", annualYield:"≈3.6%", paymentFrequency:"Anual", referenceSource:"axisnegocios, reporte 1T26 fibrastorage.com", distributionNote:"Un solo pago anual en marzo." },
  FCFE18: { referencePrice:24.95, lastDistribution:"$0.61883 por CBFI", lastPaymentDate:"Pago 30 jun 2026", distributed12m:"≈$2.72 por CBFI", annualYield:"≈10.9%", paymentFrequency:"Trimestral", referenceSource:"CFECapital vía BMV, Bloomberg Línea, TradingView", distributionNote:"FIBRA E; la Serie A tiene prelación." },
  FMX23: { referencePrice:34.03, lastDistribution:"—", lastPaymentDate:"Monto mensual no verificado en BIVA", distributed12m:"—", annualYield:"ESTIMADO ≈6.8–7.4% (no verificado)", paymentFrequency:"Mensual", referenceSource:"Finnhub, presentación GBM, notas Scotiabank", distributionNote:"Monto mensual no verificado en BIVA." },
};

type OperationalMetric = {
  value: string;
  percent: number | null;
  detail: string | null;
  source: string;
  date: string;
};

type OperationsSnapshot = {
  occupancy: OperationalMetric;
  properties: OperationalMetric;
};

const OPERATIONS_DATA: Record<string, OperationsSnapshot> = {
  FUNO11: {
    occupancy: { value:"95.7% (2T26)", percent:95.7, detail:null, source:"reporte 2T26 vía BMV", date:"29-jul-2026" },
    properties: { value:"599 propiedades en total (2T26)", percent:null, detail:"620 por segmento, nota 11 del reporte.", source:"reporte 2T26 vía BMV", date:"29-jul-2026" },
  },
  FIBRAPL14: {
    occupancy: { value:"95.8% fin de periodo (2T26)", percent:95.8, detail:"96.1% promedio.", source:"PR Newswire / reporte BMV 2T26", date:"24-jul-2026" },
    properties: { value:"515 propiedades (2T26)", percent:null, detail:null, source:"PR Newswire / reporte BMV 2T26", date:"24-jul-2026" },
  },
  FIBRAMQ12: {
    occupancy: { value:"92.5% EOP consolidada (2T26)", percent:92.5, detail:"93.4% promedio.", source:"earnings release oficial fibramacquarie.com 2T26", date:"2T26" },
    properties: { value:"263 propiedades (2T26)", percent:null, detail:"246 industriales + 17 comerciales.", source:"earnings release oficial fibramacquarie.com 2T26", date:"2T26" },
  },
  DANHOS13: {
    occupancy: { value:"89.2% totales (2T26)", percent:89.2, detail:"92.0% mismas propiedades.", source:"fibradanhos.com.mx · reporte 2T26", date:"2T26" },
    properties: { value:"24 propiedades (2T26)", percent:null, detail:"15 comerciales + 6 oficinas + 3 industriales.", source:"fibradanhos.com.mx · reporte 2T26", date:"2T26" },
  },
  FSHOP13: {
    occupancy: { value:"94.88% consolidada (2T26)", percent:94.88, detail:"96.92% portafolio estabilizado.", source:"reporte 2T26 vía BMV", date:"2T26" },
    properties: { value:"19 en operación (2T26)", percent:null, detail:null, source:"reporte 2T26 vía BMV", date:"2T26" },
  },
  FINN13: {
    occupancy: { value:"58.7% (2T26)", percent:58.7, detail:null, source:"fibrainn.mx · reporte 2T26", date:"24-jul-2026" },
    properties: { value:"31 hoteles / 34 propiedades (2T26)", percent:null, detail:"5,431 cuartos.", source:"fibrainn.mx · reporte 2T26", date:"24-jul-2026" },
  },
  FIHO12: {
    occupancy: { value:"58.3% portafolio total (2T26)", percent:58.3, detail:null, source:"reporte 2T26 vía BMV", date:"15-jul-2026" },
    properties: { value:"84 hoteles (2T26)", percent:null, detail:"12,300 cuartos en operación.", source:"reporte 2T26 vía BMV", date:"15-jul-2026" },
  },
  FMTY14: {
    occupancy: { value:"93.9% ABR consolidado (2T26)", percent:93.9, detail:"Mty 95.9%; MQ 92.5%.", source:"investorcloud Fibra Mty · reporte 2T26", date:"2T26" },
    properties: { value:"383 propiedades (2T26)", percent:null, detail:"120 + 263 de Fibra Macquarie; consolidado tras la OPA del 29-may-2026.", source:"investorcloud Fibra Mty · reporte 2T26", date:"2T26" },
  },
  FPLUS16: {
    occupancy: { value:"93.31% portafolio en operación (2T26)", percent:93.31, detail:null, source:"reporte 2T26 vía BMV", date:"2T26" },
    properties: { value:"54 proyectos (2T26)", percent:null, detail:null, source:"reporte 2T26 vía BMV", date:"2T26" },
  },
  FNOVA17: {
    occupancy: { value:"99.0% (2T26)", percent:99, detail:null, source:"Grupo Bafar investorcloud · reporte 2T26", date:"2T26" },
    properties: { value:"127 propiedades (2T26)", percent:null, detail:null, source:"Grupo Bafar investorcloud · reporte 2T26", date:"2T26" },
  },
  FHIPO14: {
    occupancy: { value:"no aplica (2T26)", percent:null, detail:"Es fibra hipotecaria: cartera de créditos, no inmuebles.", source:"clasificación del instrumento", date:"2T26" },
    properties: { value:"no aplica (2T26)", percent:null, detail:"Es fibra hipotecaria: cartera de créditos, no inmuebles.", source:"clasificación del instrumento", date:"2T26" },
  },
  EDUCA18: {
    occupancy: { value:"100% (2T26)", percent:100, detail:null, source:"investorcloud FibraEDUCA · reporte 2T26", date:"2T26" },
    properties: { value:"78 propiedades (2T26)", percent:null, detail:"ABR 632,655 m².", source:"investorcloud FibraEDUCA · reporte 2T26", date:"2T26" },
  },
  STORAGE18: {
    occupancy: { value:"84.8% (2T26)", percent:84.8, detail:null, source:"fibrastorage.com · One-Pager 2T26", date:"2T26" },
    properties: { value:"44 propias + 18 de terceros (2T26)", percent:null, detail:"Propias: 36 operando + 5 en desarrollo + 3 terrenos.", source:"fibrastorage.com · One-Pager 2T26", date:"2T26" },
  },
  FCFE18: {
    occupancy: { value:"no aplica (2T26)", percent:null, detail:"Es FIBRA E de infraestructura eléctrica: no inmuebles.", source:"clasificación del instrumento", date:"2T26" },
    properties: { value:"no aplica (2T26)", percent:null, detail:"Es FIBRA E de infraestructura eléctrica: no inmuebles.", source:"clasificación del instrumento", date:"2T26" },
  },
  FIBRAUP18: {
    occupancy: { value:"100% (2T26)", percent:100, detail:null, source:"reporte 2T26 vía Actinver", date:"2T26" },
    properties: { value:"10 propiedades industriales (2T26)", percent:null, detail:null, source:"reporte 2T26 vía Actinver", date:"2T26" },
  },
  FMX23: {
    occupancy: { value:"no aplica (2T26)", percent:null, detail:"Es FIBRA de infraestructura: no inmuebles.", source:"clasificación del instrumento", date:"2T26" },
    properties: { value:"no aplica (2T26)", percent:null, detail:"Es FIBRA de infraestructura: no inmuebles.", source:"clasificación del instrumento", date:"2T26" },
  },
};

const REFERENCE_YIELD: Record<string, number | null> = {
  FUNO11:8.5, FIBRAPL14:3.7, FIBRAUP18:null, FIBRAMQ12:5.6,
  DANHOS13:6.2, FSHOP13:4.6, FINN13:7.7, FIHO12:8.0,
  FMTY14:8.1, FPLUS16:0, FNOVA17:6.1, FHIPO14:7.2,
  EDUCA18:5.0, STORAGE18:3.6, FCFE18:10.9, FMX23:7.1,
};

const marketItem = z.object({
  ticker:z.string(), yahooTicker:z.string(), name:z.string(), fullName:z.string(), sector:z.string(), icon:z.string(), logo:z.string(), exchange:z.enum(["BMV","BIVA"]), delisted:z.boolean(),
  price:z.number().nullable(), currency:z.string().nullable(), change:z.number().nullable(), changePercent:z.number().nullable(), high:z.number().nullable(), low:z.number().nullable(), week52High:z.number().nullable(), week52Low:z.number().nullable(), marketStatus:z.string().nullable(), asOf:z.string().nullable(), sourceUrl:z.string().nullable(), quoteState:z.enum(["live","cached","unavailable"]),
  action:z.string().nullable(), yield:z.number().nullable(), score:z.number().nullable(), ffo:z.number().nullable(), saTafeState:z.enum(["ok","missing","unavailable"]),
  referencePrice:z.number(), lastDistribution:z.string(), lastPaymentDate:z.string(), distributed12m:z.string(), annualYield:z.string(), paymentFrequency:z.string(), referenceSource:z.string(), distributionNote:z.string().nullable(), referenceDate:z.literal("17-sep-2026"),
  occupancy:z.object({value:z.string(),percent:z.number().nullable(),detail:z.string().nullable(),source:z.string(),date:z.string()}),
  properties:z.object({value:z.string(),percent:z.number().nullable(),detail:z.string().nullable(),source:z.string(),date:z.string()}),
  history:z.array(z.object({date:z.string().nullable(),close:z.number().nullable()})),
});
const marketResponse = z.object({ items:z.array(marketItem), fetchedAt:z.string(), warning:z.string().nullable() });
type MarketItem = z.infer<typeof marketItem>;

const ratioFundamentalShape=z.object({
  ticker:z.string(),
  latestDistribution:z.number().nullable(),
  distributionCurrency:z.enum(["MXN","USD"]),
  distributionPeriod:z.string(),
  paymentFrequency:z.string(),
  annualizedDistribution:z.number().nullable(),
  quarterlyAffoPerCbfi:z.number().nullable(),
  quality:z.enum(["verified","unverified","no_distributions","single_payment"]),
  note:z.string().nullable(),
  fiscalNote:z.string().nullable(),
  fundamentalsAsOf:z.string(),
  updatedAt:z.string(),
});
const ratiosResponse=z.object({items:z.array(ratioFundamentalShape)});

const saTafeRunShape = z.object({
  runDate: z.string(),
  priceCutoff: z.string(),
  horizonWeeks: z.number(),
  payloadJson: z.string(),
});

const QUOTE_CACHE_MS=5*60*1000;

function parseCachedMarket(payload:string):Partial<MarketItem>{
  try{return JSON.parse(payload) as Partial<MarketItem>;}catch{return {};}
}

async function loadMarket(ctx: Ctx): Promise<z.infer<typeof marketResponse>> {
  const db=ctx.db<typeof schema>();
  const cachedRows=await db.select().from(schema.quoteCache);
  const cacheByTicker=new Map(cachedRows.map(row=>[row.ticker,row]));
  let staleCount=0;
  let unavailableCount=0;
  const now=Date.now();

  const items=await Promise.all(CATALOG.map(async([ticker,yahooTicker,name,sector,logo]):Promise<MarketItem>=>{
    const reference=REFERENCE_DATA[ticker];
    if(!reference)throw new Error(`Falta información de referencia para ${ticker}.`);
    const operations=OPERATIONS_DATA[ticker];
    if(!operations)throw new Error(`Falta la ficha operativa para ${ticker}.`);
    const cachedRow=cacheByTicker.get(ticker);
    const prior=cachedRow?parseCachedMarket(cachedRow.payload):{};
    const priorHistory=Array.isArray(prior.history)?prior.history.filter(point=>typeof point?.date==="string"&&(typeof point.close==="number"||point.close===null)).slice(-30):[];
    const base:MarketItem={
      ticker,yahooTicker,name,fullName:name,sector,icon:"",logo,
      exchange:ticker==="FMX23"?"BIVA":"BMV",delisted:false,
      price:null,currency:"MXN",change:null,changePercent:null,high:null,low:null,week52High:null,week52Low:null,
      marketStatus:null,asOf:null,sourceUrl:null,quoteState:"unavailable",
      action:null,yield:REFERENCE_YIELD[ticker]??null,score:null,ffo:null,saTafeState:"unavailable",
      ...reference,...operations,referenceDate:"17-sep-2026",history:priorHistory,
    };
    const cacheIsFresh=Boolean(cachedRow&&now-cachedRow.asOf.getTime()<QUOTE_CACHE_MS&&typeof prior.price==="number"&&typeof prior.asOf==="string");
    if(cacheIsFresh){
      return {...base,...prior,quoteState:"live",history:priorHistory};
    }
    try{
      const response=await ctx.tool.finance_ticker(yahooTicker,{interval:"1d",timeout_secs:25});
      const instrument=response.content.instrument;
      if(!instrument||typeof instrument.price!=="number")throw new Error("La fuente no devolvió una cotización.");
      const history=(instrument.history?.points??[])
        .filter(point=>typeof point.date==="string"&&typeof point.close==="number")
        .map(point=>({date:point.date,close:point.close}))
        .slice(-30);
      const firstSource=response.content.sources[0];
      const live:MarketItem={
        ...base,
        price:instrument.price,
        currency:instrument.currency??"MXN",
        change:instrument.change??null,
        changePercent:instrument.change_percent??null,
        high:instrument.high??null,
        low:instrument.low??null,
        week52High:instrument.week_52_high??null,
        week52Low:instrument.week_52_low??null,
        marketStatus:instrument.market_status??null,
        asOf:instrument.as_of??new Date(now).toISOString(),
        sourceUrl:instrument.url??firstSource?.url??null,
        quoteState:"live",
        history:history.length>1?history:priorHistory,
      };
      await db.insert(schema.quoteCache).values({ticker,payload:JSON.stringify(live),asOf:new Date(live.asOf??now)}).onConflictDoUpdate({target:schema.quoteCache.ticker,set:{payload:JSON.stringify(live),asOf:new Date(live.asOf??now)}});
      return live;
    }catch{
      if(typeof prior.price==="number"&&typeof prior.asOf==="string"){
        staleCount+=1;
        return {...base,...prior,quoteState:"cached",history:priorHistory};
      }
      unavailableCount+=1;
      return base;
    }
  }));

  const warnings:string[]=[];
  if(staleCount>0)warnings.push(`${staleCount} ${staleCount===1?"cotización usa":"cotizaciones usan"} el último dato disponible.`);
  if(unavailableCount>0)warnings.push(`${unavailableCount} ${unavailableCount===1?"cotización no está disponible":"cotizaciones no están disponibles"}; se muestra la referencia fechada.`);
  return {items,fetchedAt:new Date(now).toISOString(),warning:warnings.length?warnings.join(" "):null};
}

const videoShape=z.object({id:z.number(),title:z.string(),url:z.string(),provider:z.enum(["youtube","vimeo"]),videoId:z.string(),ticker:z.string(),category:z.enum(["Guía","Fichas","Análisis","Noticias"]),description:z.string().nullable(),createdAt:z.string(),canManage:z.boolean()});
const reportShape=z.object({id:z.number(),title:z.string(),ticker:z.string(),year:z.number(),period:z.enum(["Anual","T1","T2","T3","T4"]),fileName:z.string(),sizeBytes:z.number(),downloadUrl:z.string(),createdAt:z.string(),canManage:z.boolean(),origin:z.enum(["uploaded","official"]),collection:z.enum(["propio","vigente","historico"]),sourceName:z.string(),isPdf:z.boolean()});
type ReportItem=z.infer<typeof reportShape>;

const EXTERNAL_REPORTS:ReportItem[]=[
  {id:-1,title:"Reporte de resultados 2T26",ticker:"FUNO11",year:2026,period:"T2",fileName:"FUNO11-2T26.pdf",sizeBytes:0,downloadUrl:"https://www.bmv.com.mx/docs-pub/eventfid/eventfid_1577920_1401_1.pdf",createdAt:"2026-09-17T00:00:00.000Z",canManage:false,origin:"official",collection:"vigente",sourceName:"Bolsa Mexicana de Valores",isPdf:true},
  {id:-2,title:"Reporte de resultados 2T26",ticker:"FSHOP13",year:2026,period:"T2",fileName:"FSHOP13-2T26.pdf",sizeBytes:0,downloadUrl:"https://www.bmv.com.mx/docs-pub/eventfid/eventfid_1575897_f6206_1.pdf",createdAt:"2026-09-17T00:00:00.000Z",canManage:false,origin:"official",collection:"vigente",sourceName:"Bolsa Mexicana de Valores",isPdf:true},
  {id:-3,title:"Resultados financieros 2T26",ticker:"FIBRAPL14",year:2026,period:"T2",fileName:"FIBRAPL14-2T26",sizeBytes:0,downloadUrl:"https://www.prnewswire.com/news-releases/fibra-prologis-anuncia-sus-resultados-financieros-del-segundo-trimestre-de-2026-869554637.html",createdAt:"2026-09-17T00:00:00.000Z",canManage:false,origin:"official",collection:"vigente",sourceName:"Fibra Prologis vía PR Newswire",isPdf:false},
  {id:-4,title:"Reporte de resultados 2T26",ticker:"FINN13",year:2026,period:"T2",fileName:"FINN13-2T26.pdf",sizeBytes:0,downloadUrl:"https://fibrainn.mx/storage/docs/fibra-inn-anuncia-resultados-del-segundo-trimestre-2026.pdf",createdAt:"2026-09-17T00:00:00.000Z",canManage:false,origin:"official",collection:"vigente",sourceName:"Fibra Inn",isPdf:true},
  {id:-5,title:"Reporte trimestral 2T26",ticker:"FMTY14",year:2026,period:"T2",fileName:"FMTY14-2T26.pdf",sizeBytes:0,downloadUrl:"https://cdn.investorcloud.net/fibramty/InformacionFinanciera/ReportesTrimestrales/Reportes/2026-2T26-Reporte-en.pdf",createdAt:"2026-09-17T00:00:00.000Z",canManage:false,origin:"official",collection:"vigente",sourceName:"Fibra Mty",isPdf:true},
  {id:-6,title:"Reporte trimestral 2T26",ticker:"DANHOS13",year:2026,period:"T2",fileName:"DANHOS13-2T26.pdf",sizeBytes:0,downloadUrl:"https://fibradanhos.com.mx/reportes-trimestrales/pdf/2026/2t26/2T 2026 Español.pdf",createdAt:"2026-09-17T00:00:00.000Z",canManage:false,origin:"official",collection:"vigente",sourceName:"Fibra Danhos",isPdf:true},
  {id:-7,title:"Earnings release 2T26",ticker:"FIBRAMQ12",year:2026,period:"T2",fileName:"FIBRAMQ12-2T26.pdf",sizeBytes:0,downloadUrl:"https://www.fibramacquarie.com/assets/fibra/docs/events-and-presentations/2026/fibra-mq-mx-2q26-earnings-release-eng.pdf",createdAt:"2026-09-17T00:00:00.000Z",canManage:false,origin:"official",collection:"vigente",sourceName:"Fibra Macquarie",isPdf:true},
  {id:-8,title:"Reporte de resultados 2T26",ticker:"FNOVA17",year:2026,period:"T2",fileName:"FNOVA17-2T26.pdf",sizeBytes:0,downloadUrl:"https://investorcloud.s3.us-east-1.amazonaws.com/GrupoBAFAR/ReportesTrimestrales/PR-2026-2T26.pdf",createdAt:"2026-09-17T00:00:00.000Z",canManage:false,origin:"official",collection:"vigente",sourceName:"Grupo Bafar",isPdf:true},
  {id:-9,title:"Reporte trimestral 2T26",ticker:"FIBRAUP18",year:2026,period:"T2",fileName:"FIBRAUP18-2T26",sizeBytes:0,downloadUrl:"https://actinver.com/documents/d/actinver/fibraup-18-2t-2026",createdAt:"2026-09-17T00:00:00.000Z",canManage:false,origin:"official",collection:"vigente",sourceName:"Actinver",isPdf:false},
  {id:-10,title:"Reporte trimestral 2T26",ticker:"EDUCA18",year:2026,period:"T2",fileName:"EDUCA18-2T26.pdf",sizeBytes:0,downloadUrl:"https://investorcloud.s3.amazonaws.com/FibraEDUCA/InformacionFinanciera/ReportesTrimestrales/2026_2T26.pdf",createdAt:"2026-09-17T00:00:00.000Z",canManage:false,origin:"official",collection:"vigente",sourceName:"Fibra Educa",isPdf:true},
  {id:-11,title:"Reporte trimestral 2T26",ticker:"FPLUS16",year:2026,period:"T2",fileName:"FPLUS16-2T26.pdf",sizeBytes:0,downloadUrl:"http://cdn.investorcloud.net/fibraplus/InformacionFinanciera/ReportesTrimestrales/2026-2T26-BMV.pdf",createdAt:"2026-09-17T00:00:00.000Z",canManage:false,origin:"official",collection:"vigente",sourceName:"Fibra Plus",isPdf:true},
  {id:-12,title:"One Pager 2T26",ticker:"STORAGE18",year:2026,period:"T2",fileName:"STORAGE18-One-Pager-2T26.pdf",sizeBytes:0,downloadUrl:"https://fibrastorage.com/wp-content/uploads/2026/08/One-Pager-2T26.pdf",createdAt:"2026-09-17T00:00:00.000Z",canManage:false,origin:"official",collection:"vigente",sourceName:"Fibra Storage",isPdf:true},
  {id:-13,title:"Reporte de resultados 2T26",ticker:"FIHO12",year:2026,period:"T2",fileName:"FIHO12-2T26.pdf",sizeBytes:0,downloadUrl:"https://www.bmv.com.mx/docs-pub/eventfid/eventfid_1574632_1596_1.pdf",createdAt:"2026-09-17T00:00:00.000Z",canManage:false,origin:"official",collection:"vigente",sourceName:"Bolsa Mexicana de Valores",isPdf:true},
  {id:-14,title:"Reporte 1T21",ticker:"FIHO12",year:2021,period:"T1",fileName:"FIHOTEL-Press-Release-1Q-2021-ESP-vF.pdf",sizeBytes:0,downloadUrl:"https://amefibra.com/wp-content/uploads/2021/05/FIHOTEL-Press-Release-1Q-2021-ESP-vF.pdf",createdAt:"2021-05-01T00:00:00.000Z",canManage:false,origin:"official",collection:"historico",sourceName:"AMEFIBRA",isPdf:true},
  {id:-15,title:"Reporte financiero 1T21",ticker:"STORAGE18",year:2021,period:"T1",fileName:"Reporte_Fin_1Q_2021_FIBRA_Storage.pdf",sizeBytes:0,downloadUrl:"https://amefibra.com/wp-content/uploads/2021/05/Reporte_Fin_1Q_2021_FIBRA_Storage.pdf",createdAt:"2021-05-01T00:00:00.000Z",canManage:false,origin:"official",collection:"historico",sourceName:"AMEFIBRA",isPdf:true},
  {id:-16,title:"Reporte 4T20",ticker:"STORAGE18",year:2020,period:"T4",fileName:"FIBRA-Storage_4T20.pdf",sizeBytes:0,downloadUrl:"https://amefibra.com/wp-content/uploads/2021/05/FIBRA-Storage_4T20.pdf",createdAt:"2021-05-01T00:00:00.000Z",canManage:false,origin:"official",collection:"historico",sourceName:"AMEFIBRA",isPdf:true},
  {id:-17,title:"Reporte 2T20",ticker:"STORAGE18",year:2020,period:"T2",fileName:"FIBRA-Storage_2T20.pdf",sizeBytes:0,downloadUrl:"https://amefibra.com/wp-content/uploads/2021/05/FIBRA-Storage_2T20.pdf",createdAt:"2021-05-01T00:00:00.000Z",canManage:false,origin:"official",collection:"historico",sourceName:"AMEFIBRA",isPdf:true},
  {id:-18,title:"Reporte 1T20",ticker:"STORAGE18",year:2020,period:"T1",fileName:"FIBRA-Storage_1T20.pdf",sizeBytes:0,downloadUrl:"https://amefibra.com/wp-content/uploads/2021/05/FIBRA-Storage_1T20.pdf",createdAt:"2021-05-01T00:00:00.000Z",canManage:false,origin:"official",collection:"historico",sourceName:"AMEFIBRA",isPdf:true},
  {id:-19,title:"Reporte 3T20",ticker:"FNOVA17",year:2020,period:"T3",fileName:"FNOVA-3T20.pdf",sizeBytes:0,downloadUrl:"https://amefibra.com/wp-content/uploads/2021/05/FNOVA-3T20.pdf",createdAt:"2021-05-01T00:00:00.000Z",canManage:false,origin:"official",collection:"historico",sourceName:"AMEFIBRA",isPdf:true},
  {id:-20,title:"Reporte 1T21",ticker:"FNOVA17",year:2021,period:"T1",fileName:"Press-Release-FNova-1T2021-Final.pdf",sizeBytes:0,downloadUrl:"https://amefibra.com/wp-content/uploads/2021/05/Press-Release-FNova-1T2021-Final.pdf",createdAt:"2021-05-01T00:00:00.000Z",canManage:false,origin:"official",collection:"historico",sourceName:"AMEFIBRA",isPdf:true},
  {id:-21,title:"Reporte 2T20",ticker:"DANHOS13",year:2020,period:"T2",fileName:"Fibra-Danhos-2T20.pdf",sizeBytes:0,downloadUrl:"https://amefibra.com/wp-content/uploads/2021/05/Fibra-Danhos-2T20.pdf",createdAt:"2021-05-01T00:00:00.000Z",canManage:false,origin:"official",collection:"historico",sourceName:"AMEFIBRA",isPdf:true},
  {id:-22,title:"Reporte 1T21",ticker:"FMTY14",year:2021,period:"T1",fileName:"FMY2021-1T21-Reporte-.pdf",sizeBytes:0,downloadUrl:"https://amefibra.com/wp-content/uploads/2021/05/FMY2021-1T21-Reporte-.pdf",createdAt:"2021-05-01T00:00:00.000Z",canManage:false,origin:"official",collection:"historico",sourceName:"AMEFIBRA",isPdf:true},
  {id:-23,title:"Informe trimestral 1T21",ticker:"EDUCA18",year:2021,period:"T1",fileName:"Fibra-Educainforme-trimestral-1T2021.pdf",sizeBytes:0,downloadUrl:"https://amefibra.com/wp-content/uploads/2021/05/Fibra-Educainforme-trimestral-1T2021.pdf",createdAt:"2021-05-01T00:00:00.000Z",canManage:false,origin:"official",collection:"historico",sourceName:"AMEFIBRA",isPdf:true},
  {id:-24,title:"Resultados 1T21",ticker:"FSHOP13",year:2021,period:"T1",fileName:"Resultados-T1-2021.pdf",sizeBytes:0,downloadUrl:"https://amefibra.com/wp-content/uploads/2021/05/Resultados-T1-2021.pdf",createdAt:"2021-05-01T00:00:00.000Z",canManage:false,origin:"official",collection:"historico",sourceName:"AMEFIBRA",isPdf:true},
  {id:-25,title:"Resultados financieros 4T20",ticker:"FIBRAPL14",year:2020,period:"T4",fileName:"FIBRAPL14-4T20.pdf",sizeBytes:0,downloadUrl:"https://amefibra.com/wp-content/uploads/2021/05/2021-01-27_FIBRA_Prologis_Anuncia_sus_Resultados_Financieros__342.pdf",createdAt:"2021-01-27T00:00:00.000Z",canManage:false,origin:"official",collection:"historico",sourceName:"AMEFIBRA",isPdf:true},
];
function parseVideoUrl(raw:string): {provider:"youtube"|"vimeo";videoId:string}|null { try{const u=new URL(raw); if(["youtube.com","www.youtube.com","youtu.be","www.youtu.be"].includes(u.hostname)){const id=u.hostname.includes("youtu.be")?u.pathname.slice(1):u.searchParams.get("v")??(u.pathname.startsWith("/shorts/")?u.pathname.split("/")[2]:u.pathname.startsWith("/embed/")?u.pathname.split("/")[2]:null); return id&&/^[\w-]{6,20}$/.test(id)?{provider:"youtube",videoId:id}:null;} if(["vimeo.com","www.vimeo.com","player.vimeo.com"].includes(u.hostname)){const id=u.pathname.split("/").filter(Boolean).pop(); return id&&/^\d+$/.test(id)?{provider:"vimeo",videoId:id}:null;} return null;}catch{return null;} }
function decodeBase64(value:string):Uint8Array { const raw=atob(value); return Uint8Array.from(raw,c=>c.charCodeAt(0)); }
const VALID_TICKERS=new Set(CATALOG.map(x=>x[0]));
function assertTicker(ticker:string){if(!VALID_TICKERS.has(ticker as typeof CATALOG[number][0]))throw new Error("La FIBRA seleccionada no existe en el catálogo.");}
function assertSession(sessionId:string){if(!/^[a-zA-Z0-9-]{8,80}$/.test(sessionId))throw new Error("Sesión no válida.");}

const accountUserShape=z.object({id:z.string(),email:z.string().email(),displayName:z.string(),role:z.enum(["admin","user"])});
const authSuccessShape=z.object({user:accountUserShape,token:z.string(),expiresAt:z.string()});
const portfolioOperationShape=z.object({id:z.number(),ticker:z.string(),kind:z.enum(["buy","sell","distribution"]),quantity:z.number().nullable(),pricePerCbfi:z.number().nullable(),amount:z.number().nullable(),operationDate:z.string(),note:z.string().nullable(),createdAt:z.string()});
const positionPreferenceShape=z.object({ticker:z.string(),manualPrice:z.number().nullable(),targetPercent:z.number()});
const goalContributionShape=z.object({id:z.number(),amount:z.number(),contributionDate:z.string(),note:z.string().nullable(),createdAt:z.string()});
const investmentGoalShape=z.object({id:z.number(),name:z.string(),targetAmount:z.number(),createdAt:z.string(),contributions:z.array(goalContributionShape)});
const portfolioTrackerResponse=z.object({operations:z.array(portfolioOperationShape),preferences:z.array(positionPreferenceShape),deviationThreshold:z.number(),goals:z.array(investmentGoalShape)});

function assertDate(value:string){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(value)||Number.isNaN(new Date(`${value}T00:00:00`).getTime()))throw new Error("La fecha no es válida.");
}

export const Actions={
  registerAccount:defineAction({
    request:z.object({email:z.string().email().max(254),displayName:z.string().trim().min(2).max(80),password:z.string().min(10).max(128)}),
    response:authSuccessShape,
    privileged:[privileged.hashPassword],
    async handler(ctx,args):Promise<z.infer<typeof authSuccessShape>>{
      const result=await registerAccount(ctx,args);
      ctx.invalidateQueries();
      return {user:result.user,token:result.token,expiresAt:result.expiresAt.toISOString()};
    },
  }),
  bootstrapAdminAccount:defineAction({
    request:z.object({email:z.string().email().max(254),displayName:z.string().trim().min(2).max(80),password:z.string().min(10).max(128)}),
    response:authSuccessShape,
    privileged:[privileged.hashPassword],
    async handler(ctx,args):Promise<z.infer<typeof authSuccessShape>>{
      if(!ctx.viewer?.isOwner)throw new Error("Solo el dueño del artefacto puede crear la cuenta administradora inicial.");
      const existingAdmin=(await ctx.db<typeof schema>().select({id:schema.users.id}).from(schema.users).where(eq(schema.users.role,"admin")).limit(1))[0];
      if(existingAdmin)throw new Error("La cuenta administradora inicial ya fue creada.");
      const result=await registerAccount(ctx,args,"admin");
      ctx.invalidateQueries();
      return {user:result.user,token:result.token,expiresAt:result.expiresAt.toISOString()};
    },
  }),
  setAccountRole:defineAction({
    request:z.object({token:z.string(),userId:z.string(),role:z.enum(["admin","user"])}),
    response:z.object({ok:z.literal(true)}),
    async handler(ctx,args):Promise<{ok:true}>{
      const actingUser=await authenticateToken(ctx,args.token);
      if(!actingUser||actingUser.role!=="admin")throw new Error("Se requiere una cuenta administradora.");
      if(actingUser.id===args.userId&&args.role!=="admin")throw new Error("No puedes quitarte tu propio rol de administrador.");
      const db=ctx.db<typeof schema>();
      const target=(await db.select({id:schema.users.id}).from(schema.users).where(eq(schema.users.id,args.userId)).limit(1))[0];
      if(!target)throw new Error("La cuenta no existe.");
      await db.update(schema.users).set({role:args.role,updatedAt:new Date()}).where(eq(schema.users.id,args.userId));
      ctx.invalidateQueries();
      return {ok:true};
    },
  }),
  loginAccount:defineAction({
    request:z.object({email:z.string().email().max(254),password:z.string().min(1).max(128)}),
    response:authSuccessShape,
    privileged:[privileged.hashPassword,privileged.verifyPassword],
    async handler(ctx,args):Promise<z.infer<typeof authSuccessShape>>{
      const result=await loginAccount(ctx,args);
      return {user:result.user,token:result.token,expiresAt:result.expiresAt.toISOString()};
    },
  }),
  getAuthSession:defineAction({
    request:z.object({token:z.string()}),
    response:z.object({user:accountUserShape.nullable()}),
    async handler(ctx,args){return {user:await authenticateToken(ctx,args.token)};},
  }),
  logoutAccount:defineAction({
    request:z.object({token:z.string()}),
    response:z.object({ok:z.literal(true)}),
    async handler(ctx,args):Promise<{ok:true}>{await revokeAuthSession(ctx,args.token);return {ok:true};},
  }),
  claimAnonymousWorkspace:defineAction({
    request:z.object({token:z.string(),anonymousSessionId:z.string()}),
    response:z.object({ok:z.literal(true)}),
    async handler(ctx,args):Promise<{ok:true}>{
      assertSession(args.anonymousSessionId);
      const user=await authenticateToken(ctx,args.token);
      if(!user)throw new Error("La sesión de la cuenta no es válida o expiró.");
      const db=ctx.db<typeof schema>();
      const accountSessionId=`user:${user.id}`;
      const [anonymousFavorites,accountFavorites]=await Promise.all([
        db.select().from(schema.favorites).where(eq(schema.favorites.sessionId,args.anonymousSessionId)),
        db.select().from(schema.favorites).where(eq(schema.favorites.sessionId,accountSessionId)),
      ]);
      const existingTickers=new Set(accountFavorites.map(row=>row.ticker));
      for(const favorite of anonymousFavorites){
        if(existingTickers.has(favorite.ticker))await db.delete(schema.favorites).where(eq(schema.favorites.id,favorite.id));
        else await db.update(schema.favorites).set({sessionId:accountSessionId}).where(eq(schema.favorites.id,favorite.id));
      }
      await db.update(schema.alerts).set({sessionId:accountSessionId}).where(eq(schema.alerts.sessionId,args.anonymousSessionId));
      await db.update(schema.portfolio).set({sessionId:accountSessionId}).where(eq(schema.portfolio.sessionId,args.anonymousSessionId));
      await db.update(schema.portfolioOperations).set({sessionId:accountSessionId}).where(eq(schema.portfolioOperations.sessionId,args.anonymousSessionId));
      await db.update(schema.investmentGoals).set({sessionId:accountSessionId}).where(eq(schema.investmentGoals.sessionId,args.anonymousSessionId));
      const anonymousPreferences=await db.select().from(schema.portfolioPositionPreferences).where(eq(schema.portfolioPositionPreferences.sessionId,args.anonymousSessionId));
      for(const preference of anonymousPreferences){
        await db.insert(schema.portfolioPositionPreferences).values({sessionId:accountSessionId,ticker:preference.ticker,manualPrice:preference.manualPrice,targetPercent:preference.targetPercent,updatedAt:new Date()}).onConflictDoUpdate({target:[schema.portfolioPositionPreferences.sessionId,schema.portfolioPositionPreferences.ticker],set:{manualPrice:preference.manualPrice,targetPercent:preference.targetPercent,updatedAt:new Date()}});
      }
      await db.delete(schema.portfolioPositionPreferences).where(eq(schema.portfolioPositionPreferences.sessionId,args.anonymousSessionId));
      const anonymousSettings=(await db.select().from(schema.portfolioSettings).where(eq(schema.portfolioSettings.sessionId,args.anonymousSessionId)).limit(1))[0];
      if(anonymousSettings){
        await db.insert(schema.portfolioSettings).values({sessionId:accountSessionId,deviationThreshold:anonymousSettings.deviationThreshold,updatedAt:new Date()}).onConflictDoUpdate({target:schema.portfolioSettings.sessionId,set:{deviationThreshold:anonymousSettings.deviationThreshold,updatedAt:new Date()}});
        await db.delete(schema.portfolioSettings).where(eq(schema.portfolioSettings.sessionId,args.anonymousSessionId));
      }
      ctx.invalidateQueries();
      return {ok:true};
    },
  }),
  getMarketData:defineAction({request:z.object({}),response:marketResponse,handler:async(ctx):Promise<z.infer<typeof marketResponse>>=>loadMarket(ctx)}),
  getLiveRatios:defineAction({request:z.object({}),response:ratiosResponse,async handler(ctx):Promise<z.infer<typeof ratiosResponse>>{const rows=await ctx.db<typeof schema>().select().from(schema.fibraDistributions);return{items:rows.map(row=>({...row,updatedAt:row.updatedAt.toISOString()}))};}}),
  getSaTafeLatest: defineAction({
    request: z.object({}),
    response: z.object({ run: saTafeRunShape.nullable() }),
    async handler(ctx) {
      const rows = await ctx.db<typeof schema>().select().from(schema.saTafeRuns)
        .orderBy(desc(schema.saTafeRuns.runDate)).limit(1);
      const row = rows[0];
      return { run: row ? {
        runDate: row.runDate,
        priceCutoff: row.priceCutoff,
        horizonWeeks: row.horizonWeeks,
        payloadJson: row.payloadJson,
      } : null };
    },
  }),
  saveSaTafeRun: defineAction({
    request: z.object({
      runDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      priceCutoff: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      horizonWeeks: z.number().int().positive().max(104),
      payloadJson: z.string().min(100),
    }),
    response: z.object({ ok: z.literal(true), id: z.number() }),
    async handler(ctx, args): Promise<{ ok: true; id: number }> {
      let payload: unknown;
      try { payload = JSON.parse(args.payloadJson); }
      catch { throw new Error("payloadJson no es JSON válido."); }
      const p = payload as { tickers?: unknown; portfolio?: unknown };
      if (!Array.isArray(p.tickers) || typeof p.portfolio !== "object" || p.portfolio === null) {
        throw new Error("El JSON no tiene la estructura SA-TAFE esperada (tickers[], portfolio).");
      }
      const db = ctx.db<typeof schema>();
      const row = (await db.insert(schema.saTafeRuns)
        .values({ runDate: args.runDate, priceCutoff: args.priceCutoff, horizonWeeks: args.horizonWeeks, payloadJson: args.payloadJson, createdAt: new Date() })
        .onConflictDoUpdate({
          target: schema.saTafeRuns.runDate,
          set: { priceCutoff: args.priceCutoff, horizonWeeks: args.horizonWeeks, payloadJson: args.payloadJson, createdAt: new Date() },
        })
        .returning({ id: schema.saTafeRuns.id }))[0];
      if (!row) throw new Error("No se pudo guardar la corrida SA-TAFE.");
      ctx.invalidateQueries();
      return { ok: true, id: row.id };
    },
  }),
  listVideos:defineAction({request:z.object({ticker:z.string().optional(),category:z.enum(["Guía","Fichas","Análisis","Noticias"]).optional(),sessionId:z.string().optional()}),response:z.object({videos:z.array(videoShape)}),async handler(ctx,args){const db=ctx.db<typeof schema>();let rows=await db.select().from(schema.videos).orderBy(desc(schema.videos.createdAt));if(args.ticker)rows=rows.filter(r=>r.ticker===args.ticker);if(args.category)rows=rows.filter(r=>r.category===args.category);return{videos:rows.map(r=>({id:r.id,title:r.title,url:r.url,provider:r.provider,videoId:r.videoId,ticker:r.ticker,category:r.category,description:r.description,createdAt:r.createdAt.toISOString(),canManage:Boolean(args.sessionId&&r.sessionId===args.sessionId)}))};}}),
  publishVideo:defineAction({request:z.object({title:z.string().min(2).max(160),url:z.string().url(),ticker:z.string(),category:z.enum(["Guía","Fichas","Análisis","Noticias"]),description:z.string().max(500).optional(),thumbnailUrl:z.string().url().optional(),sessionId:z.string()}),response:z.object({ok:z.literal(true),id:z.number()}),async handler(ctx,args):Promise<{ok:true;id:number}>{assertTicker(args.ticker);assertSession(args.sessionId);const parsed=parseVideoUrl(args.url);if(!parsed)throw new Error("Usa un enlace válido de YouTube o Vimeo.");const db=ctx.db<typeof schema>();const row=(await db.insert(schema.videos).values({...args,...parsed}).returning({id:schema.videos.id}))[0];if(!row)throw new Error("No se pudo publicar el video.");ctx.invalidateQueries();return{ok:true,id:row.id};}}),
  listReports:defineAction({request:z.object({ticker:z.string().optional(),sessionId:z.string().optional()}),response:z.object({reports:z.array(reportShape)}),async handler(ctx,args):Promise<{reports:ReportItem[]}>{const db=ctx.db<typeof schema>();let rows=await db.select().from(schema.reports).orderBy(desc(schema.reports.year),desc(schema.reports.createdAt));if(args.ticker)rows=rows.filter(r=>r.ticker===args.ticker);const uploaded:ReportItem[]=await Promise.all(rows.map(async r=>({id:r.id,title:r.title,ticker:r.ticker,year:r.year,period:r.period,fileName:r.fileName,sizeBytes:r.sizeBytes,downloadUrl:await ctx.blobs.getUrl(r.blobKey,{expiresInSeconds:3600}),createdAt:r.createdAt.toISOString(),canManage:Boolean(args.sessionId&&r.sessionId===args.sessionId),origin:"uploaded",collection:"propio",sourceName:"Publicado por el administrador",isPdf:true})));const official=EXTERNAL_REPORTS.filter(report=>!args.ticker||report.ticker===args.ticker);return{reports:[...uploaded,...official]};}}),
  publishReport:defineAction({request:z.object({title:z.string().min(2).max(160),ticker:z.string(),sessionId:z.string(),year:z.number().int().min(2011).max(2100),period:z.enum(["Anual","T1","T2","T3","T4"]),fileName:z.string(),base64:z.string().min(10).max(14000000)}),response:z.object({ok:z.literal(true),id:z.number()}),async handler(ctx,args):Promise<{ok:true;id:number}>{assertTicker(args.ticker);assertSession(args.sessionId);const existing=await ctx.db<typeof schema>().select().from(schema.reports).where(and(eq(schema.reports.ticker,args.ticker),eq(schema.reports.year,args.year),eq(schema.reports.period,args.period))).limit(1);if(existing.length)throw new Error("Ya existe un reporte para esa FIBRA, año y periodo.");if(!args.fileName.toLowerCase().endsWith(".pdf"))throw new Error("El archivo debe ser PDF.");const bytes=decodeBase64(args.base64);if(bytes.length>10_000_000)throw new Error("El PDF supera 10 MB.");if(new TextDecoder().decode(bytes.slice(0,4))!=="%PDF")throw new Error("El archivo no parece ser un PDF válido.");const key=`reports/${crypto.randomUUID()}.pdf`;await ctx.blobs.put(key,bytes,{contentType:"application/pdf"});const db=ctx.db<typeof schema>();const row=(await db.insert(schema.reports).values({title:args.title,ticker:args.ticker,year:args.year,period:args.period,blobKey:key,fileName:args.fileName,sizeBytes:bytes.length}).returning({id:schema.reports.id}))[0];if(!row)throw new Error("No se pudo guardar el reporte.");ctx.invalidateQueries();return{ok:true,id:row.id};}}),
  getWorkspace:defineAction({request:z.object({sessionId:z.string()}),response:z.object({favorites:z.array(z.string()),alerts:z.array(z.object({id:z.number(),ticker:z.string(),targetPrice:z.number(),direction:z.enum(["above","below"])})),portfolio:z.array(z.object({id:z.number(),ticker:z.string(),quantity:z.number(),averageCost:z.number()}))}),async handler(ctx,args){assertSession(args.sessionId);const db=ctx.db<typeof schema>();const [f,a,p]=await Promise.all([db.select().from(schema.favorites).where(eq(schema.favorites.sessionId,args.sessionId)),db.select().from(schema.alerts).where(eq(schema.alerts.sessionId,args.sessionId)),db.select().from(schema.portfolio).where(eq(schema.portfolio.sessionId,args.sessionId))]);return{favorites:f.map(x=>x.ticker),alerts:a.map(x=>({id:x.id,ticker:x.ticker,targetPrice:x.targetPrice,direction:x.direction})),portfolio:p.map(x=>({id:x.id,ticker:x.ticker,quantity:x.quantity,averageCost:x.averageCost}))};}}),
  getPortfolioTracker:defineAction({request:z.object({sessionId:z.string()}),response:portfolioTrackerResponse,async handler(ctx,args):Promise<z.infer<typeof portfolioTrackerResponse>>{assertSession(args.sessionId);const db=ctx.db<typeof schema>();const [operations,preferences,settings,goals,contributions]=await Promise.all([db.select().from(schema.portfolioOperations).where(eq(schema.portfolioOperations.sessionId,args.sessionId)).orderBy(desc(schema.portfolioOperations.operationDate),desc(schema.portfolioOperations.id)),db.select().from(schema.portfolioPositionPreferences).where(eq(schema.portfolioPositionPreferences.sessionId,args.sessionId)),db.select().from(schema.portfolioSettings).where(eq(schema.portfolioSettings.sessionId,args.sessionId)).limit(1),db.select().from(schema.investmentGoals).where(eq(schema.investmentGoals.sessionId,args.sessionId)).orderBy(desc(schema.investmentGoals.createdAt)),db.select().from(schema.goalContributions).orderBy(desc(schema.goalContributions.contributionDate),desc(schema.goalContributions.id))]);return{operations:operations.map(row=>({...row,createdAt:row.createdAt.toISOString()})),preferences:preferences.map(row=>({ticker:row.ticker,manualPrice:row.manualPrice,targetPercent:row.targetPercent})),deviationThreshold:settings[0]?.deviationThreshold??5,goals:goals.map(goal=>({id:goal.id,name:goal.name,targetAmount:goal.targetAmount,createdAt:goal.createdAt.toISOString(),contributions:contributions.filter(item=>item.goalId===goal.id).map(item=>({id:item.id,amount:item.amount,contributionDate:item.contributionDate,note:item.note,createdAt:item.createdAt.toISOString()}))}))};}}),
  addPortfolioOperation:defineAction({request:z.object({sessionId:z.string(),ticker:z.string(),kind:z.enum(["buy","sell","distribution"]),quantity:z.number().positive().optional(),pricePerCbfi:z.number().positive().optional(),amount:z.number().positive().optional(),operationDate:z.string(),note:z.string().trim().max(500).optional()}),response:z.object({ok:z.literal(true),id:z.number()}),async handler(ctx,args):Promise<{ok:true;id:number}>{assertSession(args.sessionId);assertTicker(args.ticker);assertDate(args.operationDate);if(args.kind==="distribution"){if(!args.amount)throw new Error("Indica el monto de la distribución.");}else{if(!args.quantity||!args.pricePerCbfi)throw new Error("Indica la cantidad de CBFIs y el precio por CBFI.");if(args.kind==="sell"){const prior=await ctx.db<typeof schema>().select().from(schema.portfolioOperations).where(and(eq(schema.portfolioOperations.sessionId,args.sessionId),eq(schema.portfolioOperations.ticker,args.ticker)));const held=prior.reduce((sum,row)=>sum+(row.kind==="buy"?(row.quantity??0):row.kind==="sell"?-(row.quantity??0):0),0);if(args.quantity>held+0.000001)throw new Error(`No puedes vender más de ${held.toLocaleString("es-MX")} CBFIs disponibles.`);}}const row=(await ctx.db<typeof schema>().insert(schema.portfolioOperations).values({sessionId:args.sessionId,ticker:args.ticker,kind:args.kind,quantity:args.kind==="distribution"?null:args.quantity??null,pricePerCbfi:args.kind==="distribution"?null:args.pricePerCbfi??null,amount:args.kind==="distribution"?args.amount??null:null,operationDate:args.operationDate,note:args.note||null}).returning({id:schema.portfolioOperations.id}))[0];if(!row)throw new Error("No se pudo guardar la operación.");ctx.invalidateQueries();return{ok:true,id:row.id};}}),
  deletePortfolioOperation:defineAction({request:z.object({sessionId:z.string(),id:z.number()}),response:z.object({ok:z.literal(true)}),async handler(ctx,args):Promise<{ok:true}>{assertSession(args.sessionId);const db=ctx.db<typeof schema>();const row=(await db.select().from(schema.portfolioOperations).where(and(eq(schema.portfolioOperations.id,args.id),eq(schema.portfolioOperations.sessionId,args.sessionId))).limit(1))[0];if(!row)throw new Error("La operación no existe.");await db.delete(schema.portfolioOperations).where(eq(schema.portfolioOperations.id,args.id));ctx.invalidateQueries();return{ok:true};}}),
  savePositionPreference:defineAction({request:z.object({sessionId:z.string(),ticker:z.string(),manualPrice:z.number().positive().nullable(),targetPercent:z.number().min(0).max(100)}),response:z.object({ok:z.literal(true)}),async handler(ctx,args):Promise<{ok:true}>{assertSession(args.sessionId);assertTicker(args.ticker);await ctx.db<typeof schema>().insert(schema.portfolioPositionPreferences).values({...args,updatedAt:new Date()}).onConflictDoUpdate({target:[schema.portfolioPositionPreferences.sessionId,schema.portfolioPositionPreferences.ticker],set:{manualPrice:args.manualPrice,targetPercent:args.targetPercent,updatedAt:new Date()}});ctx.invalidateQueries();return{ok:true};}}),
  setPortfolioThreshold:defineAction({request:z.object({sessionId:z.string(),deviationThreshold:z.number().min(0).max(100)}),response:z.object({ok:z.literal(true)}),async handler(ctx,args):Promise<{ok:true}>{assertSession(args.sessionId);await ctx.db<typeof schema>().insert(schema.portfolioSettings).values({...args,updatedAt:new Date()}).onConflictDoUpdate({target:schema.portfolioSettings.sessionId,set:{deviationThreshold:args.deviationThreshold,updatedAt:new Date()}});ctx.invalidateQueries();return{ok:true};}}),
  addInvestmentGoal:defineAction({request:z.object({sessionId:z.string(),name:z.string().trim().min(2).max(120),targetAmount:z.number().positive()}),response:z.object({ok:z.literal(true),id:z.number()}),async handler(ctx,args):Promise<{ok:true;id:number}>{assertSession(args.sessionId);const row=(await ctx.db<typeof schema>().insert(schema.investmentGoals).values(args).returning({id:schema.investmentGoals.id}))[0];if(!row)throw new Error("No se pudo crear la meta.");ctx.invalidateQueries();return{ok:true,id:row.id};}}),
  addGoalContribution:defineAction({request:z.object({sessionId:z.string(),goalId:z.number(),amount:z.number().positive(),contributionDate:z.string(),note:z.string().trim().max(500).optional()}),response:z.object({ok:z.literal(true),id:z.number()}),async handler(ctx,args):Promise<{ok:true;id:number}>{assertSession(args.sessionId);assertDate(args.contributionDate);const db=ctx.db<typeof schema>();const goal=(await db.select().from(schema.investmentGoals).where(and(eq(schema.investmentGoals.id,args.goalId),eq(schema.investmentGoals.sessionId,args.sessionId))).limit(1))[0];if(!goal)throw new Error("La meta no existe.");const row=(await db.insert(schema.goalContributions).values({goalId:args.goalId,amount:args.amount,contributionDate:args.contributionDate,note:args.note||null}).returning({id:schema.goalContributions.id}))[0];if(!row)throw new Error("No se pudo registrar el abono.");ctx.invalidateQueries();return{ok:true,id:row.id};}}),
  deleteGoalContribution:defineAction({request:z.object({sessionId:z.string(),id:z.number()}),response:z.object({ok:z.literal(true)}),async handler(ctx,args):Promise<{ok:true}>{assertSession(args.sessionId);const db=ctx.db<typeof schema>();const contribution=(await db.select({id:schema.goalContributions.id,goalSessionId:schema.investmentGoals.sessionId}).from(schema.goalContributions).innerJoin(schema.investmentGoals,eq(schema.goalContributions.goalId,schema.investmentGoals.id)).where(eq(schema.goalContributions.id,args.id)).limit(1))[0];if(!contribution||contribution.goalSessionId!==args.sessionId)throw new Error("El abono no existe.");await db.delete(schema.goalContributions).where(eq(schema.goalContributions.id,args.id));ctx.invalidateQueries();return{ok:true};}}),
  deleteInvestmentGoal:defineAction({request:z.object({sessionId:z.string(),id:z.number()}),response:z.object({ok:z.literal(true)}),async handler(ctx,args):Promise<{ok:true}>{assertSession(args.sessionId);const db=ctx.db<typeof schema>();const goal=(await db.select().from(schema.investmentGoals).where(and(eq(schema.investmentGoals.id,args.id),eq(schema.investmentGoals.sessionId,args.sessionId))).limit(1))[0];if(!goal)throw new Error("La meta no existe.");await db.delete(schema.investmentGoals).where(eq(schema.investmentGoals.id,args.id));ctx.invalidateQueries();return{ok:true};}}),
  toggleFavorite:defineAction({request:z.object({sessionId:z.string(),ticker:z.string()}),response:z.object({favorite:z.boolean()}),async handler(ctx,args){assertSession(args.sessionId);assertTicker(args.ticker);const db=ctx.db<typeof schema>();const found=(await db.select().from(schema.favorites).where(and(eq(schema.favorites.sessionId,args.sessionId),eq(schema.favorites.ticker,args.ticker))).limit(1))[0];if(found){await db.delete(schema.favorites).where(eq(schema.favorites.id,found.id));ctx.invalidateQueries();return{favorite:false};}await db.insert(schema.favorites).values(args);ctx.invalidateQueries();return{favorite:true};}}),
  getHistory:defineAction({request:z.object({ticker:z.string(),period:z.enum(["30d","90d","1y","5y"])}),response:z.object({history:z.array(z.object({date:z.string(),close:z.number()}))}),async handler(_ctx,args){assertTicker(args.ticker);const row=CATALOG.find(x=>x[0]===args.ticker);if(!row||args.ticker==="SOMA18"||args.ticker==="TERRA13")return{history:[]};return{history:await getHistorical(row[1],args.period)};}}),
  updateVideo:defineAction({request:z.object({id:z.number(),sessionId:z.string(),title:z.string().min(2).max(160),url:z.string().url(),description:z.string().max(500).optional(),thumbnailUrl:z.string().url().optional()}),response:z.object({ok:z.literal(true)}),async handler(ctx,args):Promise<{ok:true}>{assertSession(args.sessionId);const parsed=parseVideoUrl(args.url);if(!parsed)throw new Error("Usa un enlace válido de YouTube o Vimeo.");const db=ctx.db<typeof schema>();const found=(await db.select().from(schema.videos).where(and(eq(schema.videos.id,args.id),eq(schema.videos.sessionId,args.sessionId))).limit(1))[0];if(!found)throw new Error("No puedes editar este video.");await db.update(schema.videos).set({...parsed,url:args.url,title:args.title,description:args.description??null,thumbnailUrl:args.thumbnailUrl??null}).where(eq(schema.videos.id,args.id));ctx.invalidateQueries();return{ok:true};}}),
  deleteVideo:defineAction({request:z.object({id:z.number(),sessionId:z.string()}),response:z.object({ok:z.literal(true)}),async handler(ctx,args):Promise<{ok:true}>{assertSession(args.sessionId);const db=ctx.db<typeof schema>();const found=(await db.select().from(schema.videos).where(and(eq(schema.videos.id,args.id),eq(schema.videos.sessionId,args.sessionId))).limit(1))[0];if(!found)throw new Error("No puedes borrar este video.");await db.delete(schema.videos).where(eq(schema.videos.id,args.id));ctx.invalidateQueries();return{ok:true};}}),
  updateReport:defineAction({request:z.object({id:z.number(),sessionId:z.string(),title:z.string().min(2).max(160),year:z.number().int().min(2011).max(2100),period:z.enum(["Anual","T1","T2","T3","T4"])}),response:z.object({ok:z.literal(true)}),async handler(ctx,args):Promise<{ok:true}>{assertSession(args.sessionId);const db=ctx.db<typeof schema>();const found=(await db.select().from(schema.reports).where(and(eq(schema.reports.id,args.id),eq(schema.reports.sessionId,args.sessionId))).limit(1))[0];if(!found)throw new Error("No puedes editar este reporte.");const duplicates=await db.select().from(schema.reports).where(and(eq(schema.reports.ticker,found.ticker),eq(schema.reports.year,args.year),eq(schema.reports.period,args.period)));if(duplicates.some(row=>row.id!==args.id))throw new Error("Ya existe un reporte para esa FIBRA, año y periodo.");await db.update(schema.reports).set({title:args.title,year:args.year,period:args.period}).where(eq(schema.reports.id,args.id));ctx.invalidateQueries();return{ok:true};}}),
  deleteReport:defineAction({request:z.object({id:z.number(),sessionId:z.string()}),response:z.object({ok:z.literal(true)}),async handler(ctx,args):Promise<{ok:true}>{assertSession(args.sessionId);const db=ctx.db<typeof schema>();const found=(await db.select().from(schema.reports).where(and(eq(schema.reports.id,args.id),eq(schema.reports.sessionId,args.sessionId))).limit(1))[0];if(!found)throw new Error("No puedes borrar este reporte.");await db.delete(schema.reports).where(eq(schema.reports.id,args.id));ctx.invalidateQueries();return{ok:true};}}),
  addAlert:defineAction({request:z.object({sessionId:z.string(),ticker:z.string(),targetPrice:z.number().positive(),direction:z.enum(["above","below"])}),response:z.object({ok:z.literal(true)}),async handler(ctx,args):Promise<{ok:true}>{assertSession(args.sessionId);assertTicker(args.ticker);await ctx.db<typeof schema>().insert(schema.alerts).values(args);ctx.invalidateQueries();return{ok:true};}}),
  addPosition:defineAction({request:z.object({sessionId:z.string(),ticker:z.string(),quantity:z.number().positive(),averageCost:z.number().positive()}),response:z.object({ok:z.literal(true)}),async handler(ctx,args):Promise<{ok:true}>{assertSession(args.sessionId);assertTicker(args.ticker);await ctx.db<typeof schema>().insert(schema.portfolio).values(args);ctx.invalidateQueries();return{ok:true};}}),
} satisfies ActionsModule;
