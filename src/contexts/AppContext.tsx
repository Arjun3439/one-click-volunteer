import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '@/lib/supabase';

// Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'volunteer' | 'client' | null;
  imageUrl?: string;
}

export interface VolunteerProfile {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  bio: string;
  hourlyRate: number;
  skills: { id: string; name: string }[];
  availability: string;
  isVerified: boolean;
  rating: number;
  totalBookings: number;
  profilePhoto?: string;
}

export interface Booking {
  id: string;
  volunteerId: string;
  clientId: string;
  date: string;
  time: string;
  duration: number;
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled';
  totalAmount: number;
  message?: string;
}

interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  bookings: Booking[];
  currentUserProfile: VolunteerProfile | null;
}

type AppAction =
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_ROLE'; payload: 'volunteer' | 'client' }
  | { type: 'UPDATE_VOLUNTEER_PROFILE'; payload: VolunteerProfile }
  | { type: 'ADD_BOOKING'; payload: Booking }
  | { type: 'UPDATE_BOOKING'; payload: { id: string; updates: Partial<Booking> } };

const initialState: AppState = {
  user: null,
  isAuthenticated: false,
  bookings: [],
  currentUserProfile: null,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
      };

    case 'SET_ROLE':
      return {
        ...state,
        user: state.user ? { ...state.user, role: action.payload } : null,
      };

    case 'UPDATE_VOLUNTEER_PROFILE':
      return {
        ...state,
        currentUserProfile: action.payload,
      };

    case 'ADD_BOOKING':
      return {
        ...state,
        bookings: [...state.bookings, action.payload],
      };

    case 'UPDATE_BOOKING':
      return {
        ...state,
        bookings: state.bookings.map(booking =>
          booking.id === action.payload.id
            ? { ...booking, ...action.payload.updates }
            : booking
        ),
      };

    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const { user: clerkUser, isSignedIn } = useUser();

  // Sync Clerk user with app state
  useEffect(() => {
    if (isSignedIn && clerkUser) {
      const appUser: User = {
        id: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress || '',
        name: clerkUser.fullName || clerkUser.firstName || 'User',
        role: localStorage.getItem(`user-role-${clerkUser.id}`) as 'volunteer' | 'client' | null,
        imageUrl: clerkUser.imageUrl,
      };
      dispatch({ type: 'SET_USER', payload: appUser });
    } else {
      dispatch({ type: 'SET_USER', payload: null });
    }
  }, [isSignedIn, clerkUser]);

  // Load volunteer profile if user is a volunteer
  useEffect(() => {
    const loadVolunteerProfile = async () => {
      if (state.user?.role === 'volunteer' && state.user?.id) {
        try {
          const { data, error } = await supabase
            .from('volunteers')
            .select('*, skills(id, name)')
            .eq('user_id', state.user.id);

          if (error) {
            console.error('Error loading volunteer profile:', error);
          } else if (data && data.length > 0) {
            const profileData = {
              id: data[0].id,
              userId: data[0].user_id,
              name: data[0].name,
              email: data[0].email,
              phone: data[0].phone,
              bio: data[0].bio,
              hourlyRate: data[0].hourly_rate,
              availability: data[0].availability,
              isVerified: data[0].is_verified,
              skills: data[0].skills,
              rating: data[0].rating,
              totalBookings: data[0].total_bookings ?? 0,
              profilePhoto: data[0].profile_photo_url,
            };
            dispatch({ type: 'UPDATE_VOLUNTEER_PROFILE', payload: profileData });
          }
        } catch (error) {
          console.error('Error loading volunteer profile:', error);
        }
      }
    };
    loadVolunteerProfile();
  }, [state.user?.id, state.user?.role]);

  // Save role to localStorage when it changes
  useEffect(() => {
    if (state.user?.role && state.user?.id) {
      localStorage.setItem(`user-role-${state.user.id}`, state.user.role);
    }
  }, [state.user?.role, state.user?.id]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}