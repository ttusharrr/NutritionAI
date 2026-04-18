/**
 * App — Root component with routing.
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
import Dashboard from './components/dashboard/Dashboard';
import ProfileSetup from './components/profile/ProfileSetup';
import DietPlan from './components/dashboard/DietPlan';
import ProtectedRoute from './components/common/ProtectedRoute';
import ChatBot from './components/dashboard/ChatBot';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <AuthProvider>
          <Analytics />
          <Routes>
            {/* Auth Routes */}
            <Route path="/auth/login" element={
              <AuthLayout><LoginPage /></AuthLayout>
            } />
            <Route path="/auth/signup" element={
              <AuthLayout><SignupPage /></AuthLayout>
            } />
            <Route path="/auth/verify" element={
              <AuthLayout><VerifyOTPPage /></AuthLayout>
            } />
            <Route path="/auth/forgot-password" element={
              <AuthLayout><ForgotPasswordPage /></AuthLayout>
            } />
            <Route path="/auth/reset-password" element={
              <AuthLayout><ResetPasswordPage /></AuthLayout>
            } />

            {/* Protected Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute><Dashboard /></ProtectedRoute>
            } />
            <Route path="/profile-setup" element={
              <ProtectedRoute><ProfileSetup /></ProtectedRoute>
            } />
            <Route path="/diet-plan" element={
              <ProtectedRoute><DietPlan /></ProtectedRoute>
            } />

            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/auth/login" replace />} />
            <Route path="*" element={<Navigate to="/auth/login" replace />} />
          </Routes>
          <ChatBot />
        </AuthProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}
