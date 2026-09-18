import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { SafeAreaTopScrim } from "@hatch/space-sdk/client";
import { api, type ApiResponse } from "./api";
import { SaTafeLabView } from "./SaTafeLab";
import funo from "./assets/logos/display/funo.png";
import fibrapl from "./assets/logos/display/fibrapl.png";
import fibramq from "./assets/logos/display/fibramq.png";
import danhos from "./assets/logos/display/danhos.png";
import fshop from "./assets/logos/display/fshop.png";
import finn from "./assets/logos/display/finn.png";
import fiho from "./assets/logos/display/fiho.png";
import fmty from "./assets/logos/display/fmty.png";
import fplus from "./assets/logos/display/fplus.png";
import fnova from "./assets/logos/display/fnova.png";
import fhipo from "./assets/logos/display/fhipo.png";
import educa from "./assets/logos/display/educa.png";
import storage from "./assets/logos/display/storage.png";
import fcfe from "./assets/logos/display/fcfe.png";
import fmx23 from "./assets/logos/display/fmx23.png";
import upsite from "./assets/logos/display/upsite.png";
import brandMark from "./assets/fibrasmx-mark.png";

type Market=ApiResponse<typeof api,"getMarketData">["items"][number];
type VideoItem=ApiResponse<typeof api,"listVideos">["videos"][number];
type ReportItem=ApiResponse<typeof api,"listReports">["reports"][number];
type RatioFundamental=ApiResponse<typeof api,"getLiveRatios">["items"][number];
type View="mercado"|"ratios"|"pagos"|"videos"|"publicar"|"herramientas"|"portafolio"|"laboratorio"|"perfil";
type Confidence="alta"|"media"|"baja";
type PaymentProjection={ticker:string;name:string;amount:string;confidence:Confidence;status:"confirmado"|"estimado";exDate?:string;paymentDate?:string;note?:string};
type PaymentMonth={key:string;label:string;context?:string;payments:PaymentProjection[]};
const LOGOS:Record<string,string>={"funo.png":funo,"fibrapl.png":fibrapl,"fibramq.png":fibramq,"danhos.png":danhos,"fshop.png":fshop,"finn.png":finn,"fiho.png":fiho,"fmty.png":fmty,"fplus.png":fplus,"fnova.png":fnova,"fhipo.png":fhipo,"educa.png":educa,"storage.png":storage,"fcfe.png":fcfe,"fmx23.png":fmx23,"upsite.png":upsite};
const CATS=["Guía","Fichas","Análisis","Noticias"] as const;
const PERIODS=["Anual","T1","T2","T3","T4"] as const;
const SECTORS=["Todas","Diversificado","Industrial","Comercial","Hotelero","Hipotecario","Educativo","Almacenaje","Energía","Infraestructura"];

const NAMES:Record<string,string>={FMTY14:"Fibra Monterrey",FIBRAMQ12:"Fibra Macquarie",FMX23:"FIBRAeMX",FNOVA17:"Fibra Nova",FCFE18:"Fibra CFE",FUNO11:"Fibra Uno",FIBRAPL14:"Fibra Prologis",DANHOS13:"Fibra Danhos",FSHOP13:"Fibra Shop",FINN13:"Fibra Inn",FIHO12:"Fibra Hotel",FHIPO14:"FHipo",EDUCA18:"Fibra Educa",STORAGE18:"Fibra Storage"};
const payment=(ticker:string,amount:string,confidence:Confidence,note?:string):PaymentProjection=>({ticker,name:NAMES[ticker]??ticker,amount,confidence,status:"estimado",note});
const monthly=():PaymentProjection[]=>[
 payment("FMTY14","$0.07–0.085","media","Distribución mensual esperada"),
 payment("FIBRAMQ12","$0.2042","media","Distribución mensual esperada"),
 payment("FMX23","Monto no verificado","baja","Distribución mensual esperada"),
];
const quarterlies=():PaymentProjection[]=>[
 payment("FUNO11","$0.62–0.68","media"),
 payment("FIBRAPL14","$0.72–0.76","media"),
 payment("DANHOS13","$0.45","alta"),
 payment("FSHOP13","$0.205–0.22","media"),
 payment("FINN13","$0.09","alta"),
 payment("FIHO12","$0.1555","media"),
 payment("FHIPO14","≈$0.35","media"),
 payment("EDUCA18","$0.652–0.66","alta"),
];
const PAYMENT_MONTHS:PaymentMonth[]=[
 {key:"2026-09",label:"Septiembre 2026",payments:[
  {ticker:"FIBRAMQ12",name:NAMES.FIBRAMQ12??"FIBRAMQ12",amount:"$0.2042",status:"confirmado",confidence:"alta",exDate:"17 sep 2026",paymentDate:"18 sep 2026"},
  payment("FMTY14","$0.07–0.085","media","Distribución mensual esperada"),
  payment("FMX23","Monto no verificado","baja","Distribución mensual esperada"),
 ]},
 {key:"2026-10",label:"Octubre 2026",payments:[...monthly(),payment("FNOVA17","≈$0.62","baja"),payment("FCFE18","$0.55–0.75","media")]},
 {key:"2026-11",label:"Noviembre 2026",context:"Mes cargado · pagos del 3T26",payments:[...monthly(),...quarterlies()]},
 {key:"2026-12",label:"Diciembre 2026",payments:[...monthly(),payment("FIBRAPL14","≈$1.90–2.30","media","Posible distribución extraordinaria anual; patrón observado: $2.30 en dic 2025 y $1.92 en feb 2026")]},
 {key:"2027-01",label:"Enero 2027",payments:[...monthly(),payment("FCFE18","$0.55–0.75","media")]},
 {key:"2027-02",label:"Febrero 2027",context:"Mes cargado · pagos del 4T26",payments:[...monthly(),...quarterlies(),payment("FNOVA17","≈$0.62","baja"),payment("FIBRAPL14","≈$1.90–2.30","media","Posible distribución extraordinaria")]},
 {key:"2027-03",label:"Marzo 2027",payments:[...monthly(),payment("STORAGE18","$0.90–1.05","media","Pago anual esperado")]},
 {key:"2027-04",label:"Abril 2027",payments:[...monthly(),payment("FCFE18","$0.55–0.75","media")]},
 {key:"2027-05",label:"Mayo 2027",context:"Mes cargado · pagos del 1T27",payments:[...monthly(),...quarterlies(),payment("FNOVA17","≈$0.62","baja")]},
 {key:"2027-06",label:"Junio 2027",payments:monthly()},
 {key:"2027-07",label:"Julio 2027",payments:[...monthly(),payment("FCFE18","$0.55–0.75","media")]},
 {key:"2027-08",label:"Agosto 2027",context:"Mes cargado · pagos del 2T27",payments:[...monthly(),...quarterlies(),payment("FNOVA17","≈$0.62","baja")]},
 {key:"2027-09",label:"Septiembre 2027",payments:monthly()},
];

type DistributionHistory={
 frequency:string;
 values:Array<number|null>;
 currency:"MXN"|"USD";
 trend:"estable"|"creciendo"|"a la baja"|"volátil"|"—";
 trendDetail?:string;
 predictability:string;
 note:string;
 source:"BolsApp"|"barrido web";
 gapLabel?:string;
 emphasis?:string;
};
const DISTRIBUTION_HISTORY:Record<string,DistributionHistory>={
 FUNO11:{frequency:"Trimestral",values:[0.525,0.551328,0.554953,0.57,0.605,0.67,0.62,0.639779],currency:"MXN",trend:"creciendo",trendDetail:"~+3% por trimestre, con un descenso recuperado",predictability:"Alta",note:"La serie conserva una trayectoria creciente pese al descenso puntual antes del último pago.",source:"BolsApp"},
 FIBRAPL14:{frequency:"Trimestral",values:[0.705053,0.721215,0.73425,0.695794,2.30475,1.924566,0.756568,0.731395],currency:"MXN",trend:"creciendo",trendDetail:"patrón regular + extraordinario",predictability:"Alta",note:"Pago regular de ~$0.72–0.76 cada trimestre, más una distribución extraordinaria anual (~$2.30 en dic-2025 y ~$1.92 en feb-2026). Por el patrón observado, cabe esperar otra extraordinaria entre dic-2026 y feb-2027; todavía no está declarada.",source:"BolsApp",emphasis:"PATRÓN DUAL"},
 FIBRAUP18:{frequency:"Irregular",values:[0.55],currency:"USD",trend:"—",predictability:"No proyectable",note:"Único pago: USD$0.55 el 29-dic-2025. Un solo evento no permite estimar una recurrencia.",source:"BolsApp"},
 FIBRAMQ12:{frequency:"Mensual desde ago-2026",values:[0.525,0.525,0.525,0.6125,0.6125,0.6125,0.6125,0.6125,0.6125,0.2042,0.2042,0.2042],currency:"MXN",trend:"estable",trendDetail:"cambio de frecuencia, no de ritmo",predictability:"Alta",note:"Cambió a pago mensual en ago-2026. El pago de $0.2042 equivale a su trimestral de $0.6125 ÷ 3.",source:"BolsApp",emphasis:"CAMBIO A PAGO MENSUAL"},
 DANHOS13:{frequency:"Trimestral",values:[0.45,0.45,0.45,0.45,0.45,0.45,0.45,0.45],currency:"MXN",trend:"estable",trendDetail:"$0.45 durante 8 trimestres",predictability:"Máxima",note:"La distribución se mantuvo exactamente en $0.45 por CBFI durante los ocho eventos observados.",source:"BolsApp"},
 FSHOP13:{frequency:"Trimestral",values:[0.14911,0.156957,0.164805,0.172653,0.172653,0.180501,0.196197,0.204045],currency:"MXN",trend:"creciendo",trendDetail:"+4–5% por trimestre",predictability:"Muy alta",note:"Serie ascendente con un trimestre sin cambio y aumentos posteriores.",source:"BolsApp"},
 FINN13:{frequency:"Trimestral",values:[0.075001,0.090018,0.090341,0.090058,0.090334,0.090009,0.09,0.09],currency:"MXN",trend:"estable",trendDetail:"alrededor de $0.09",predictability:"Máxima",note:"Los pagos se han estabilizado en $0.09. La distribución es 100% reembolso de capital.",source:"BolsApp"},
 FIHO12:{frequency:"Trimestral",values:[0.1375,0.1375,0.15,0.15,0.15,0.15,0.1555,0.1555],currency:"MXN",trend:"estable",trendDetail:"con escalones al alza",predictability:"Alta",note:"La serie avanzó por escalones y se mantuvo. La distribución es 100% retorno de capital.",source:"BolsApp"},
 FMTY14:{frequency:"Mensual",values:[0.036221,0.085719,0.089173,0.089078,0.088751,0.086304,0.086304,0.086111,0.084112,0.084112,0.084078,0.08163,0.081398,0.048312,null,0.127402,0.075922,0.075922],currency:"MXN",trend:"a la baja",trendDetail:"de ~$0.088 a ~$0.076",predictability:"Media-baja",note:"No hay pagos registrados para abr/may-2026. El pago de $0.127402 en jun-2026 fue un pico extraordinario por el efecto FibraMQ y no es comparable.",source:"BolsApp",gapLabel:"abr/may 2026 · sin pagos"},
 FPLUS16:{frequency:"Suspendida",values:[],currency:"MXN",trend:"—",predictability:"No proyectable",note:"Sin pagos en los últimos 2 años. El último fue de $0.086869 el 21-abr-2023; la distribución está suspendida.",source:"BolsApp"},
 STORAGE18:{frequency:"Anual",values:[0.314549,0.83385,0.905183],currency:"MXN",trend:"creciendo",predictability:"Media",note:"La trayectoria es creciente, pero hay pocos datos porque la frecuencia es anual.",source:"BolsApp"},
 FCFE18:{frequency:"Trimestral",values:[0.845874,0.800598,0.415034,0.734966,0.869884,0.683314,0.546594,0.61883],currency:"MXN",trend:"volátil",trendDetail:"$0.41–0.87 por evento",predictability:"Media",note:"La distribución varía de forma amplia entre eventos; el comportamiento está ligado al activo de energía.",source:"BolsApp"},
 EDUCA18:{frequency:"Trimestral",values:[0.617996,0.630217,0.634109,0.635337,0.640943,0.648016,0.649569,0.651389],currency:"MXN",trend:"creciendo",trendDetail:"~+0.7% por trimestre",predictability:"Muy alta",note:"Los ocho pagos aumentaron de forma suave y consecutiva.",source:"BolsApp"},
 FNOVA17:{frequency:"Trimestral",values:[0.6216],currency:"MXN",trend:"estable",trendDetail:"~$0.62 por trimestre",predictability:"Alta",note:"Último dato verificado: $0.6216, pagado el 30-abr-2026. La distribución es 100% reembolso de capital, sin retención de ISR. El barrido no entregó la serie completa de eventos.",source:"barrido web"},
 FHIPO14:{frequency:"Trimestral",values:[0.3491],currency:"MXN",trend:"a la baja",trendDetail:"2025 frente a 2023–2024",predictability:"Media-baja",note:"Último dato verificado: $0.3491, pagado el 21-may-2026. El barrido no entregó la serie completa de eventos.",source:"barrido web"},
 FMX23:{frequency:"Mensual",values:[],currency:"MXN",trend:"—",predictability:"Sin historial verificado",note:"— · Verifica el reporte oficial antes de proyectar un monto.",source:"BolsApp"},
};
function money(v:number|null,c="MXN"){return v===null?"—":new Intl.NumberFormat("es-MX",{style:"currency",currency:c,maximumFractionDigits:2}).format(v)}
function quotePrice(f:Market){return f.price??f.referencePrice}
function PriceValue({f,className=""}:{f:Market;className?:string}){return <span className={`live-price ${className}`}><span className={`price-dot ${f.quoteState==="unavailable"?"reference":""}`} aria-hidden="true"/><span>{money(quotePrice(f),f.currency??"MXN")}</span></span>}
function quoteTime(f:Market){if(!f.asOf)return `Referencia del ${f.referenceDate}`;const date=new Date(f.asOf);if(Number.isNaN(date.getTime()))return "Última cotización disponible";return `Actualizado ${date.toLocaleDateString("es-MX",{day:"numeric",month:"short"})}, ${date.toLocaleTimeString("es-MX",{hour:"2-digit",minute:"2-digit"})}`}
function quoteTone(f:Market){return (f.changePercent??0)>=0?"text-[var(--good)]":"text-[var(--accent)]"}
function quoteChange(f:Market){if(f.changePercent===null)return f.quoteState==="unavailable"?"Referencia fechada":"Sin variación";const sign=f.changePercent>0?"+":"";return `${sign}${f.changePercent.toFixed(2)}%`}
function sessionId(){let id=localStorage.getItem("fibrasmx-session");if(!id){id=crypto.randomUUID();localStorage.setItem("fibrasmx-session",id)}return id}
function Icon({f,size=80}:{f:Market;size?:number}){const src=LOGOS[f.logo];return src?<span className="grid shrink-0 place-items-center overflow-hidden bg-white" style={{width:size,height:size}}><img src={src} alt={`Logo de ${f.fullName}`} className="block h-full w-full object-contain"/></span>:<div className="grid shrink-0 place-items-center bg-white text-black font-black" style={{width:size,height:size}}>{f.icon||f.ticker.slice(0,3)}</div>}
function Empty({children}:{children:string}){return <div className="border border-dashed hairline p-8 text-center text-sm text-[var(--dim)]">{children}</div>}

