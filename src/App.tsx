import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { AppProvider, useApp } from "@/contexts/AppContext";
import Navbar from "@/components/Navbar";
import Auth from "./pages/Auth";
import RoleSelection from "./pages/RoleSelection";
import ClientDashboard from "./pages/ClientDashboard";
import VolunteerProfile from "./pages/VolunteerProfile";
import VolunteerProfilePage from "./pages/VolunteerProfilePage";
import VolunteerDashboard from "./pages/VolunteerDashboard";
import Booking from "./pages/Booking";
import MyBookings from "./pages/MyBookings";
import Profile from "./pages/Profile";
import ContactUs from "./pages/ContactUs";
import NotFound from "./pages/NotFound";
import AnalyticsPage from "./pages/AnalyticsPage";
import ClientReviewsPage from "./pages/ClientReviewsPage";

const queryClient = new QueryClient();

// Protected Route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isSignedIn, isLoaded } = useAuth();
  const { state } = useApp();

  // Show loading while Clerk is initializing
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/auth" replace />;
  }

  if (!state.user?.role) {
    return <Navigate to="/role-selection" replace />;
  }

  return <>{children}</>;
};

// Auth wrapper for pages that need navbar
const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const { isSignedIn } = useAuth();
  return (
    <>
      {isSignedIn && <Navbar />}
      {children}
    </>
  );
};

// Main routing component
const AppRoutes = () => {
  const { isSignedIn, isLoaded } = useAuth();
  const { state } = useApp();

  // Debug logging
  console.log('AppRoutes - isLoaded:', isLoaded);
  console.log('AppRoutes - isSignedIn:', isSignedIn);
  console.log('AppRoutes - state.user:', state.user);
  console.log('AppRoutes - state.user?.role:', state.user?.role);

  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/auth"
        element={
          isSignedIn ? (
            <Navigate
              to={state.user?.role ? "/" : "/role-selection"}
              replace
            />
          ) : (
            <Auth />
          )
        }
      />

      {/* Role selection */}
      <Route
        path="/role-selection"
        element={
          isSignedIn && !state.user?.role ? (
            <RoleSelection />
          ) : (
            <Navigate to={isSignedIn ? "/" : "/auth"} replace />
          )
        }
      />

      {/* Redirect root */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Navigate
              to={
                state.user?.role === "volunteer"
                  ? "/volunteer-dashboard"
                  : "/client-dashboard"
              }
              replace
            />
          </ProtectedRoute>
        }
      />

      {/* Client Dashboard */}
      <Route
        path="/client-dashboard"
        element={
          <ProtectedRoute>
            <AppLayout>
              <ClientDashboard />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Volunteer Dashboard */}
      <Route
        path="/volunteer-dashboard"
        element={
          <ProtectedRoute>
            <AppLayout>
              <VolunteerDashboard />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Volunteer Profile Creation */}
      <Route
        path="/volunteer-profile"
        element={
          <ProtectedRoute>
            <AppLayout>
              <VolunteerProfile />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Volunteer Profile (Dynamic ID) */}
      <Route
        path="/volunteer/:id"
        element={
          <ProtectedRoute>
            <AppLayout>
              <VolunteerProfilePage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* My Bookings */}
      <Route
        path="/my-bookings"
        element={
          <ProtectedRoute>
            <AppLayout>
              <MyBookings />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Booking */}
      <Route
        path="/book/:id"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Booking />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Volunteer Bookings */}
      <Route
        path="/volunteer-bookings"
        element={
          <ProtectedRoute>
            <AppLayout>
              <MyBookings />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Profile */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Profile />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Contact */}
      <Route
        path="/contact"
        element={
          <ProtectedRoute>
            <AppLayout>
              <ContactUs />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Volunteer Analytics */}
      <Route
        path="/volunteer-analytics"
        element={
          <ProtectedRoute>
            <AppLayout>
              <AnalyticsPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Client Reviews */}
      <Route
        path="/client-reviews"
        element={
          <ProtectedRoute>
            <AppLayout>
              <ClientReviewsPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Not found */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

// Error Boundary Component
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-destructive mb-4">Something went wrong</h1>
            <p className="text-muted-foreground mb-4">{this.state.error?.message}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const App = () => {
  console.log('App component rendering...');
  
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AppProvider>
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </AppProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;