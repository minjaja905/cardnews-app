import { useAppStore } from './store/useAppStore';
import Home from './pages/Home';
import MemeWizard from './pages/MemeWizard';
import GeneralWizard from './pages/GeneralWizard';
import PortfolioWizard from './pages/PortfolioWizard';
import FeedWriter from './pages/FeedWriter';
import OOTDWizard from './pages/OOTDWizard';

export default function App() {
  const page = useAppStore((s) => s.page);

  if (page === 'meme') return <MemeWizard />;
  if (page === 'general') return <GeneralWizard />;
  if (page === 'portfolio') return <PortfolioWizard />;
  if (page === 'feed') return <FeedWriter />;
  if (page === 'ootd') return <OOTDWizard />;
  return <Home />;
}