export function App(){
 const qc=useQueryClient(); const [view,setView]=useState<View>("mercado"); const [selected,setSelected]=useState<string>("FUNO11"); const sid=useMemo(()=>sessionId(),[]);
 const market=useQuery({queryKey:["market"],queryFn:()=>api.getMarketData({}),staleTime:30000,refetchInterval:view==="ratios"?30000:false,refetchOnWindowFocus:true});
 const workspace=useQuery({queryKey:["workspace",sid],queryFn:()=>api.getWorkspace({sessionId:sid})});
 const openProfile=(ticker:string)=>{setSelected(ticker);setView("perfil");scrollTo({top:0,behavior:"smooth"})};
 const items=market.data?.items??[];
 return <div className="min-h-screen bg-[var(--bg)]"><SafeAreaTopScrim backgroundColor="var(--bg)"/>
  <header className="safe-top sticky top-0 z-30 border-b hairline bg-[#0b0b0cee] backdrop-blur"><div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3"><div className="flex items-center gap-3"><img src={brandMark} alt="" className="h-9 w-9 object-contain"/><div><p className="text-[11px] font-bold tracking-[.18em] text-[var(--accent)]">MERCADO INMOBILIARIO</p><p className="text-xs text-[var(--dim)]">Cotizaciones actualizadas al abrir · BMV y BIVA</p></div></div><button className="btn btn-ghost !min-h-9 !px-3 text-xs" disabled={market.isFetching} onClick={()=>market.refetch()} aria-label="Actualizar precios de mercado">{market.isFetching?"Actualizando…":"Actualizar precios"}</button></div></header>
  <nav aria-label="Secciones" className="border-b hairline bg-[#0c0c0c]"><div className="mobile-nav mx-auto grid max-w-6xl grid-cols-8 gap-1 px-3 py-2">{([['mercado','Mercado'],['ratios','Ratios en vivo'],['laboratorio','Laboratorio'],['pagos','Próximos pagos'],['videos','Videos'],['publicar','Publicar'],['herramientas','Calcular'],['portafolio','Mis FIBRAs']] as [View,string][]).map(([v,l])=><button key={v} className={`min-h-11 border-b-2 px-1 text-xs font-bold ${view===v?'border-[var(--accent)] text-white':'border-transparent text-[var(--dim)]'}`} onClick={()=>setView(v)}>{l}</button>)}</div></nav>
  {items.length>0&&<FiberTicker items={items}/>}
  <main className="mx-auto max-w-6xl px-4 py-6 safe-bottom">
   {market.isPending&&<Empty>Cargando cotizaciones…</Empty>}
   {market.isError&&<div className="panel p-5"><p className="font-bold">No se pudieron cargar las cotizaciones.</p><button className="btn btn-primary mt-4" onClick={()=>market.refetch()}>Reintentar</button></div>}
   {market.data&&view==="mercado"&&<MarketView items={items} favorites={workspace.data?.favorites??[]} onOpen={openProfile} onToggle={ticker=>api.toggleFavorite({sessionId:sid,ticker}).then(()=>qc.invalidateQueries({queryKey:["workspace",sid]}))} warning={market.data.warning}/>} 
   {market.data&&view==="ratios"&&<LiveRatiosView items={items} fetchedAt={market.data.fetchedAt}/>} 
   {view==="laboratorio"&&<SaTafeLabView/>}
   {view==="pagos"&&<UpcomingPaymentsView/>}
   {view==="videos"&&<VideosView items={items}/>} 
   {view==="publicar"&&<PublishView items={items}/>} 
   {view==="herramientas"&&<ToolsView items={items}/>} 
   {view==="portafolio"&&<PortfolioView items={items} sessionId={sid}/>} 
   {view==="perfil"&&<ProfileView ticker={selected} items={items} sessionId={sid} onBack={()=>setView("mercado")} onSelect={openProfile}/>} 
  </main>
 </div>
}

function FiberTicker({items}:{items:Market[]}){return <div className="ticker-wrap border-b hairline" aria-label="Cotizaciones de las FIBRAs"><div className="ticker-track">{[...items,...items].map((f,i)=><span key={`${f.ticker}-${i}`} className="ticker-item"><Icon f={f} size={28}/><b>{f.ticker}</b><PriceValue f={f} className="metric"/><span className={quoteTone(f)}>{quoteChange(f)}</span></span>)}</div></div>}

function MarketView({items,favorites,onOpen,onToggle,warning}:{items:Market[];favorites:string[];onOpen:(t:string)=>void;onToggle:(t:string)=>void;warning:string|null}){
 const [sector,setSector]=useState("Todas");const [quick,setQuick]=useState("Todas");const [q,setQ]=useState("");let shown=items.filter(f=>(sector==="Todas"||f.sector===sector)&&(f.fullName+f.name+f.ticker).toLowerCase().includes(q.toLowerCase()));if(quick==="Pago mensual")shown=shown.filter(f=>f.paymentFrequency==="Mensual");if(quick==="Pago trimestral")shown=shown.filter(f=>f.paymentFrequency==="Trimestral");if(quick==="Mayor yield")shown=[...shown].sort((a,b)=>(b.yield??-999)-(a.yield??-999));
 const leaders=[...items].filter(i=>i.yield!==null).sort((a,b)=>(b.yield??-999)-(a.yield??-999)).slice(0,3);
 return <><section className="grid gap-4 md:grid-cols-[1.35fr_.65fr]"><div><p className="text-xs font-bold text-[var(--accent)]">TABLERO DE MERCADO</p><h1 className="display compact-title mt-2 text-6xl leading-[.9]">Cada FIBRA,<br/>en su propio perfil.</h1><p className="mt-4 max-w-xl text-[var(--dim)]">Cotizaciones actualizadas, distribuciones, videos y reportes reunidos en un solo lugar.</p></div><div className="panel grid grid-cols-3 divide-x divide-[var(--border)] self-end">{leaders.map((f,i)=><button className="p-3 text-left" onClick={()=>onOpen(f.ticker)} key={f.ticker}><p className="text-[10px] text-[var(--dim)]">{i===0?'YIELD MAYOR':'YIELD REF.'}</p><p className="mt-2 text-xs font-bold">{f.ticker}</p><p className="metric mt-1 text-sm font-bold text-white">{f.annualYield}</p></button>)}</div></section>
  {warning&&<p className="mt-4 border-l-2 border-[var(--warn)] pl-3 text-sm text-[var(--dim)]">{warning}</p>}
  <section className="mt-10"><div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between"><div><h2 className="display text-3xl">Explora las FIBRAs</h2><p className="text-sm text-[var(--dim)]">Selecciona una ficha para abrir su perfil.</p></div><input className="input md:max-w-xs" aria-label="Buscar FIBRA" placeholder="Buscar por nombre o ticker" value={q} onChange={e=>setQ(e.target.value)}/></div>
  <div className="mt-4"><p className="mb-2 text-xs text-[var(--dim)]">Filtros rápidos</p><div className="flex flex-wrap gap-2">{["Todas","Mayor yield","Pago mensual","Pago trimestral"].map(x=><button key={x} className={`chip ${quick===x?"on":""}`} onClick={()=>setQuick(x)}>{x}</button>)}</div></div><div className="mt-4 flex flex-wrap gap-2">{SECTORS.map(s=><button key={s} className={`chip ${s===sector?'on':''}`} onClick={()=>setSector(s)}>{s}</button>)}</div>
  <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{shown.map(f=><article key={f.ticker} className="panel relative p-4"><button aria-label={`${favorites.includes(f.ticker)?'Quitar':'Agregar'} ${f.ticker} de favoritos`} className="absolute right-3 top-3 grid h-9 w-9 place-items-center border hairline bg-[#111] text-lg" onClick={()=>onToggle(f.ticker)}>{favorites.includes(f.ticker)?'★':'☆'}</button><button className="w-full text-left" onClick={()=>onOpen(f.ticker)}><div className="flex items-center gap-3"><Icon f={f}/><div><p className="text-xs text-[var(--accent)]">{f.sector}</p><h3 className="display text-2xl">{f.fullName}</h3><p className="text-xs text-[var(--dim)]">{f.ticker}</p>{f.exchange==='BIVA'&&<span className="mt-1 inline-flex border border-[var(--border)] px-2 py-0.5 text-[10px] font-bold text-[var(--dim)]">BIVA</span>}</div></div><div className="mt-5 grid grid-cols-2 gap-3"><div><p className="text-[10px] text-[var(--dim)]">{f.quoteState==="unavailable"?"PRECIO DE REFERENCIA":"COTIZACIÓN"}</p><PriceValue f={f} className="metric text-2xl font-bold"/><p className={`mt-1 text-xs font-bold ${quoteTone(f)}`}>{quoteChange(f)}</p></div><div><p className="text-[10px] text-[var(--dim)]">YIELD ANUAL</p><p className="metric text-lg font-bold">{f.annualYield}</p></div></div><div className="mt-4 border-t hairline pt-3"><div className="flex items-center justify-between gap-3"><span className="text-xs text-[var(--dim)]">{quoteTime(f)}</span><span className="text-xs text-[var(--dim)]">Abrir perfil →</span></div><p className="source-line mt-3">{f.quoteState==="unavailable"?`Referencia capturada · ${f.referenceSource}, ${f.referenceDate}`:"Cotización de mercado · fuente enlazada en el perfil"}</p></div></button></article>)}</div>{shown.length===0&&<Empty>No hay FIBRAs con esos filtros.</Empty>}</section></>
}

