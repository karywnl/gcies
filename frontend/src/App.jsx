import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import ExplorePage from './pages/ExplorePage';
import LocationPage from './pages/LocationPage';
import './App.css';

function AppInner() {
  const location = useLocation();
  const isExplore = location.pathname === '/explore';

  return (
    <>
      <div className="grid-bg"></div>
      <Navbar />
      <main style={isExplore
        ? { minHeight: '100vh' }
        : { minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10rem 1rem 3rem 1rem' }
      }>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/location/:encodedName" element={<LocationPage />} />
        </Routes>
      </main>
    </>
  );
}

function App() {
  return (
    <Router>
      <AppInner />
    </Router>
  );
}

export default App;
