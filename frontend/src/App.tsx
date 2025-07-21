import './index.css'; // keep Tailwind if you're using it
import { Search } from './components/Search';
import { Watchlist } from './components/Watchlist';

function App() {
  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-bold mb-6">🎬 What Are You Watching?</h1>
      <Search />
      <Watchlist />
    </main>
  );
}

export default App;

