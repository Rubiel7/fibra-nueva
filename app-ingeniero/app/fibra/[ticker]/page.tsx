import Header from '@/app/components/header';
import Footer from '@/app/components/footer';
import FibraDetailClient from './detail-client';
import { FIBRAS_DATA } from '@/lib/fibras-data';

export async function generateStaticParams() {
  return FIBRAS_DATA.map((f) => ({ ticker: f.ticker }));
}

export default function FibraDetailPage({ params }: { params: { ticker: string } }) {
  return (
    <>
      <Header />
      <FibraDetailClient ticker={params?.ticker ?? ''} />
      <Footer />
    </>
  );
}
