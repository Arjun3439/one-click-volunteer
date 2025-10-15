import React, { useState, useEffect } from 'react';
import { useApp } from "@/contexts/AppContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from '@/lib/supabase';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface Volunteer {
  name: string;
  image_url: string;
  hourly_rate: number;
}

interface Booking {
  id: string;
  date: string;
  time: string;
  status: string;
  volunteers: Volunteer;
  [key: string]: any;
}

const MyBookings = () => {
  const { state, dispatch } = useApp();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      if (!state.user) {
        console.log('MyBookings: state.user is null');
        return;
      }

      console.log('MyBookings: state.user.role:', state.user.role);
      console.log('MyBookings: state.currentUserProfile?.id:', state.currentUserProfile?.id);

      try {
        const isClient = state.user.role === 'client';
        const userId = isClient ? state.user.id : state.currentUserProfile?.id;
        const column = isClient ? 'client_id' : 'volunteer_id';

        if (!userId) {
          setLoading(false);
          return;
        }

        const { data, error } = await (supabase
          .from('bookings')
          .select('*, volunteers!inner(*)') // Fetch volunteer details
          .eq(column, userId) as any)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching bookings:', error);
        } else {
          setBookings(data || []);
        }
      } catch (error) {
        console.error('Error fetching bookings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [state.user, state.currentUserProfile]);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const { error } = await (supabase
        .from('bookings') as any)
        .update({ status })
        .eq('id', id);

      if (error) {
        console.error(`Error updating booking status to ${status}:`, error);
      } else {
        setBookings(prevBookings =>
          prevBookings.map(b =>
            b.id === id ? { ...b, status } : b
          )
        );
      }
    } catch (error) {
      console.error(`Error updating booking status to ${status}:`, error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">My Bookings</h1>

      {bookings.length === 0 ? (
        <p className="text-muted-foreground">No bookings yet.</p>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking: Booking) => {
            const volunteer = booking.volunteers;
            return (
              <Card key={booking.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarImage src={volunteer?.image_url} alt={volunteer?.name} />
                        <AvatarFallback>{volunteer?.name?.[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h2 className="text-xl font-semibold">
                          {volunteer?.name || "Unknown Volunteer"}
                        </h2>
                        <p className="text-muted-foreground">
                          Rate: ₹{volunteer?.hourly_rate}/hour
                        </p>
                        <p className="text-muted-foreground">
                          Date: {new Date(booking.date).toLocaleDateString()}
                        </p>
                        <p className="text-muted-foreground">
                          Time: {booking.time}
                        </p>
                        <p
                          className={`mt-1 font-medium ${
                            booking.status === "cancelled" || booking.status === "declined"
                              ? "text-red-500"
                              : "text-green-600"
                          }`}
                        >
                          Status: {booking.status}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col space-y-2">
                      {state.user.role === 'volunteer' && booking.status === 'pending' && (
                        <>
                          <Button onClick={() => handleUpdateStatus(booking.id, 'confirmed')}>Accept</Button>
                          <Button variant="destructive" onClick={() => handleUpdateStatus(booking.id, 'declined')}>Decline</Button>
                        </>
                      )}
                      {state.user.role === 'client' && booking.status !== 'cancelled' && (
                        <Button
                          variant="destructive"
                          onClick={() => handleUpdateStatus(booking.id, 'cancelled')}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyBookings;