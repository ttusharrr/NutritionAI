/**
 * App — Root component for the Professional Web-App.
 * This codebase is isolated from the Mobile-App project.
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './context/AuthContext';
import { Analytics } from '@vercel/analytics/react';

// Layouts
import AuthLayout from './components/auth/AuthLayout';

// Auth pages
import LoginPage from './components/auth/LoginPage';
import SignupPage from './components/auth/SignupPage';
import VerifyOTPPage from './components/auth/VerifyOTPPage';
import ForgotPasswordPage from './components/auth/ForgotPasswordPage';
import ResetPasswordPage from './components/auth/ResetPasswordPage';

// Protected pages
import ProtectedRoute from './components/common/ProtectedRoute';
import ProfileSetup from './components/profile/ProfileSetup';

// Web Optimized Components
import Dashboard from './components/web/Dashboard';
import DietPlan from './components/web/DietPlan';
import ChatBot from './components/web/ChatBot';
import AboutPage from './components/web/AboutPage';
import SettingsPage from './components/web/SettingsPage';
import ProfilePage from './components/web/ProfilePage';
import LandingPage from './components/web/LandingPage';
import { useAuth } from './context/AuthContext';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function ChatBotWrapper() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return null;
  return <ChatBot />;
}

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <AuthProvider>
          <Analytics />
          <Routes>
            {/* Auth Routes */}
            <Route path="/auth/login" element={<AuthLayout><LoginPage /></AuthLayout>} />
            <Route path="/auth/signup" element={<AuthLayout><SignupPage /></AuthLayout>} />
            <Route path="/auth/verify" element={<AuthLayout><VerifyOTPPage /></AuthLayout>} />
            <Route path="/auth/forgot-password" element={<AuthLayout><ForgotPasswordPage /></AuthLayout>} />
            <Route path="/auth/reset-password" element={<AuthLayout><ResetPasswordPage /></AuthLayout>} />

            {/* Protected Web Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute><Dashboard /></ProtectedRoute>
            } />
            
            <Route path="/profile-setup" element={
              <ProtectedRoute><ProfileSetup /></ProtectedRoute>
            } />

            <Route path="/profile" element={
              <ProtectedRoute><ProfilePage /></ProtectedRoute>
            } />

            <Route path="/diet-plan" element={
              <ProtectedRoute><DietPlan /></ProtectedRoute>
            } />

            <Route path="/about" element={
              <ProtectedRoute><AboutPage /></ProtectedRoute>
            } />

            <Route path="/settings" element={
              <ProtectedRoute><SettingsPage /></ProtectedRoute>
            } />

            {/* Default redirect / Landing */}
            <Route path="/" element={<LandingPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <ChatBotWrapper />
        </AuthProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}
