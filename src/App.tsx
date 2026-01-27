import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { getAntdTheme } from './theme';
import AppLayout from './components/Layout';
import PromptSquare from './pages/PromptSquare';
import PromptOptimizer from './pages/PromptOptimizer';
import PromptWorkshop from './pages/PromptWorkshop';
import './App.css';

function AppContent() {
  const { theme: currentTheme } = useTheme();

  return (
    <ConfigProvider
      theme={getAntdTheme(currentTheme)}
    >
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<PromptSquare />} />
            <Route path="/optimizer" element={<PromptOptimizer />} />
            <Route path="/workshop" element={<PromptWorkshop />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </ConfigProvider>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
