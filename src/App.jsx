import { useAppStore } from './store/useAppStore';
import Home from './pages/Home';
import MemeWizard from './pages/MemeWizard';
import GeneralWizard from './pages/GeneralWizard';

export default function App() {
  const page = useAppStore((s) => s.page);

  if (page === 'meme') return <MemeWizard />;
  if (page === 'general') return <GeneralWizard />;
  return <Home />;
}