type RatioMetric="yield"|"payout";
type CalculatedRatio={
  fundamental:RatioFundamental;
  market:Market|undefined;
  price:number|null;
  yieldValue:number|null;
  payoutValue:number|null;
  group:"Industriales"|"Hoteleras"|"Otras"|"FIBRAS E";
  rank:number|null;
};
const RATIO_GROUPS=[
 {name:"Industriales",tickers:["FIBRAPL14","FIBRAMQ12","FNOVA17","FIBRAUP18"]},
 {name:"Hoteleras",tickers:["FINN13","FIHO12"]},
 {name:"Otras",tickers:["FUNO11","DANHOS13","FSHOP13","FMTY14","STORAGE18","EDUCA18","FPLUS16"]},
 {name:"FIBRAS E",tickers:["FCFE18","FMX23"]},
] as const;
const RATIO_DEFINITIONS:Record<RatioMetric,string>={
 yield:"Es el dinero que la fibra te pagaría en un año si repite su última distribución, dividido entre el precio de hoy. Se expresa en %. No garantiza que los pagos se repitan.",
 payout:"Qué porcentaje de su flujo reparte la fibra como distribución. Por ley deben repartir al menos 95% de su resultado fiscal, por eso a veces pasa de 100%.",
};
function roundRatio(value:number){return Math.round((value+Number.EPSILON)*100)/100}
function marketIsOpen(items:Market[]){return items.some(item=>{const status=(item.marketStatus??"").toUpperCase();return status.includes("OPEN")||status.includes("REGULAR")||status.includes("TRADING")})}
function latestQuoteInstant(items:Market[],fallback:string){const stamps=items.map(item=>item.asOf?new Date(item.asOf).getTime():Number.NaN).filter(Number.isFinite);return new Date(stamps.length?Math.max(...stamps):new Date(fallback).getTime())}
function quoteCutoff(items:Market[],fallback:string){const instant=latestQuoteInstant(items,fallback);return Number.isNaN(instant.getTime())?"último dato disponible":instant.toLocaleDateString("es-MX",{day:"2-digit",month:"short",year:"numeric"}).replaceAll(" ","-")}
function formatRatioAmount(value:number|null,currency:"MXN"|"USD",digits=4){if(value===null)return "—";return `${currency==="USD"?"USD$":"$"}${value.toLocaleString("es-MX",{minimumFractionDigits:2,maximumFractionDigits:digits})}`}
function qualityLabel(quality:RatioFundamental["quality"]){if(quality==="verified")return "VERIFICADO";if(quality==="no_distributions")return "SIN DISTRIBUCIONES";if(quality==="single_payment")return "PAGO ÚNICO — NO COMPARABLE";return "NO VERIFICADO"}

function AnimatedRatio({value,metric,enabled}:{value:number;metric:RatioMetric;enabled:boolean}){
 const [shown,setShown]=useState(value);
 const prior=useRef(value);
 useEffect(()=>{
  const from=prior.current;const delta=Math.abs(value-from);prior.current=value;
  if(!enabled||metric!=="yield"||delta<0.05){setShown(value);return}
  const started=performance.now();let frame=0;
  const step=(now:number)=>{const progress=Math.min(1,(now-started)/450);const eased=1-Math.pow(1-progress,3);setShown(from+(value-from)*eased);if(progress<1)frame=requestAnimationFrame(step)};
  frame=requestAnimationFrame(step);return()=>cancelAnimationFrame(frame);
 },[value,metric,enabled]);
 return <span className="ratio-number">{metric==="payout"&&Math.abs(value-106.73)<0.02?"106.7":shown.toFixed(2)}%</span>
}

function RatioQualityBadges({row}:{row:CalculatedRatio}){return <div className="ratio-badges"><span className={`quality-badge ${row.fundamental.quality}`}>{qualityLabel(row.fundamental.quality)}</span>{row.fundamental.ticker==="FIHO12"&&<span className="quality-badge attention">Atención: la distribución 2T26 superó su AFFO</span>}{row.fundamental.ticker==="FMTY14"&&<span className="quality-badge distorted">⚠ Dato distorsionado</span>}</div>}

function RatioRow({row,metric,marketOpen}:{row:CalculatedRatio;metric:RatioMetric;marketOpen:boolean}){
 const [open,setOpen]=useState(false);const value=metric==="yield"?row.yieldValue:row.payoutValue;const market=row.market;const movement=(market?.changePercent??0)<0?"up":(market?.changePercent??0)>0?"down":"flat";
 const annualForFormula=row.fundamental.ticker==="FUNO11"?"2.5591":row.fundamental.annualizedDistribution?.toFixed(row.fundamental.annualizedDistribution<1?4:5);
 const formula=value===null?null:metric==="yield"&&row.price!==null?`${annualForFormula} ÷ ${row.price.toFixed(2)} × 100 = ${value.toFixed(2)}%`:metric==="payout"&&row.fundamental.quarterlyAffoPerCbfi!==null?`${row.fundamental.annualizedDistribution?.toFixed(4)} ÷ (${row.fundamental.quarterlyAffoPerCbfi.toFixed(4)} × 4) = ${row.fundamental.ticker==="FIHO12"?"106.7":value.toFixed(2)}%`:null;
 return <article className={`ratio-entry ${open?"open":""}`}>
  <button className="ratio-row" onClick={()=>setOpen(current=>!current)} aria-expanded={open} aria-controls={`ratio-detail-${row.fundamental.ticker}`}>
   <span className="ratio-rank">{row.rank??"—"}</span>
   <span className="ratio-identity"><b>{row.fundamental.ticker}</b><small>{market?.fullName??row.fundamental.ticker}</small></span>
   <span className="ratio-price"><span className={`ratio-live-dot ${market?.quoteState==="unavailable"?"unavailable":marketOpen?"pulsing":""}`} aria-hidden="true"/><b>{row.price===null?"—":money(row.price,market?.currency??"MXN")}</b><small>{marketOpen?"precio en vivo":"último cierre"}</small></span>
   <span className="ratio-value">{value===null?<b>— NO VERIFICADO</b>:<AnimatedRatio value={value} metric={metric} enabled={marketOpen}/>}<small className={`ratio-move ${movement}`}>{movement==="up"?"▲":movement==="down"?"▼":"—"}</small></span>
   <span className="ratio-chevron" aria-hidden="true">{open?"−":"+"}</span>
  </button>
  <RatioQualityBadges row={row}/>
  {open&&<div className="ratio-detail" id={`ratio-detail-${row.fundamental.ticker}`}>
   <dl><div><dt>Última distribución</dt><dd>{formatRatioAmount(row.fundamental.latestDistribution,row.fundamental.distributionCurrency)} · {row.fundamental.distributionPeriod}</dd></div><div><dt>Frecuencia real</dt><dd>{row.fundamental.paymentFrequency}</dd></div><div><dt>Distribución anualizada</dt><dd>{formatRatioAmount(row.fundamental.annualizedDistribution,row.fundamental.distributionCurrency,5)}</dd></div>{row.fundamental.quarterlyAffoPerCbfi!==null&&<div><dt>AFFO 2T26 por CBFI</dt><dd>{formatRatioAmount(row.fundamental.quarterlyAffoPerCbfi,"MXN",4)}</dd></div>}</dl>
   {row.fundamental.fiscalNote&&<p className="ratio-fiscal-note">{row.fundamental.fiscalNote}</p>}
   {row.fundamental.note&&row.fundamental.ticker!=="FIHO12"&&row.fundamental.ticker!=="FMTY14"&&<p className="ratio-fiscal-note">{row.fundamental.note}</p>}
   <div className="ratio-formula"><b>¿Cómo se calcula?</b>{formula?<code>{formula}</code>:<p>— NO VERIFICADO. No se usa una estimación.</p>}</div>
  </div>}
 </article>
}

