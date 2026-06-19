import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense } from "react";
import { useAuth } from "./hooks/useAuth";
import AppShell from "./components/layout/AppShell";
import Login from "./pages/Login";
import AuthCallback from "./pages/AuthCallback";

// Lazy load pages — they are only downloaded when the user navigates to them
const Dashboard = lazy(() => import("./pages/Dashboard"));
const RepoDetail = lazy(() => import("./pages/RepoDetail"));
const Compare = lazy(() => import("./pages/Compare"));
const RepoSettings = lazy(() => import("./pages/RepoSettings"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // Data is fresh for 5 minutes
      retry: 1,
    },
  },
});

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route
              index
              element={
                <Suspense fallback={null}>
                  <Dashboard />
                </Suspense>
              }
            />
            <Route
              path="repos/:repoId"
              element={
                <Suspense fallback={null}>
                  <RepoDetail />
                </Suspense>
              }
            />
            <Route
              path="compare"
              element={
                <Suspense fallback={null}>
                  <Compare />
                </Suspense>
              }
            />
            <Route
              path="settings"
              element={
                <Suspense fallback={null}>
                  <RepoSettings />
                </Suspense>
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
