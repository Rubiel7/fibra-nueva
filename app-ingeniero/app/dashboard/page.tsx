import Header from '@/app/components/header';
import Footer from '@/app/components/footer';
import DashboardClient from './dashboard-client';

export default function DashboardPage() {
  return (
    <>
      <Header />
      <DashboardClient />
      <Footer />
    </>
  );
}