function LiveRatiosView({items,fetchedAt}:{items:Market[];fetchedAt:string}){
 const [metric,setMetric]=useState<RatioMetric>("yield");const [definitionOpen,setDefinitionOpen]=useState(true);const [clock,setClock]=useState(()=>Date.now());
 const fundamentals=useQuery({queryKey:["live-ratios"],queryFn:()=>api.getLiveRatios({}),staleTime:300000});
 useEffect(()=>{const timer=window.setInterval(()=>setClock(Date.now()),1000);return()=>window.clearInterval(timer)},[]);
 const open=marketIsOpen(items);const quoteInstant=latestQuoteInstant(items,fetchedAt);const age=Math.max(0,Math.floor((clock-quoteInstant.getTime())/1000));
 const calculated=useMemo(()=>{
  const rows:CalculatedRatio[]=(fundamentals.data?.items??[]).map(fundamental=>{
   const market=items.find(item=>item.ticker===fundamental.ticker);const price=market?.price??market?.referencePrice??null;
   const yieldValue=fundamental.annualizedDistribution!==null&&price!==null&&price>0?roundRatio(fundamental.annualizedDistribution/price*100):null;
   const payoutValue=fundamental.annualizedDistribution!==null&&fundamental.quarterlyAffoPerCbfi!==null&&fundamental.quarterlyAffoPerCbfi>0?roundRatio(fundamental.annualizedDistribution/(fundamental.quarterlyAffoPerCbfi*4)*100):null;
   const group=(RATIO_GROUPS.find(candidate=>(candidate.tickers as readonly string[]).includes(fundamental.ticker))?.name??"Otras") as CalculatedRatio["group"];
   return{fundamental,market,price,yieldValue,payoutValue,group,rank:null};
  });
  const rankedBlocks=[rows.filter(row=>row.group!=="FIBRAS E"),rows.filter(row=>row.group==="FIBRAS E")];
  for(const block of rankedBlocks){const ranked=[...block].filter(row=>row.fundamental.quality!=="single_payment"&&(metric==="yield"?row.yieldValue:row.payoutValue)!==null).sort((a,b)=>((metric==="yield"?b.yieldValue:b.payoutValue)??-Infinity)-((metric==="yield"?a.yieldValue:a.payoutValue)??-Infinity));ranked.forEach((row,index)=>{row.rank=index+1})}
  return rows;
 },[fundamentals.data?.items,items,metric]);
 return <section className="ratios-page" aria-labelledby="ratios-title">
  <header className="ratios-hero"><p className="ratios-eyebrow">FASE 1 · DISTRIBUCIONES</p><h1 id="ratios-title">Ratios en vivo</h1><p>Precios de la BMV recalculados al momento</p></header>
  <div className="ratios-livebar"><span className={`ratio-live-dot ${open?"pulsing":""}`} aria-hidden="true"/><b>{open?"EN VIVO":"MERCADO CERRADO · precios del último cierre"}</b><span>Actualizado hace {age}s</span></div>
  <p className="ratio-cutoff">Precio: cierre {quoteCutoff(items,fetchedAt)} · Fundamentales: reporte 2T26</p>
  <div className="metric-selector" role="tablist" aria-label="Métrica de ratios"><button role="tab" aria-selected={metric==="yield"} onClick={()=>setMetric("yield")}>Yield fwd</button><button role="tab" aria-selected={metric==="payout"} onClick={()=>setMetric("payout")}>Payout</button>{[["P/AFFO","Fase 2"],["Descuento vs NAV","Fase 2"],["LTV","Fase 3"]].map(([label,phase])=><button key={label} disabled><span>{label}</span><small>Próximamente · {phase}</small></button>)}</div>
  <aside className="ratio-definition"><button onClick={()=>setDefinitionOpen(current=>!current)} aria-expanded={definitionOpen}><b>Definición: {metric==="yield"?"Yield forward":"Payout"}</b><span>{definitionOpen?"Ocultar":"Ver"}</span></button>{definitionOpen&&<p>{RATIO_DEFINITIONS[metric]}</p>}</aside>
  <p className="ratio-lesson">Un yield alto a veces refleja una caída del precio, no un mejor pago. No es señal de nada.</p>
  {fundamentals.isPending&&<div className="ratio-empty">Cargando fundamentales…</div>}
  {fundamentals.isError&&<div className="ratio-empty"><p>No se pudieron cargar los fundamentales.</p><button onClick={()=>fundamentals.refetch()}>Reintentar</button></div>}
  {fundamentals.data&&RATIO_GROUPS.map(group=>{const rows=calculated.filter(row=>row.group===group.name).sort((a,b)=>{const aValue=metric==="yield"?a.yieldValue:a.payoutValue;const bValue=metric==="yield"?b.yieldValue:b.payoutValue;if(aValue===null&&bValue===null)return (group.tickers as readonly string[]).indexOf(a.fundamental.ticker)-(group.tickers as readonly string[]).indexOf(b.fundamental.ticker);if(aValue===null)return 1;if(bValue===null)return -1;return bValue-aValue});return <section className={`ratio-group ${group.name==="FIBRAS E"?"fibrae":""}`} key={group.name}><header><h2>{group.name.toUpperCase()}</h2><span>{metric==="yield"?"YIELD FWD":"PAYOUT"}</span></header><div className="ratio-column-head"><span>#</span><span>FIBRA</span><span>PRECIO</span><span>RATIO</span><span aria-hidden="true"/></div>{rows.map(row=><RatioRow key={row.fundamental.ticker} row={row} metric={metric} marketOpen={open}/>)}</section>})}
  <footer className="ratios-disclaimer">Esto no es una recomendación de compra ni de venta. Es información educativa con fines informativos. Invertir implica riesgos; consulta a un asesor autorizado.</footer>
 </section>
}

function UpcomingPaymentsView(){
 const total=PAYMENT_MONTHS.reduce((sum,month)=>sum+month.payments.length,0);
 return <section className="payments-page" aria-labelledby="payments-title">
  <div className="payments-hero">
   <p className="payments-kicker">CALENDARIO PROYECTADO</p>
   <h1 id="payments-title" className="payments-title">Próximos pagos</h1>
   <p className="payments-range">Septiembre 2026 → septiembre 2027</p>
   <div className="payments-summary" aria-label="Resumen del calendario">
    <div><strong>13</strong><span>meses</span></div>
    <div><strong>{total}</strong><span>entradas</span></div>
    <div><strong>1</strong><span>confirmada</span></div>
   </div>
  </div>
  <aside className="payments-notice" role="note">
   <strong>Importante</strong>
   <p>Montos estimados a partir del historial; no confirmados por la emisora. Cada distribución la declara el consejo de cada FIBRA y puede cambiar, recortarse o suspenderse.</p>
  </aside>
  <div className="payments-legend" aria-label="Leyenda del calendario"><span className="status-badge confirmed">Confirmado</span><span>Declarado por la emisora</span><span className="status-badge estimated">Estimado</span><span>Proyección histórica</span></div>
  <ol className="timeline-list">
   {PAYMENT_MONTHS.map((month,index)=><li className="timeline-month" key={month.key}>
    <div className="timeline-marker" aria-hidden="true">{String(index+1).padStart(2,"0")}</div>
    <div className="month-content">
     <header className="month-heading"><div><h2>{month.label}</h2>{month.context&&<p>{month.context}</p>}</div><span>{month.payments.length} {month.payments.length===1?"pago":"pagos"}</span></header>
     <div className="payment-list">
      {month.payments.map((entry,entryIndex)=><article className={`payment-entry ${entry.status}`} key={`${month.key}-${entry.ticker}-${entryIndex}`}>
       <div className="payment-identity"><b>{entry.ticker}</b><span>{entry.name}</span></div>
       <div className="payment-amount"><small>MXN por CBFI</small><strong>{entry.amount}</strong></div>
       <div className="payment-meta">
        <span className={`status-badge ${entry.status==="confirmado"?"confirmed":"estimated"}`}>{entry.status}</span>
        <span className="confidence">Confianza <b>{entry.confidence}</b></span>
       </div>
       {(entry.exDate||entry.paymentDate||entry.note)&&<div className="payment-detail">{entry.exDate&&<span><b>Ex-date:</b> {entry.exDate}</span>}{entry.paymentDate&&<span><b>Pago:</b> {entry.paymentDate}</span>}{entry.note&&<span>{entry.note}</span>}</div>}
      </article>)}
     </div>
    </div>
   </li>)}
  </ol>
  <p className="payments-footnote">FIBRAUP18 no aparece porque su pago fue único y no recurrente. FPLUS16 no aparece porque sus distribuciones están suspendidas.</p>
 </section>
}

function VideosView({items,ticker}:{items:Market[];ticker?:string}){const [cat,setCat]=useState<string>("");const [fibra,setFibra]=useState(ticker??"");const videos=useQuery({queryKey:["videos",fibra,cat],queryFn:()=>api.listVideos({ticker:fibra||undefined,category:(cat||undefined) as typeof CATS[number]|undefined})});return <section><p className="text-xs font-bold text-[var(--accent)]">BIBLIOTECA</p><h1 className="display text-5xl">Videos publicados</h1><div className="mt-5 grid gap-3 sm:grid-cols-2"><label className="text-sm">FIBRA<select aria-label="Filtrar videos por FIBRA" className="input mt-1" value={fibra} onChange={e=>setFibra(e.target.value)}><option value="">Todas</option>{items.map(f=><option key={f.ticker}>{f.ticker}</option>)}</select></label><label className="text-sm">Categoría<select aria-label="Filtrar videos por categoría" className="input mt-1" value={cat} onChange={e=>setCat(e.target.value)}><option value="">Todas</option>{CATS.map(c=><option key={c}>{c}</option>)}</select></label></div><div className="mt-6 grid gap-4 md:grid-cols-2">{videos.data?.videos.map(v=><VideoCard key={v.id} v={v}/>)}</div>{videos.data?.videos.length===0&&<Empty>Aún no hay videos publicados con estos filtros.</Empty>}</section>}
function isSupportedVideoUrl(raw:string){try{const u=new URL(raw);if(["youtube.com","www.youtube.com","youtu.be","www.youtu.be"].includes(u.hostname)){const id=u.hostname.includes("youtu.be")?u.pathname.slice(1):u.searchParams.get("v")??(u.pathname.startsWith("/shorts/")||u.pathname.startsWith("/embed/")?u.pathname.split("/")[2]:null);return Boolean(id&&/^[\w-]{6,20}$/.test(id))}if(["vimeo.com","www.vimeo.com","player.vimeo.com"].includes(u.hostname))return /^\d+$/.test(u.pathname.split("/").filter(Boolean).pop()??"");return false}catch{return false}}
function VideoCard({v,sessionId,onChanged}:{v:VideoItem;sessionId?:string;onChanged?:()=>void}){const [editing,setEditing]=useState(false);const [confirming,setConfirming]=useState(false);const [message,setMessage]=useState("");
 const update=useMutation({mutationFn:(x:{title:string;url:string;description?:string})=>api.updateVideo({id:v.id,sessionId:sessionId??"",...x}),onSuccess:()=>{setEditing(false);setMessage("Cambios guardados.");onChanged?.()},onError:e=>setMessage(String(e))});
 const remove=useMutation({mutationFn:()=>api.deleteVideo({id:v.id,sessionId:sessionId??""}),onSuccess:()=>onChanged?.(),onError:e=>{setConfirming(false);setMessage(String(e))}});
 const submit=(e:FormEvent<HTMLFormElement>)=>{e.preventDefault();const f=new FormData(e.currentTarget);const url=String(f.get("url"));if(!isSupportedVideoUrl(url)){setMessage("Usa un enlace válido de YouTube o Vimeo.");return}update.mutate({title:String(f.get("title")),url,description:String(f.get("description")||"")||undefined})};
 const videoUrl=isSupportedVideoUrl(v.url)?v.url:null;
 return <article className="panel overflow-hidden"><div className="grid aspect-video place-items-center bg-[#171717] p-6 text-center"><div><p className="display text-2xl">{v.provider==='youtube'?'YouTube':'Vimeo'}</p><p className="mt-2 text-sm text-[var(--dim)]">El video se abre directamente en su plataforma.</p>{videoUrl?<a className="btn btn-primary mt-4 inline-grid place-items-center" href={videoUrl} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer">Ver video en {v.provider==='youtube'?'YouTube':'Vimeo'}</a>:<p className="mt-4 text-sm text-[var(--dim)]">El enlace guardado no es válido.</p>}</div></div><div className="p-4"><div className="flex justify-between gap-3"><span className="text-xs font-bold text-[var(--accent)]">{v.category}</span><span className="text-xs text-[var(--dim)]">{v.ticker}</span></div><h3 className="mt-2 font-bold">{v.title}</h3>{v.description&&<p className="mt-2 text-sm text-[var(--dim)]">{v.description}</p>}
 {v.canManage&&sessionId&&<div className="manage-actions mt-4 border-t hairline pt-3"><button className="btn btn-ghost" onClick={()=>{setEditing(true);setConfirming(false);setMessage("")}}>Editar</button><button className="btn btn-danger" onClick={()=>{setConfirming(true);setEditing(false);setMessage("")}}>Borrar</button></div>}
 {editing&&<form className="editor-form mt-4" onSubmit={submit}><Field name="title" label="Título" defaultValue={v.title}/><Field name="url" label="Enlace de YouTube o Vimeo" type="url" defaultValue={v.url}/><OptionalField name="description" label="Descripción (opcional)" defaultValue={v.description??""}/><div className="manage-actions"><button className="btn btn-primary" disabled={update.isPending}>{update.isPending?"Guardando…":"Guardar cambios"}</button><button className="btn btn-ghost" type="button" onClick={()=>setEditing(false)}>Cancelar</button></div></form>}
 {confirming&&<div className="confirm-panel mt-4" role="alert"><p>¿Borrar “{v.title}”? Esta acción no se puede deshacer.</p><div className="manage-actions mt-3"><button className="btn btn-danger" disabled={remove.isPending} onClick={()=>remove.mutate()}>{remove.isPending?"Borrando…":"Sí, borrar"}</button><button className="btn btn-ghost" onClick={()=>setConfirming(false)}>Cancelar</button></div></div>}
 {message&&<p className="mt-3 text-sm" role="status">{message}</p>}</div></article>}

function PublishView({items}:{items:Market[]}){const qc=useQueryClient();const [kind,setKind]=useState<'video'|'report'>('video');const [msg,setMsg]=useState("");const video=useMutation({mutationFn:(x:{title:string;url:string;ticker:string;category:typeof CATS[number];description?:string;sessionId:string})=>api.publishVideo(x),onSuccess:()=>{setMsg("Video publicado.");qc.invalidateQueries({queryKey:["videos"]})},onError:e=>setMsg(String(e))});const report=useMutation({mutationFn:(x:{title:string;ticker:string;year:number;period:typeof PERIODS[number];fileName:string;base64:string;sessionId:string})=>api.publishReport(x),onSuccess:()=>{setMsg("Reporte guardado.");qc.invalidateQueries({queryKey:["reports"]})},onError:e=>setMsg(String(e))});
 const submitVideo=(e:FormEvent<HTMLFormElement>)=>{e.preventDefault();const f=new FormData(e.currentTarget);video.mutate({title:String(f.get('title')),url:String(f.get('url')),ticker:String(f.get('ticker')),category:String(f.get('category')) as typeof CATS[number],description:String(f.get('description')||'')||undefined,sessionId:sessionId()})};
 const submitReport=async(e:FormEvent<HTMLFormElement>)=>{e.preventDefault();const form=e.currentTarget;const f=new FormData(form);const file=f.get('file');if(!(file instanceof File)){setMsg('Selecciona un PDF.');return}const base64=await fileToBase64(file);report.mutate({title:String(f.get('title')),ticker:String(f.get('ticker')),year:Number(f.get('year')),period:String(f.get('period')) as typeof PERIODS[number],fileName:file.name,base64,sessionId:sessionId()})};
 return <section className="mx-auto max-w-2xl"><p className="text-xs font-bold text-[var(--accent)]">CENTRO EDITORIAL</p><h1 className="display text-5xl">Publicar contenido</h1><p className="mt-2 text-[var(--dim)]">Asigna cada pieza al perfil de la FIBRA correspondiente.</p><div className="mt-6 grid grid-cols-2 gap-2"><button className="tab" aria-selected={kind==='video'} onClick={()=>setKind('video')}>Video</button><button className="tab" aria-selected={kind==='report'} onClick={()=>setKind('report')}>Reporte PDF</button></div>{kind==='video'?<form className="panel mt-4 space-y-4 p-5" onSubmit={submitVideo}><Field name="title" label="Título"/><Field name="url" label="Enlace de YouTube o Vimeo" type="url"/><OptionalField name="description" label="Descripción (opcional)"/><SelectField name="ticker" label="FIBRA" options={items.filter(x=>!x.delisted).map(x=>x.ticker)}/><SelectField name="category" label="Categoría" options={[...CATS]}/><button className="btn btn-primary w-full" disabled={video.isPending}>{video.isPending?'Publicando…':'Publicar video'}</button></form>:<form className="panel mt-4 space-y-4 p-5" onSubmit={submitReport}><Field name="title" label="Título del reporte"/><div className="grid gap-4 sm:grid-cols-2"><SelectField name="ticker" label="FIBRA" options={items.map(x=>x.ticker)}/><Field name="year" label="Año" type="number" defaultValue={String(new Date().getFullYear())}/></div><SelectField name="period" label="Periodo" options={[...PERIODS]}/><label className="block text-sm">Archivo PDF<input aria-label="Archivo PDF" className="input mt-1" name="file" type="file" accept="application/pdf" required/></label><button className="btn btn-primary w-full" disabled={report.isPending}>{report.isPending?'Guardando…':'Publicar reporte'}</button></form>}{msg&&<p className="mt-4 text-sm" role="status">{msg}</p>}</section>}
function Field({name,label,type="text",defaultValue}:{name:string;label:string;type?:string;defaultValue?:string}){return <label className="block text-sm">{label}<input className="input mt-1" aria-label={label} name={name} type={type} step={type==="number"?"any":undefined} min={type==="number"?"0.000001":undefined} defaultValue={defaultValue} required/></label>}
function OptionalField({name,label,type="text",defaultValue}:{name:string;label:string;type?:string;defaultValue?:string}){return <label className="block text-sm">{label}<input className="input mt-1" aria-label={label} name={name} type={type} defaultValue={defaultValue}/></label>}
function SelectField({name,label,options}:{name:string;label:string;options:string[]}){return <label className="block text-sm">{label}<select aria-label={label} className="input mt-1" name={name} required>{options.map(x=><option key={x}>{x}</option>)}</select></label>}
function fileToBase64(file:File):Promise<string>{return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result).split(',')[1]??'');r.onerror=()=>reject(r.error);r.readAsDataURL(file)})}

