import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Explore from './pages/Explore';
import Chat from './pages/Chat';
import ChatConversation from './pages/ChatConversation';
import Profile from './pages/Profile';
import { useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import ScrollToTop from './components/ScrollToTop';

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactElement }) => {
  const auth = useAuth();
  
  if (auth.loading) {
    return <div className="flex items-center justify-center h-screen">در حال بارگذاری...</div>;
  }
  
  if (!auth.user) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

// Auth route component (redirects to chat if already logged in)
const AuthRoute = ({ children }: { children: React.ReactElement }) => {
  const auth = useAuth();
  
  if (auth.loading) {
    return <div className="flex items-center justify-center h-screen">در حال بارگذاری...</div>;
  }
  
  if (auth.user) {
    return <Navigate to="/chat" />;
  }
  
  return children;
};

// Add this component before the AppWithAuth component
const ConditionalRedirect = () => {
  const auth = useAuth();
  
  if (auth.loading) {
    return <div className="flex items-center justify-center h-screen">در حال بارگذاری...</div>;
  }
  
  return <Navigate to={auth.user ? "/chat" : "/explore"} />;
};

// App wrapper to use auth context
const AppWithAuth = () => {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={
            <ConditionalRedirect />
          } />
          <Route path="/login" element={
            <AuthRoute>
              <Login />
            </AuthRoute>
          } />
          <Route path="/register" element={
            <AuthRoute>
              <Register />
            </AuthRoute>
          } />
          <Route path="/explore" element={<Explore />} />
          <Route path="/chat" element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          }>
            <Route path=":id" element={<ChatConversation />} />
          </Route>
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
        </Route>
      </Routes>
      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
            padding: '16px',
            borderRadius: '10px',
          },
          success: {
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </>
  );
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <AppWithAuth />
      </AuthProvider>
    </Router>
  );
};

export default App;