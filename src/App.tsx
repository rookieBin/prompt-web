import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import AppLayout from './components/Layout';
import PromptSquare from './pages/PromptSquare';
import PromptOptimizer from './pages/PromptOptimizer';
import './App.css';

function AppContent() {
  const { theme: currentTheme } = useTheme();

  return (
    <ConfigProvider
      theme={{
        algorithm: currentTheme === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#177ddc',
          ...(currentTheme === 'dark' ? {
            colorBgBase: '#141414',
            colorBgContainer: '#1f1f1f',
            colorBorder: '#303030',
            colorText: 'rgba(255, 255, 255, 0.85)',
            colorTextSecondary: 'rgba(255, 255, 255, 0.65)',
          } : {
            colorBgBase: '#ffffff',
            colorBgContainer: '#fafafa',
            colorBorder: '#d9d9d9',
            colorText: 'rgba(0, 0, 0, 0.85)',
            colorTextSecondary: 'rgba(0, 0, 0, 0.65)',
          }),
        },
      }}
    >
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<PromptSquare />} />
            <Route path="/optimizer" element={<PromptOptimizer />} />
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