function ToolsView({items}:{items:Market[]}){const [mode,setMode]=useState<'comparar'|'calcular'>('comparar');const active=items.filter(x=>!x.delisted);const [chosen,setChosen]=useState<string[]>(active.slice(0,2).map(x=>x.ticker));const [amount,setAmount]=useState(100000);const [yieldPct,setYieldPct]=useState(8);const [years,setYears]=useState(5);const final=amount*Math.pow(1+yieldPct/100,years);return <section><p className="text-xs font-bold text-[var(--accent)]">HERRAMIENTAS</p><h1 className="display text-5xl">Decide con contexto</h1><div className="mt-5 grid grid-cols-2 gap-2"><button className="tab" aria-selected={mode==='comparar'} onClick={()=>setMode('comparar')}>Comparador</button><button className="tab" aria-selected={mode==='calcular'} onClick={()=>setMode('calcular')}>Calculadora 5 años</button></div>{mode==='comparar'?<div className="mt-6"><p className="text-sm text-[var(--dim)]">Elige hasta 3 FIBRAs.</p><div className="mt-3 flex flex-wrap gap-2">{active.map(f=><button className={`chip ${chosen.includes(f.ticker)?'on':''}`} key={f.ticker} onClick={()=>setChosen(c=>c.includes(f.ticker)?c.filter(x=>x!==f.ticker):c.length<3?[...c,f.ticker]:c)}>{f.ticker}</button>)}</div><div className="phone-stack mt-6 grid gap-3 sm:grid-cols-3">{chosen.map(t=>{const f=active.find(x=>x.ticker===t);return f?<div className="panel p-4" key={t}><Icon f={f} size={56}/><h3 className="display mt-3 text-2xl">{f.ticker}</h3><PriceValue f={f} className="metric mt-4 text-2xl font-bold"/><p className={`mt-1 text-xs font-bold ${quoteTone(f)}`}>{quoteChange(f)} · {quoteTime(f)}</p><dl className="mt-4 space-y-2 text-sm"><Row k="Yield anual" v={f.annualYield}/><Row k="Frecuencia" v={f.paymentFrequency}/><Row k="Mín / Máx del día" v={`${money(f.low)} / ${money(f.high)}`}/><Row k="52 semanas" v={`${money(f.week52Low)} / ${money(f.week52High)}`}/></dl><p className="source-line mt-3">{f.quoteState==="unavailable"?`Referencia capturada · ${f.referenceSource}, ${f.referenceDate}`:"Cotización de mercado actualizada"}</p></div>:null})}</div></div>:<div className="panel mt-6 p-5"><div className="grid gap-4 sm:grid-cols-3"><label className="text-sm">Inversión inicial<input className="input mt-1" aria-label="Inversión inicial" type="number" value={amount} onChange={e=>setAmount(Number(e.target.value))}/></label><label className="text-sm">Rendimiento anual %<input className="input mt-1" aria-label="Rendimiento anual" type="number" value={yieldPct} onChange={e=>setYieldPct(Number(e.target.value))}/></label><label className="text-sm">Años<input className="input mt-1" aria-label="Años" type="number" min="1" max="5" value={years} onChange={e=>setYears(Number(e.target.value))}/></label></div><div className="mt-8 border-t hairline pt-6"><p className="text-sm text-[var(--dim)]">Valor proyectado con reinversión</p><p className="display metric mt-1 text-5xl">{money(final)}</p><p className="mt-2 text-sm text-[var(--good)]">Ganancia estimada: {money(final-amount)}</p><p className="mt-5 text-xs text-[var(--dim)]">Simulación matemática; no es una promesa de rendimiento.</p></div></div>}</section>}
function Row({k,v}:{k:string;v:string}){return <div className="flex justify-between gap-3 border-b hairline pb-2"><dt className="text-[var(--dim)]">{k}</dt><dd className="metric text-right">{v}</dd></div>}

type PortfolioTracker=ApiResponse<typeof api,"getPortfolioTracker">;
type PortfolioOperation=PortfolioTracker["operations"][number];
type PortfolioTab="resumen"|"operaciones"|"asignacion"|"metas"|"catalogo";
type ComputedPosition={ticker:string;name:string;quantity:number;averageCost:number;costBasis:number;currentPrice:number;marketPrice:number|null;manualPrice:number|null;currentValue:number;gain:number;gainPercent:number;share:number;targetPercent:number;priceSource:string};
const PORTFOLIO_COLORS=["var(--accent)","var(--text)","var(--dim)","var(--border)","var(--good)","var(--warn)","#5d101b","#777"];
function localDateValue(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`}
function monthLabel(key:string){const date=new Date(`${key}-01T12:00:00`);return date.toLocaleDateString("es-MX",{month:"short",year:"2-digit"}).replace(".","")}
function shiftMonth(key:string,offset:number){const date=new Date(`${key}-01T12:00:00`);date.setMonth(date.getMonth()+offset);return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}`}
function calculateHoldings(operations:PortfolioOperation[],throughMonth?:string){
 const holdings=new Map<string,{quantity:number;costBasis:number}>();
 const cutoff=throughMonth?`${throughMonth}-31`:"9999-12-31";
 for(const operation of [...operations].sort((a,b)=>a.operationDate.localeCompare(b.operationDate)||a.id-b.id)){
  if(operation.operationDate>cutoff||operation.kind==="distribution")continue;
  const row=holdings.get(operation.ticker)??{quantity:0,costBasis:0};
  if(operation.kind==="buy"){
   row.quantity+=operation.quantity??0;
   row.costBasis+=(operation.quantity??0)*(operation.pricePerCbfi??0);
  }else{
   const sold=Math.min(operation.quantity??0,Math.max(0,row.quantity));
   const average=row.quantity>0?row.costBasis/row.quantity:0;
   row.quantity-=sold;
   row.costBasis=Math.max(0,row.costBasis-average*sold);
  }
  holdings.set(operation.ticker,row);
 }
 return holdings;
}

