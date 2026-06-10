import { useAppStore } from './store/useAppStore';
import Home from './pages/Home';
import MemeWizard from './pages/MemeWizard';
import GeneralWizard from './pages/GeneralWizard';
import PortfolioWizard from './pages/PortfolioWizard';
import FeedWriter from './pages/FeedWriter';
import OOTDWizard from './pages/OOTDWizard';

function Footer() {
  return (
    <footer className="w-full py-5 flex items-center justify-center gap-2 text-xs text-gray-300">
      <span>© 2026 MJ</span>
      <span>·</span>
      <a
        href="https://www.instagram.com/minday8910/"
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-gray-500 transition-colors"
      >
        @minday8910
      </a>
    </footer>
  );
}

export default function App() {
  const page = useAppStore((s) => s.page);

  return (
    <>
      {page === 'meme' && <MemeWizard />}
      {page === 'general' && <GeneralWizard />}
      {page === 'portfolio' && <PortfolioWizard />}
      {page === 'feed' && <FeedWriter />}
      {page === 'ootd' && <OOTDWizard />}
      {!['meme', 'general', 'portfolio', 'feed', 'ootd'].includes(page) && <Home />}
      <Footer />
    </>
  );
}
