import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { getAntdTheme } from './theme';
import AppLayout from './components/Layout';
import RequireAuth from './components/RequireAuth';
import PromptSquare from './pages/PromptSquare';
import PromptOptimizer from './pages/PromptOptimizer';
import PromptWorkshop from './pages/PromptWorkshop';
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import './App.css';

function AppContent() {
  const { theme: currentTheme } = useTheme();

  return (
    <ConfigProvider
      theme={getAntdTheme(currentTheme)}
    >
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            element={
              <RequireAuth>
                <AppLayout />
              </RequireAuth>
            }
          >
            <Route path="/" element={<PromptSquare />} />
            <Route path="/optimizer" element={<PromptOptimizer />} />
            <Route path="/workshop" element={<PromptWorkshop />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