function PortfolioView({items,sessionId}:{items:Market[];sessionId:string}){
 const qc=useQueryClient();
 const [tab,setTab]=useState<PortfolioTab>("resumen");
 const [operationKind,setOperationKind]=useState<"buy"|"sell"|"distribution">("buy");
 const [message,setMessage]=useState("");
 const [deleteOperationId,setDeleteOperationId]=useState<number|null>(null);
 const nowMonth=localDateValue().slice(0,7);
 const [selectedMonth,setSelectedMonth]=useState(nowMonth);
 const tracker=useQuery({queryKey:["portfolio-tracker",sessionId],queryFn:()=>api.getPortfolioTracker({sessionId})});
 const refresh=()=>qc.invalidateQueries({queryKey:["portfolio-tracker",sessionId]});
 const addOperation=useMutation({mutationFn:(data:{ticker:string;kind:"buy"|"sell"|"distribution";quantity?:number;pricePerCbfi?:number;amount?:number;operationDate:string;note?:string})=>api.addPortfolioOperation({sessionId,...data}),onSuccess:()=>{setMessage("Operación guardada.");refresh()},onError:e=>setMessage(String(e))});
 const deleteOperation=useMutation({mutationFn:(id:number)=>api.deletePortfolioOperation({sessionId,id}),onSuccess:()=>{setDeleteOperationId(null);setMessage("Operación eliminada.");refresh()},onError:e=>setMessage(String(e))});
 const savePreference=useMutation({mutationFn:(data:{ticker:string;manualPrice:number|null;targetPercent:number})=>api.savePositionPreference({sessionId,...data}),onSuccess:()=>{setMessage("Posición actualizada.");refresh()},onError:e=>setMessage(String(e))});
 const saveThreshold=useMutation({mutationFn:(deviationThreshold:number)=>api.setPortfolioThreshold({sessionId,deviationThreshold}),onSuccess:()=>{setMessage("Umbral actualizado.");refresh()},onError:e=>setMessage(String(e))});
 const addGoal=useMutation({mutationFn:(data:{name:string;targetAmount:number})=>api.addInvestmentGoal({sessionId,...data}),onSuccess:()=>{setMessage("Meta creada.");refresh()},onError:e=>setMessage(String(e))});
 const addContribution=useMutation({mutationFn:(data:{goalId:number;amount:number;contributionDate:string;note?:string})=>api.addGoalContribution({sessionId,...data}),onSuccess:()=>{setMessage("Abono registrado.");refresh()},onError:e=>setMessage(String(e))});
 const deleteContribution=useMutation({mutationFn:(id:number)=>api.deleteGoalContribution({sessionId,id}),onSuccess:()=>refresh(),onError:e=>setMessage(String(e))});
 const deleteGoal=useMutation({mutationFn:(id:number)=>api.deleteInvestmentGoal({sessionId,id}),onSuccess:()=>{setMessage("Meta eliminada.");refresh()},onError:e=>setMessage(String(e))});
 const operations=tracker.data?.operations??[];
 const preferences=tracker.data?.preferences??[];
 const positions=useMemo<ComputedPosition[]>(()=>{
  const holdings=calculateHoldings(operations);
  const prelim=[...holdings.entries()].filter(([,row])=>row.quantity>0.000001).map(([ticker,row])=>{
   const fibra=items.find(item=>item.ticker===ticker);
   const preference=preferences.find(item=>item.ticker===ticker);
   const marketPrice=fibra?.price??fibra?.referencePrice??null;
   const currentPrice=preference?.manualPrice??marketPrice??0;
   const currentValue=row.quantity*currentPrice;
   const averageCost=row.quantity>0?row.costBasis/row.quantity:0;
   return{ticker,name:fibra?.fullName??ticker,quantity:row.quantity,averageCost,costBasis:row.costBasis,currentPrice,marketPrice,manualPrice:preference?.manualPrice??null,currentValue,gain:currentValue-row.costBasis,gainPercent:row.costBasis>0?(currentValue-row.costBasis)/row.costBasis*100:0,share:0,targetPercent:preference?.targetPercent??0,priceSource:preference?.manualPrice!==null&&preference?.manualPrice!==undefined?"Precio manual":fibra?.quoteState==="live"?"Precio en vivo":fibra?.quoteState==="cached"?"Último precio disponible":"Precio de referencia"};
  });
  const total=prelim.reduce((sum,row)=>sum+row.currentValue,0);
  return prelim.map(row=>({...row,share:total>0?row.currentValue/total*100:0})).sort((a,b)=>b.currentValue-a.currentValue);
 },[items,operations,preferences]);
 const effectivePrice=(ticker:string)=>positions.find(row=>row.ticker===ticker)?.currentPrice??items.find(item=>item.ticker===ticker)?.price??items.find(item=>item.ticker===ticker)?.referencePrice??0;
 const snapshot=(month:string)=>{
  const holdings=calculateHoldings(operations,month);
  let cost=0,value=0;
  for(const [ticker,row] of holdings){cost+=row.costBasis;value+=row.quantity*effectivePrice(ticker)}
  return{cost,value,gain:value-cost};
 };
 const currentSummary=snapshot(selectedMonth);
 const distributionsMonth=operations.filter(row=>row.kind==="distribution"&&row.operationDate.startsWith(selectedMonth)).reduce((sum,row)=>sum+(row.amount??0),0);
 const purchasesMonth=operations.filter(row=>row.kind==="buy"&&row.operationDate.startsWith(selectedMonth)).reduce((sum,row)=>sum+(row.quantity??0)*(row.pricePerCbfi??0),0);
 const monthKeys=Array.from({length:12},(_,index)=>shiftMonth(selectedMonth,index-11));
 const distributionSeries=monthKeys.map(key=>({month:monthLabel(key),distributions:operations.filter(row=>row.kind==="distribution"&&row.operationDate.startsWith(key)).reduce((sum,row)=>sum+(row.amount??0),0)}));
 const valueSeries=monthKeys.map(key=>{const value=snapshot(key);return{month:monthLabel(key),valor:value.value,costo:value.cost}});
 const pieData=positions.filter(row=>row.currentValue>0).map(row=>({name:row.ticker,value:row.currentValue}));
 const totalValue=positions.reduce((sum,row)=>sum+row.currentValue,0);
 const totalCost=positions.reduce((sum,row)=>sum+row.costBasis,0);
 const totalGain=totalValue-totalCost;
 const monthOptions=Array.from({length:24},(_,index)=>shiftMonth(nowMonth,-index));
 const submitOperation=(event:FormEvent<HTMLFormElement>)=>{event.preventDefault();const form=event.currentTarget;const data=new FormData(form);const kind=String(data.get("kind")) as "buy"|"sell"|"distribution";addOperation.mutate({ticker:String(data.get("ticker")),kind,quantity:kind==="distribution"?undefined:Number(data.get("quantity")),pricePerCbfi:kind==="distribution"?undefined:Number(data.get("pricePerCbfi")),amount:kind==="distribution"?Number(data.get("amount")):undefined,operationDate:String(data.get("operationDate")),note:String(data.get("note")||"")||undefined},{onSuccess:()=>form.reset()})};
 const exportOperations=()=>{const header="Fecha,Tipo,Ticker,CBFIs,Precio por CBFI,Monto,Nota";const lines=operations.map(row=>[row.operationDate,row.kind,row.ticker,row.quantity??"",row.pricePerCbfi??"",row.amount??"",`"${(row.note??"").replaceAll('"','""')}"`].join(","));const url=URL.createObjectURL(new Blob([[header,...lines].join("\n")],{type:"text/csv;charset=utf-8"}));const anchor=document.createElement("a");anchor.href=url;anchor.download="operaciones-fibrasmx.csv";anchor.click();URL.revokeObjectURL(url)};
 if(tracker.isPending)return <Empty>Cargando tu portafolio…</Empty>;
 if(tracker.isError)return <div className="panel p-5"><p className="font-bold">No se pudo cargar tu portafolio.</p><button className="btn btn-primary mt-4" onClick={()=>tracker.refetch()}>Reintentar</button></div>;
 return <section className="portfolio-module">
  <div className="portfolio-heading"><div><p className="text-xs font-bold text-[var(--accent)]">SEGUIMIENTO PERSONAL</p><h1 className="display text-5xl">Mis FIBRAs</h1><p>Registra movimientos reales y compáralos con la cotización actual.</p></div><button className="btn btn-ghost" disabled={operations.length===0} onClick={exportOperations}>Exportar operaciones</button></div>
  <div className="portfolio-tabs" role="tablist" aria-label="Secciones del portafolio">{([['resumen','Panel'],['operaciones','Operaciones'],['asignacion','Asignación'],['metas','Metas'],['catalogo','Catálogo']] as [PortfolioTab,string][]).map(([value,label])=><button key={value} className="tab" role="tab" aria-selected={tab===value} onClick={()=>setTab(value)}>{label}</button>)}</div>
  {message&&<p className="portfolio-message" role="status">{message}</p>}
  {tab==="resumen"&&<div className="portfolio-section">
   <div className="month-control"><label>Mes del resumen<select className="input" aria-label="Mes del resumen" value={selectedMonth} onChange={event=>setSelectedMonth(event.target.value)}>{monthOptions.map(key=><option value={key} key={key}>{new Date(`${key}-01T12:00:00`).toLocaleDateString("es-MX",{month:"long",year:"numeric"})}</option>)}</select></label><p>El valor mensual usa las tenencias al cierre de cada mes y el precio efectivo actual de cada posición.</p></div>
   <div className="portfolio-kpis"><SummaryCard label="Valor del portafolio" value={money(currentSummary.value)}/><SummaryCard label="Distribuciones del mes" value={money(distributionsMonth)}/><SummaryCard label="Compras del mes" value={money(purchasesMonth)}/><SummaryCard label="Ganancia / pérdida" value={money(currentSummary.gain)} tone={currentSummary.gain>=0?"good":"bad"}/></div>
   {operations.length===0?<Empty>Tu portafolio está vacío. Registra una compra, venta o distribución para llenar el panel.</Empty>:<div className="portfolio-charts"><article className="portfolio-chart"><h2>Distribuciones recibidas</h2><p>Últimos 12 meses, según tus registros.</p><div className="chart-frame"><ResponsiveContainer width="100%" height="100%"><BarChart data={distributionSeries} margin={{top:12,right:8,left:-14,bottom:0}}><CartesianGrid vertical={false} stroke="#2d2d2f"/><XAxis dataKey="month" tick={{fill:'#9c9996',fontSize:10}}/><YAxis tick={{fill:'#9c9996',fontSize:10}}/><Tooltip formatter={value=>[money(typeof value==="number"?value:null),"Distribuciones"]}/><Bar dataKey="distributions" fill="#ef1735" radius={[3,3,0,0]}/></BarChart></ResponsiveContainer></div></article><article className="portfolio-chart"><h2>Valor vs. costo invertido</h2><p>Tenencias por mes, valuadas al precio efectivo actual.</p><div className="chart-frame"><ResponsiveContainer width="100%" height="100%"><LineChart data={valueSeries} margin={{top:12,right:8,left:-14,bottom:0}}><CartesianGrid vertical={false} stroke="#2d2d2f"/><XAxis dataKey="month" tick={{fill:'#9c9996',fontSize:10}}/><YAxis tick={{fill:'#9c9996',fontSize:10}}/><Tooltip formatter={(value,name)=>[money(typeof value==="number"?value:null),name==="valor"?"Valor":"Costo"]}/><Legend/><Line type="monotone" dataKey="valor" stroke="#ef1735" strokeWidth={2} dot={false}/><Line type="monotone" dataKey="costo" stroke="#aaa" strokeWidth={2} dot={false}/></LineChart></ResponsiveContainer></div></article><article className="portfolio-chart allocation-chart"><h2>Distribución por FIBRA</h2><p>Porcentaje del valor actual.</p>{pieData.length?<div className="chart-frame pie-frame"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={pieData} dataKey="value" nameKey="name" innerRadius="48%" outerRadius="76%" paddingAngle={2}>{pieData.map((entry,index)=><Cell key={entry.name} fill={PORTFOLIO_COLORS[index%PORTFOLIO_COLORS.length]??"#ef1735"}/>)}</Pie><Tooltip formatter={(value)=>money(typeof value==="number"?value:null)}/><Legend/></PieChart></ResponsiveContainer></div>:<Empty>Registra una compra para ver la asignación.</Empty>}</article></div>}
  </div>}
  {tab==="operaciones"&&<div className="portfolio-section"><form className="portfolio-form" onSubmit={submitOperation}><div className="form-title"><h2>Nueva operación</h2><p>Las compras y ventas modifican tus posiciones; las distribuciones alimentan el historial de ingresos.</p></div><SelectField name="ticker" label="FIBRA" options={items.map(item=>item.ticker)}/><label className="block text-sm">Tipo<select className="input mt-1" name="kind" aria-label="Tipo de operación" value={operationKind} onChange={event=>setOperationKind(event.target.value as typeof operationKind)}><option value="buy">Compra</option><option value="sell">Venta</option><option value="distribution">Distribución recibida</option></select></label>{operationKind==="distribution"?<Field name="amount" label="Monto recibido (MXN)" type="number"/>:<><Field name="quantity" label="Cantidad de CBFIs" type="number"/><Field name="pricePerCbfi" label="Precio por CBFI (MXN)" type="number"/></>}<Field name="operationDate" label="Fecha" type="date" defaultValue={localDateValue()}/><OptionalField name="note" label="Nota (opcional)"/><button className="btn btn-primary" disabled={addOperation.isPending}>{addOperation.isPending?"Guardando…":"Registrar operación"}</button></form><div className="operations-list"><div className="section-title"><div><h2>Historial</h2><p>{operations.length} {operations.length===1?"operación":"operaciones"}</p></div></div>{operations.map(operation=><article className="operation-row" key={operation.id}><div><span className={`operation-kind ${operation.kind}`}>{operation.kind==="buy"?"Compra":operation.kind==="sell"?"Venta":"Distribución"}</span><h3>{operation.ticker}</h3><p>{new Date(`${operation.operationDate}T12:00:00`).toLocaleDateString("es-MX",{day:"numeric",month:"short",year:"numeric"})}{operation.note?` · ${operation.note}`:""}</p></div><div className="operation-values">{operation.kind==="distribution"?<strong>{money(operation.amount)}</strong>:<><strong>{operation.quantity?.toLocaleString("es-MX")} CBFIs</strong><span>{money(operation.pricePerCbfi)} c/u · {money((operation.quantity??0)*(operation.pricePerCbfi??0))}</span></>}</div>{deleteOperationId===operation.id?<div className="inline-delete"><span>¿Eliminar?</span><button className="btn btn-danger" onClick={()=>deleteOperation.mutate(operation.id)}>Sí</button><button className="btn btn-ghost" onClick={()=>setDeleteOperationId(null)}>No</button></div>:<button className="btn btn-ghost" aria-label={`Eliminar operación de ${operation.ticker}`} onClick={()=>setDeleteOperationId(operation.id)}>Eliminar</button>}</article>)}{operations.length===0&&<Empty>Aún no hay operaciones personales.</Empty>}</div></div>}
  {tab==="asignacion"&&<div className="portfolio-section"><div className="allocation-summary"><div><span>Valor actual</span><strong>{money(totalValue)}</strong></div><div><span>Costo invertido</span><strong>{money(totalCost)}</strong></div><div><span>Resultado</span><strong className={totalGain>=0?"text-[var(--good)]":"text-[var(--accent)]"}>{money(totalGain)}</strong></div></div><form className="threshold-form" onSubmit={event=>{event.preventDefault();const data=new FormData(event.currentTarget);saveThreshold.mutate(Number(data.get("threshold")))}}><label>Alerta si la desviación supera<input className="input" name="threshold" type="number" min="0" max="100" step="0.5" defaultValue={tracker.data?.deviationThreshold??5} aria-label="Umbral de desviación en puntos porcentuales"/></label><span>puntos porcentuales</span><button className="btn btn-ghost" disabled={saveThreshold.isPending}>Guardar umbral</button></form>{positions.length?<div className="position-list">{positions.map(position=><PositionEditor key={position.ticker} position={position} threshold={tracker.data?.deviationThreshold??5} saving={savePreference.isPending} onSave={data=>savePreference.mutate(data)}/>)}</div>:<Empty>Las posiciones aparecerán cuando registres tu primera compra.</Empty>}</div>}
  {tab==="metas"&&<div className="portfolio-section"><form className="goal-form" onSubmit={event=>{event.preventDefault();const form=event.currentTarget;const data=new FormData(form);addGoal.mutate({name:String(data.get("name")),targetAmount:Number(data.get("targetAmount"))},{onSuccess:()=>form.reset()})}}><div><h2>Nueva meta</h2><p>Define cuánto quieres reunir y registra tus abonos.</p></div><Field name="name" label="Nombre de la meta"/><Field name="targetAmount" label="Objetivo (MXN)" type="number"/><button className="btn btn-primary" disabled={addGoal.isPending}>Crear meta</button></form><div className="goals-grid">{tracker.data?.goals.map(goal=><GoalCard key={goal.id} goal={goal} onAdd={data=>addContribution.mutate(data)} onDeleteContribution={id=>deleteContribution.mutate(id)} onDeleteGoal={id=>deleteGoal.mutate(id)} pending={addContribution.isPending||deleteGoal.isPending}/>)}</div>{tracker.data?.goals.length===0&&<Empty>Aún no hay metas de inversión.</Empty>}</div>}
  {tab==="catalogo"&&<div className="portfolio-section"><div className="section-title"><div><h2>Catálogo de FIBRAs</h2><p>Las mismas emisoras y cotizaciones del mercado de FibrasMX.</p></div></div><div className="portfolio-catalog">{items.map(item=><article key={item.ticker}><Icon f={item} size={54}/><div><h3>{item.ticker}</h3><p>{item.fullName} · {item.sector}</p></div><div className="catalog-price"><PriceValue f={item}/><small>{quoteTime(item)}</small></div></article>)}</div></div>}
 </section>
}

