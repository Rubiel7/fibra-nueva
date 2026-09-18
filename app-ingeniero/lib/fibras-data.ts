export interface FibraStaticData {
  ticker: string;
  yahooTicker: string;
  name: string;
  fullName: string;
  sector: string;
  icon: string;
  color: string;
  description: string;
  properties: string;
  staticDiv: string;
  staticOcc: string;
  logo: string;
}

export const SECTOR_COLORS: Record<string, string> = {
  Diversificado: '#e8003a',
  Industrial: '#0099ff',
  Comercial: '#9b59b6',
  Hotelero: '#1abc9c',
  Hipotecario: '#795548',
  Educativo: '#3f51b5',
  Almacenaje: '#ff9800',
  'Energía': '#00897b',
  Infraestructura: '#546e7a',
};

export const FIBRAS_DATA: FibraStaticData[] = [
  {
    ticker: 'FUNO11', yahooTicker: 'FUNO11.MX', name: 'FUNO', fullName: 'Fibra Uno',
    sector: 'Diversificado', icon: '🏢', color: '#e8003a', logo: '/logos/funo.png',
    description: 'La FIBRA más grande de México. Portafolio diversificado con propiedades de oficinas, retail e industrial en todo el país. Referente histórico del mercado desde 2011.',
    properties: '640+', staticDiv: '$2.40', staticOcc: '95.4%',
  },
  {
    ticker: 'FIBRAPL14', yahooTicker: 'FIBRAPL14.MX', name: 'Prologis', fullName: 'Fibra Prologis',
    sector: 'Industrial', icon: '🏭', color: '#0099ff', logo: '/logos/fibrapl.png',
    description: 'Líder en naves industriales y logísticas. Fuerte exposición al nearshoring con presencia en los principales parques industriales de México.',
    properties: '80+', staticDiv: '$4.07', staticOcc: '97.0%',
  },
  {
    ticker: 'FIBRAMQ12', yahooTicker: 'FIBRAMQ12.MX', name: 'Macquarie', fullName: 'Fibra Macquarie',
    sector: 'Industrial', icon: '🏗️', color: '#ff6b00', logo: '/logos/fibramq.png',
    description: 'Portafolio industrial diversificado con parques en el norte y centro del país. Uno de los mayores propietarios de naves industriales.',
    properties: '260+', staticDiv: '$2.45', staticOcc: '96.0%',
  },
  {
    ticker: 'DANHOS13', yahooTicker: 'DANHOS13.MX', name: 'Danhos', fullName: 'Fibra Danhos',
    sector: 'Comercial', icon: '🛍️', color: '#9b59b6', logo: '/logos/danhos.png',
    description: 'Centros comerciales premium en Ciudad de México. Toreo Parque Central, Parque Tepeyac y Vía Vallejo son sus activos insignia.',
    properties: '12', staticDiv: '$1.80', staticOcc: '93.5%',
  },
  {
    ticker: 'FSHOP13', yahooTicker: 'FSHOP13.MX', name: 'FShop', fullName: 'Fibra Shop',
    sector: 'Comercial', icon: '🏪', color: '#e67e22', logo: '/logos/fshop.png',
    description: 'Fibra especializada en centros comerciales regionales y locales en varias ciudades de México.',
    properties: '30+', staticDiv: '$0.67', staticOcc: '92.0%',
  },
  {
    ticker: 'FINN13', yahooTicker: 'FINN13.MX', name: 'FINN', fullName: 'Fibra Inn',
    sector: 'Hotelero', icon: '🏨', color: '#1abc9c', logo: '/logos/finn.png',
    description: 'Portafolio hotelero con hoteles de negocios y turismo en CDMX, Cancún y destinos clave.',
    properties: '28', staticDiv: '$0.36', staticOcc: '68.0%',
  },
  {
    ticker: 'FIHO12', yahooTicker: 'FIHO12.MX', name: 'FibraHotel', fullName: 'Fibra Hotel',
    sector: 'Hotelero', icon: '🌴', color: '#00bcd4', logo: '/logos/fiho.png',
    description: 'La primera FIBRA hotelera de México listada en BMV. Hoteles de negocios y turismo en más de 30 ciudades.',
    properties: '85+', staticDiv: '$0.60', staticOcc: '60.1%',
  },
  {
    ticker: 'FMTY14', yahooTicker: 'FMTY14.MX', name: 'Fibra Mty', fullName: 'Fibra Monterrey',
    sector: 'Diversificado', icon: '🏙️', color: '#f39c12', logo: '/logos/fmty.png',
    description: 'FIBRA regiomontana diversificada con activos industriales, comerciales y de oficinas. Fuerte exposición al nearshoring en Nuevo León.',
    properties: '95+', staticDiv: '$0.49', staticOcc: '96.0%',
  },
  {
    ticker: 'FPLUS16', yahooTicker: 'FPLUS16.MX', name: 'FPlus', fullName: 'Fibra Plus',
    sector: 'Diversificado', icon: '➕', color: '#607d8b', logo: '/logos/fplus.png',
    description: 'FIBRA diversificada de menor capitalización con activos mixtos en diversas regiones.',
    properties: '40+', staticDiv: '$0.09', staticOcc: '93.1%',
  },
  {
    ticker: 'NEXT25', yahooTicker: 'NEXT20.MX', name: 'Fibra Next', fullName: 'Fibra Next',
    sector: 'Industrial', icon: '⚡', color: '#cddc39', logo: '/logos/next.png',
    description: 'FIBRA industrial de nueva generación enfocada 100% en el nearshoring. Parques de clase mundial.',
    properties: '50+', staticDiv: '$2.26', staticOcc: '97.7%',
  },
  {
    ticker: 'FNOVA17', yahooTicker: 'FNOVA17.MX', name: 'FNova', fullName: 'Fibra Nova',
    sector: 'Industrial', icon: '🔧', color: '#4caf50', logo: '/logos/fnova.png',
    description: 'Portafolio industrial especializado en el sector manufacturero y automotriz en el norte y centro de México.',
    properties: '55+', staticDiv: '$2.36', staticOcc: '95.0%',
  },
  {
    ticker: 'FHIPO14', yahooTicker: 'FHIPO14.MX', name: 'FHipo', fullName: 'FHipo Hipotecaria',
    sector: 'Hipotecario', icon: '🏠', color: '#795548', logo: '/logos/fhipo.png',
    description: 'Única FIBRA hipotecaria de México. Invierte en créditos hipotecarios residenciales.',
    properties: 'N/A', staticDiv: '$1.42', staticOcc: '—',
  },
  {
    ticker: 'EDUCA18', yahooTicker: 'EDUCA18.MX', name: 'Educa', fullName: 'Fibra Educa',
    sector: 'Educativo', icon: '🎓', color: '#3f51b5', logo: '/logos/educa.png',
    description: 'La única FIBRA educativa de México. Invierte en instalaciones universitarias y escolares con contratos de muy largo plazo.',
    properties: '20+', staticDiv: '$2.56', staticOcc: '98.0%',
  },
  {
    ticker: 'STORAGE18', yahooTicker: 'STORAGE18.MX', name: 'Storage', fullName: 'Fibra Storage',
    sector: 'Almacenaje', icon: '📦', color: '#ff9800', logo: '/logos/storage.png',
    description: 'FIBRA especializada en mini-bodegas y almacenamiento personal. Self-storage en expansión acelerada.',
    properties: '35+', staticDiv: '$2.42', staticOcc: '83.5%',
  },
  {
    ticker: 'FCFE18', yahooTicker: 'FCFE18.MX', name: 'Fibra CFE', fullName: 'Fibra CFE',
    sector: 'Energía', icon: '⚡', color: '#00897b', logo: '/logos/fcfe.png',
    description: 'FIBRA vinculada a la Comisión Federal de Electricidad. Infraestructura eléctrica nacional.',
    properties: 'N/A', staticDiv: '$2.10', staticOcc: '—',
  },
  {
    ticker: 'TERRA13', yahooTicker: 'TERRA13.MX', name: 'Terrafina', fullName: 'Terrafina',
    sector: 'Industrial', icon: '🏗️', color: '#8d6e63', logo: '/logos/terra.png',
    description: 'FIBRA industrial enfocada en propiedades logísticas e industriales en los principales corredores de manufactura de México.',
    properties: '280+', staticDiv: '$1.20', staticOcc: '95.8%',
  },
  {
    ticker: 'FMX23', yahooTicker: 'FMX23.MX', name: 'Fibra MX', fullName: 'Fibra MX Infraestructura',
    sector: 'Infraestructura', icon: '🛣️', color: '#546e7a', logo: '/logos/fcfe.png',
    description: 'FIBRA de infraestructura con activos en proyectos de infraestructura pública en México.',
    properties: 'N/A', staticDiv: '$0.43', staticOcc: '—',
  },
];

export const SECTORS = [
  'Todas', 'Diversificado', 'Industrial', 'Comercial', 'Hotelero',
  'Hipotecario', 'Educativo', 'Almacenaje', 'Energía', 'Infraestructura',
];

// Logo mapping for quick lookup
export const LOGO_MAP: Record<string, string> = {};
FIBRAS_DATA.forEach((f) => {
  LOGO_MAP[f.ticker] = f.logo;
});