function SummaryCard({label,value,tone}:{label:string;value:string;tone?:"good"|"bad"}){return <article><p>{label}</p><strong className={tone==="good"?"text-[var(--good)]":tone==="bad"?"text-[var(--accent)]":""}>{value}</strong></article>}
function PositionEditor({position,threshold,saving,onSave}:{position:ComputedPosition;threshold:number;saving:boolean;onSave:(data:{ticker:string;manualPrice:number|null;targetPercent:number})=>void}){const deviation=Math.abs(position.share-position.targetPercent);const alert=deviation>threshold;return <article className={`position-card ${alert?"off-target":""}`}><header><div><h2>{position.ticker}</h2><p>{position.name}</p></div><div className="position-share"><strong>{position.share.toFixed(1)}%</strong><span>del portafolio</span></div></header><div className="position-metrics"><RowMini k="CBFIs" v={position.quantity.toLocaleString("es-MX",{maximumFractionDigits:4})}/><RowMini k="Precio promedio" v={money(position.averageCost)}/><RowMini k="Precio actual" v={money(position.currentPrice)}/><RowMini k="Valor actual" v={money(position.currentValue)}/><RowMini k="Ganancia / pérdida" v={`${money(position.gain)} · ${position.gainPercent.toFixed(1)}%`} tone={position.gain>=0?"good":"bad"}/></div><p className="price-source">{position.priceSource}{position.manualPrice!==null&&position.marketPrice!==null?` · Mercado: ${money(position.marketPrice)}`:""}</p><div className="target-track" aria-label={`Asignación actual ${position.share.toFixed(1)}%, objetivo ${position.targetPercent.toFixed(1)}%`}><span style={{width:`${Math.min(100,position.share)}%`}}/><i style={{left:`${Math.min(100,position.targetPercent)}%`}}/></div><div className="target-caption"><span>Actual {position.share.toFixed(1)}%</span><span>Objetivo {position.targetPercent.toFixed(1)}%</span></div>{alert&&<p className="allocation-alert" role="alert">Desviación de {deviation.toFixed(1)} puntos: supera tu umbral de {threshold.toFixed(1)}.</p>}<form className="position-edit-form" onSubmit={event=>{event.preventDefault();const data=new FormData(event.currentTarget);const manual=String(data.get("manualPrice")??"").trim();onSave({ticker:position.ticker,manualPrice:manual?Number(manual):null,targetPercent:Number(data.get("targetPercent"))})}}><label>Precio manual<input className="input" name="manualPrice" type="number" min="0.01" step="0.01" defaultValue={position.manualPrice??""} placeholder="Usar precio en vivo" aria-label={`Precio manual de ${position.ticker}`}/></label><label>Objetivo %<input className="input" name="targetPercent" type="number" min="0" max="100" step="0.1" defaultValue={position.targetPercent} aria-label={`Porcentaje objetivo de ${position.ticker}`}/></label><button className="btn btn-ghost" disabled={saving}>Guardar</button></form></article>}
function GoalCard({goal,onAdd,onDeleteContribution,onDeleteGoal,pending}:{goal:PortfolioTracker["goals"][number];onAdd:(data:{goalId:number;amount:number;contributionDate:string;note?:string})=>void;onDeleteContribution:(id:number)=>void;onDeleteGoal:(id:number)=>void;pending:boolean}){const [confirmDelete,setConfirmDelete]=useState(false);const saved=goal.contributions.reduce((sum,row)=>sum+row.amount,0);const progress=Math.min(100,saved/goal.targetAmount*100);return <article className="goal-card"><header><div><h2>{goal.name}</h2><p>{money(saved)} de {money(goal.targetAmount)}</p></div><strong>{progress.toFixed(0)}%</strong></header><div className="goal-progress" role="progressbar" aria-label={`Progreso de ${goal.name}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><span style={{width:`${progress}%`}}/></div><form onSubmit={event=>{event.preventDefault();const form=event.currentTarget;const data=new FormData(form);onAdd({goalId:goal.id,amount:Number(data.get("amount")),contributionDate:String(data.get("contributionDate")),note:String(data.get("note")||"")||undefined});form.reset()}}><Field name="amount" label="Abono (MXN)" type="number"/><Field name="contributionDate" label="Fecha" type="date" defaultValue={localDateValue()}/><OptionalField name="note" label="Nota (opcional)"/><button className="btn btn-primary" disabled={pending}>Registrar abono</button></form>{goal.contributions.length>0&&<div className="contribution-list">{goal.contributions.map(row=><div key={row.id}><span><b>{money(row.amount)}</b><small>{new Date(`${row.contributionDate}T12:00:00`).toLocaleDateString("es-MX")}{row.note?` · ${row.note}`:""}</small></span><button aria-label={`Eliminar abono de ${money(row.amount)}`} onClick={()=>onDeleteContribution(row.id)}>Eliminar</button></div>)}</div>}<div className="goal-delete">{confirmDelete?<><span>Se eliminarán también sus abonos.</span><button className="btn btn-danger" onClick={()=>onDeleteGoal(goal.id)}>Confirmar</button><button className="btn btn-ghost" onClick={()=>setConfirmDelete(false)}>Cancelar</button></>:<button className="btn btn-ghost" onClick={()=>setConfirmDelete(true)}>Eliminar meta</button>}</div></article>}
function RowMini({k,v,tone}:{k:string;v:ReactNode;tone?:'good'|'bad'}){return <div><p className="text-xs text-[var(--dim)]">{k}</p><div className={`metric font-bold ${tone==='good'?'text-[var(--good)]':tone==='bad'?'text-[var(--accent)]':''}`}>{v}</div></div>}

function OperationalMetricCard({label,metric}:{label:string;metric:Market["occupancy"]}){
 const width=metric.percent===null?null:Math.max(0,Math.min(100,metric.percent));
 return <article className="operational-card"><p className="metric-label">{label}</p><p className="operational-value">{metric.value}</p>{metric.detail&&<p className="operational-detail">{metric.detail}</p>}{width!==null&&<div className="occupancy-track" role="progressbar" aria-label={`${label}: ${metric.value}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={width}><span style={{width:`${width}%`}}/></div>}<p className="source-line">Referencia capturada · {metric.source}, {metric.date}</p></article>
}
function OperationsSnapshot({f,includeMarketMetrics=true}:{f:Market;includeMarketMetrics?:boolean}){return <section className="operations-snapshot"><div className="operations-heading"><h2>Ficha rápida</h2><p>Datos operativos con fuente y fecha de corte.</p></div><div className="operational-grid"><OperationalMetricCard label="Ocupación" metric={f.occupancy}/><OperationalMetricCard label="Número de propiedades" metric={f.properties}/></div>{includeMarketMetrics&&<div className="quick-grid supporting-metrics"><RowMini k="Yield anual" v={f.annualYield}/><RowMini k="Volumen" v="—"/><RowMini k="Máx. 52 sem" v={money(f.week52High)}/><RowMini k="Mín. 52 sem" v={money(f.week52Low)}/></div>}</section>}

function ReportCard({report,sessionId,onChanged}:{report:ReportItem;sessionId:string;onChanged:()=>void}){const [editing,setEditing]=useState(false);const [confirming,setConfirming]=useState(false);const [message,setMessage]=useState("");const update=useMutation({mutationFn:(x:{title:string;year:number;period:typeof PERIODS[number]})=>api.updateReport({id:report.id,sessionId,...x}),onSuccess:()=>{setEditing(false);setMessage("Cambios guardados.");onChanged()},onError:e=>setMessage(String(e))});const remove=useMutation({mutationFn:()=>api.deleteReport({id:report.id,sessionId}),onSuccess:onChanged,onError:e=>{setConfirming(false);setMessage(String(e))}});const submit=(e:FormEvent<HTMLFormElement>)=>{e.preventDefault();const f=new FormData(e.currentTarget);update.mutate({title:String(f.get("title")),year:Number(f.get("year")),period:String(f.get("period")) as typeof PERIODS[number]})};return <article className="panel p-4"><div className="report-row"><div><div className="flex flex-wrap items-center gap-2"><p className="font-bold">{report.title}</p>{report.origin==="official"&&<span className="report-source-badge">{report.sourceName}</span>}</div><p className="text-sm text-[var(--dim)]">{report.year} · {report.period}{report.origin==="uploaded"?` · ${(report.sizeBytes/1_000_000).toFixed(1)} MB`:" · enlace oficial"}</p></div><a className="btn btn-ghost inline-grid place-items-center" href={report.downloadUrl} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer">{report.isPdf?"Abrir PDF":"Abrir reporte"}</a></div>{report.canManage&&<div className="manage-actions mt-3 border-t hairline pt-3"><button className="btn btn-ghost" onClick={()=>{setEditing(true);setConfirming(false);setMessage("")}}>Editar</button><button className="btn btn-danger" onClick={()=>{setConfirming(true);setEditing(false);setMessage("")}}>Borrar</button></div>}{editing&&<form className="editor-form mt-4" onSubmit={submit}><Field name="title" label="Título del reporte" defaultValue={report.title}/><div className="grid gap-3 sm:grid-cols-2"><Field name="year" label="Año" type="number" defaultValue={String(report.year)}/><SelectField name="period" label="Periodo" options={[report.period,...PERIODS.filter(p=>p!==report.period)]}/></div><div className="manage-actions"><button className="btn btn-primary" disabled={update.isPending}>{update.isPending?"Guardando…":"Guardar cambios"}</button><button className="btn btn-ghost" type="button" onClick={()=>setEditing(false)}>Cancelar</button></div></form>}{confirming&&<div className="confirm-panel mt-4" role="alert"><p>¿Borrar “{report.title}”? El PDF también se quitará de este perfil.</p><div className="manage-actions mt-3"><button className="btn btn-danger" disabled={remove.isPending} onClick={()=>remove.mutate()}>{remove.isPending?"Borrando…":"Sí, borrar"}</button><button className="btn btn-ghost" onClick={()=>setConfirming(false)}>Cancelar</button></div></div>}{message&&<p className="mt-3 text-sm" role="status">{message}</p>}</article>}

function ReportsPanel({reports,sessionId,onChanged}:{reports:ReportItem[];sessionId:string;onChanged:()=>void}){const groups=[{key:"propio",title:"Publicados por ti",description:"Tus archivos se conservan y puedes editarlos o borrarlos."},{key:"vigente",title:"Reporte vigente",description:"Último reporte oficial localizado para esta FIBRA."},{key:"historico",title:"Archivo histórico",description:"Reportes 2020–2021 conservados por AMEFIBRA."}] as const;return <div className="space-y-6">{groups.map(group=>{const entries=reports.filter(report=>report.collection===group.key);if(entries.length===0)return null;return <section key={group.key} aria-labelledby={`reports-${group.key}`}><div className="mb-3"><h3 id={`reports-${group.key}`} className="display text-2xl">{group.title}</h3><p className="text-sm text-[var(--dim)]">{group.description}</p></div><div className="space-y-3">{entries.map(report=><ReportCard key={`${report.collection}-${report.id}`} report={report} sessionId={sessionId} onChanged={onChanged}/>)}</div></section>})}{reports.length===0&&<Empty>No hay reportes disponibles para esta FIBRA.</Empty>}</div>}

function InfoBlock({children}:{children:string}){return <aside className="info-block"><b>Para leer este dato</b><p>{children}</p></aside>}
function SourceLine({f}:{f:Market}){return <p className="source-line">Referencia capturada · {f.referenceSource}, {f.referenceDate}</p>}
function ReferenceMetric({label,value,detail,f}:{label:string;value:string;detail?:string;f:Market}){return <article className="reference-metric"><p className="metric-label">{label}</p><p className="metric-value">{value}</p>{detail&&<p className="metric-detail">{detail}</p>}<SourceLine f={f}/></article>}
function FinancialSnapshot({f}:{f:Market}){return <div className="reference-grid"><article className="reference-metric"><p className="metric-label">{f.quoteState==="unavailable"?"Precio de referencia":"Cotización de mercado"}</p><PriceValue f={f} className="metric-value"/><p className={`metric-detail font-bold ${quoteTone(f)}`}>{quoteChange(f)}</p><p className="source-line">{quoteTime(f)}{f.quoteState==="cached"?" · último dato disponible":""}</p>{f.sourceUrl&&<a className="source-link" href={f.sourceUrl} target="_blank" rel="noreferrer">Ver fuente</a>}</article><ReferenceMetric label="Última distribución" value={f.lastDistribution} detail={f.lastPaymentDate} f={f}/><ReferenceMetric label="Distribuido últimos 12 meses" value={f.distributed12m} f={f}/><ReferenceMetric label="Yield anualizado aproximado" value={f.annualYield} f={f}/><ReferenceMetric label="Frecuencia de pago" value={f.paymentFrequency} f={f}/>{f.distributionNote&&<aside className="reference-note"><b>Nota</b><p>{f.distributionNote}</p><SourceLine f={f}/></aside>}</div>}
function formatDistribution(value:number,currency:"MXN"|"USD"){const amount=value.toLocaleString("es-MX",{minimumFractionDigits:2,maximumFractionDigits:6});return `${currency==="USD"?"USD$":"$"}${amount}`}
function DistributionHistoryBlock({ticker}:{ticker:string}){
 const item=DISTRIBUTION_HISTORY[ticker];
 if(!item)return null;
 const chartData=item.values.map((value,index)=>({event:index+1,value}));
 const hasSeries=item.values.filter(value=>value!==null).length>1;
 return <section className="distribution-history" aria-labelledby={`history-title-${ticker}`}>
  <header className="distribution-history-head"><div><p>ÚLTIMOS 2 AÑOS</p><h2 id={`history-title-${ticker}`}>Historial de distribuciones (2 años)</h2></div><span>{item.frequency}</span></header>
  <div className="distribution-summary"><div><small>Tendencia</small><strong>{item.trend}</strong>{item.trendDetail&&<p>{item.trendDetail}</p>}</div><div><small>Predictibilidad</small><strong>{item.predictability}</strong><p>Basada únicamente en la regularidad de esta serie.</p></div></div>
  {hasSeries&&<div className="distribution-chart" role="img" aria-label={`Mini-gráfica de pagos históricos de ${ticker}, en orden cronológico`}><ResponsiveContainer width="100%" height="100%"><LineChart data={chartData} margin={{top:12,right:10,bottom:4,left:0}}><YAxis hide domain={["dataMin","dataMax"]}/><Tooltip formatter={(value)=>[typeof value==="number"?formatDistribution(value,item.currency):"Sin registro","Pago"]} labelFormatter={label=>`Evento ${label}`}/><Line type="linear" dataKey="value" stroke="#ef1735" strokeWidth={2} dot={{r:3,fill:"#0b0b0c",stroke:"#ef1735",strokeWidth:2}} connectNulls={false}/></LineChart></ResponsiveContainer></div>}
  {item.values.length>0?<ol className="distribution-values" aria-label="Pagos en orden cronológico">{item.values.map((value,index)=><li key={`${ticker}-${index}`} className={value===null?"gap":""}><span>{String(index+1).padStart(2,"0")}</span><b>{value===null?(item.gapLabel??"Sin registro"):formatDistribution(value,item.currency)}</b></li>)}</ol>:<div className="distribution-empty">—</div>}
  <aside className={`distribution-note ${item.emphasis?"emphasis":""}`}>{item.emphasis&&<b>{item.emphasis}</b>}<p>{item.note}</p></aside>
  <p className="distribution-source">Referencia capturada · {item.source}, 17-sep-2026</p>
 </section>
}
const SECTOR_COLORS:Record<string,string>={Diversificado:"#ef1735",Industrial:"#f07818",Comercial:"#dfb23c",Hotelero:"#d05b76",Hipotecario:"#6d8ec7",Educativo:"#4c9f90",Almacenaje:"#9b7db8",Energía:"#e07734",Infraestructura:"#778899"};
function ProfileView({ticker,items,sessionId,onBack,onSelect}:{ticker:string;items:Market[];sessionId:string;onBack:()=>void;onSelect:(ticker:string)=>void}){
 const f=items.find(x=>x.ticker===ticker);const [tab,setTab]=useState("Resumen");const [period,setPeriod]=useState<"30d"|"90d"|"1y"|"5y">("30d");const qc=useQueryClient();
 const reports=useQuery({queryKey:["reports",ticker,sessionId],queryFn:()=>api.listReports({ticker,sessionId})});const videos=useQuery({queryKey:["videos",ticker,sessionId],queryFn:()=>api.listVideos({ticker,sessionId})});
 const history=useQuery({queryKey:["history",ticker,period],queryFn:()=>api.getHistory({ticker,period}),enabled:period!=="30d"&&ticker!=="SOMA18"&&ticker!=="TERRA13"});
 const [alertPrice,setAlertPrice]=useState("");const [direction,setDirection]=useState<"above"|"below">("above");if(!f)return <Empty>No se encontró esta FIBRA.</Empty>;
 const tabs=["Resumen","Pagos","Valuación","Ocupación","Videos","Reportes"];const chart=period==="30d"?f.history:(history.data?.history??[]);const related=items.filter(x=>x.ticker!==ticker&&x.sector===f.sector&&!x.delisted).slice(0,3);const updated=f.asOf?new Date(f.asOf):null;
 return <section><button className="btn btn-ghost" onClick={onBack}>← Volver</button>
 <div className="logo-rail mt-4" aria-label="Cambiar de perfil">{items.filter(x=>!x.delisted).map(x=><button key={x.ticker} className={x.ticker===ticker?"active":""} onClick={()=>{setPeriod("30d");onSelect(x.ticker)}} aria-label={`Abrir ${x.fullName}`} data-profile={x.ticker}><Icon f={x} size={42}/><span>{x.ticker}</span></button>)}</div>
 <div className="profile-head mt-5 flex items-start gap-4" style={{borderColor:SECTOR_COLORS[f.sector]??"var(--accent)"}}><Icon f={f} size={104}/><div><p className="text-xs text-[var(--accent)]">{f.sector}</p><h1 className="display text-4xl">{f.fullName}</h1><p className="text-sm text-[var(--dim)]">{f.ticker} · {f.exchange}</p>{f.exchange==='BIVA'&&<span className="mt-2 inline-flex border border-[var(--border)] px-2 py-1 text-[10px] text-[var(--dim)]">Emisora listada en BIVA</span>}</div></div>
 <FinancialSnapshot f={f}/>
 <form className="inline-alert mt-4" onSubmit={e=>{e.preventDefault();api.addAlert({sessionId,ticker,targetPrice:Number(alertPrice),direction}).then(()=>{setAlertPrice('');qc.invalidateQueries({queryKey:['workspace',sessionId]})})}}><b>Crear alerta para {ticker}</b><input className="input" aria-label="Precio objetivo" type="number" min="0.01" step="0.01" value={alertPrice} onChange={e=>setAlertPrice(e.target.value)} required/><select className="input" aria-label="Tipo de alerta" value={direction} onChange={e=>setDirection(e.target.value as "above"|"below")}><option value="above">Al superar</option><option value="below">Al bajar de</option></select><button className="btn btn-primary">Crear</button></form>
 <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">{tabs.map(t=><button key={t} className="tab" aria-selected={tab===t} onClick={()=>setTab(t)}>{t}</button>)}</div>
 <div className="mt-6">{tab==='Resumen'&&<><InfoBlock>Precio y rendimiento deben leerse junto con liquidez, deuda y reportes oficiales. Ningún dato aislado determina conveniencia.</InfoBlock><OperationsSnapshot f={f}/><div className="panel mt-4 p-4"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs text-[var(--dim)]">PRECIO HISTÓRICO</p><div className="display metric mt-1 text-5xl">{f.delisted?'Deslistada':<PriceValue f={f}/>}</div></div><div className="flex gap-1">{([['30d','30D'],['90d','90D'],['1y','1A'],['5y','5A']] as const).map(([v,l])=><button key={v} className="chip" aria-pressed={period===v} onClick={()=>setPeriod(v)}>{l}</button>)}</div></div>{chart.length>1?<div className="mt-5 h-56"><ResponsiveContainer width="100%" height="100%"><LineChart data={chart}><XAxis dataKey="date" hide/><YAxis domain={['auto','auto']} width={46} tick={{fill:'#aaa',fontSize:11}}/><Tooltip contentStyle={{background:'#111',border:'1px solid #333'}}/><Line dataKey="close" stroke="#ef1735" dot={false}/></LineChart></ResponsiveContainer></div>:<Empty>No hay serie disponible para este periodo.</Empty>}<p className="mt-3 text-xs text-[var(--dim)]">Referencia capturada · {f.exchange==='BIVA'?'SA-TAFE / BIVA':'Yahoo Finance'}, {updated?updated.toLocaleDateString('es-MX'):'sin fecha'}</p></div></>}
 {tab==='Pagos'&&<><InfoBlock>Confirma fechas ex‑derecho, registro y pago en el reporte oficial. Los pagos pasados no garantizan distribuciones futuras.</InfoBlock><div className="reference-grid mt-4"><ReferenceMetric label="Última distribución" value={f.lastDistribution} detail={f.lastPaymentDate} f={f}/><ReferenceMetric label="Total distribuido · 12 meses" value={f.distributed12m} f={f}/><ReferenceMetric label="Yield anualizado aproximado" value={f.annualYield} f={f}/><ReferenceMetric label="Frecuencia" value={f.paymentFrequency} f={f}/>{f.distributionNote&&<aside className="reference-note"><b>Nota de la distribución</b><p>{f.distributionNote}</p><SourceLine f={f}/></aside>}</div><DistributionHistoryBlock ticker={ticker}/></>}
 {tab==='Valuación'&&<><InfoBlock>Valuación sin atajos: un yield alto por sí solo no determina si un instrumento es conveniente.</InfoBlock><div className="panel grid gap-4 p-5 sm:grid-cols-2"><RowMini k={f.quoteState==="unavailable"?"Precio de referencia":"Cotización"} v={<PriceValue f={f}/>}/><RowMini k="Variación de la sesión" v={quoteChange(f)} tone={(f.changePercent??0)>=0?'good':'bad'}/><RowMini k="Yield anualizado" v={f.annualYield}/><RowMini k="Mínimo 52 semanas" v={money(f.week52Low)}/><RowMini k="Máximo 52 semanas" v={money(f.week52High)}/><div className="sm:col-span-2"><p className="source-line">{quoteTime(f)}{f.quoteState==="unavailable"?` · referencia: ${f.referenceSource}`:""}</p></div></div></>}
 {tab==='Ocupación'&&<><InfoBlock>La ocupación cambia por portafolio y periodo. Compara siempre la misma definición y fecha de corte.</InfoBlock><OperationsSnapshot f={f} includeMarketMetrics={false}/></>}
 {tab==='Videos'&&<div className="grid gap-4 md:grid-cols-2">{videos.data?.videos.map(v=><VideoCard key={v.id} v={v} sessionId={sessionId} onChanged={()=>qc.invalidateQueries({queryKey:["videos",ticker,sessionId]})}/>)}{videos.data?.videos.length===0&&<Empty>Aún no has publicado videos para esta FIBRA.</Empty>}</div>}
 {tab==='Reportes'&&<ReportsPanel reports={reports.data?.reports??[]} sessionId={sessionId} onChanged={()=>qc.invalidateQueries({queryKey:["reports",ticker,sessionId]})}/>}</div>
 {related.length>0&&<section className="mt-10"><h2 className="display text-2xl">FIBRAs relacionadas por sector</h2><p className="text-xs text-[var(--dim)]">Mismo sector: {f.sector}. No es una recomendación de compra o venta.</p><div className="mt-3 grid gap-3 sm:grid-cols-3">{related.map(x=><button className="panel flex items-center gap-3 p-3 text-left" key={x.ticker} onClick={()=>onSelect(x.ticker)}><Icon f={x} size={48}/><span><b>{x.fullName}</b><small className="block text-[var(--dim)]">{x.ticker}</small></span></button>)}</div></section>}</section>}
