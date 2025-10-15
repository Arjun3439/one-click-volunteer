import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useApp } from '@/contexts/AppContext';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '@/lib/supabase';
import { 
  Edit, 
  Star, 
  DollarSign, 
  Calendar, 
  CheckCircle,
  TrendingUp,
  Users,
  Clock,
  Mail
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const VolunteerDashboard = () => {
  const { state, dispatch } = useApp();
  const { user: clerkUser } = useUser();
  const { currentUserProfile: profile } = state;
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [totalEarnings, setTotalEarnings] = useState(0);

  const loadEarnings = async () => {
    if (!profile) return;
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('total_amount')
        .eq('volunteer_id', profile.id)
        .in('status', ['confirmed', 'completed']);

      if (error) {
        console.error('Error loading earnings:', error);
        return;
      }

      const earnings = data.reduce((acc, booking) => acc + booking.total_amount, 0);
      setTotalEarnings(earnings);
    } catch (error) {
      console.error('Error loading earnings:', error);
    }
  };

  const handleDecline = async (booking) => {
    try {
      toast({ title: "Declining request..." });
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', booking.id);

      if (error) {
        throw error;
      }

      setBookings(bookings.filter(b => b.id !== booking.id));
      toast({ title: "Booking Declined", description: "The request has been removed from your queue." });
    } catch (error) {
      console.error('Error declining booking:', error);
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
    }
  };

  const handleAccept = async (booking) => {
    try {
      toast({ title: "Accepting request..." });
      // 1. Update booking status
      const { error: updateBookingError } = await supabase
        .from('bookings')
        .update({ status: 'confirmed' })
        .eq('id', booking.id);

      if (updateBookingError) {
        toast({ title: "Error", description: `Failed to update booking: ${updateBookingError.message}`, variant: "destructive" });
        return;
      }
      toast({ title: "Success", description: "Booking status confirmed." });

      // 2. Update volunteer's total bookings
      if (profile) {
        const newTotalBookings = (profile.totalBookings || 0) + 1;

        const { data: updatedProfileData, error: updateProfileError } = await supabase
          .from('volunteers')
          .update({ total_bookings: newTotalBookings })
          .eq('user_id', profile.userId)
          .select('*, skills(id, name)')
          .single();

        if (updateProfileError) {
          toast({ title: "Error", description: `Failed to update profile: ${updateProfileError.message}`, variant: "destructive" });
          return;
        }
        toast({ title: "Success", description: "Profile stats updated." });

        const profileData = {
            id: updatedProfileData.id,
            userId: updatedProfileData.user_id,
            name: updatedProfileData.name,
            email: updatedProfileData.email,
            phone: updatedProfileData.phone,
            bio: updatedProfileData.bio,
            hourlyRate: updatedProfileData.hourly_rate,
            availability: updatedProfileData.availability,
            isVerified: updatedProfileData.is_verified,
            skills: updatedProfileData.skills,
            rating: updatedProfileData.rating,
            totalBookings: updatedProfileData.total_bookings,
            profilePhoto: updatedProfileData.profile_photo_url,
          };

        // 3. Update state
        dispatch({ type: 'UPDATE_VOLUNTEER_PROFILE', payload: profileData });
        setBookings(bookings.filter(b => b.id !== booking.id));
        loadEarnings();
        toast({ title: "Booking Accepted!", description: "The request has been removed from your queue." });
      }
    } catch (error) {
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
    }
  };

  const loadBookings = async () => {
    if (!profile) return;
    try {
      const { data: bookingsData, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('volunteer_id', profile.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading bookings:', error);
        return;
      }

      // FIXME: We don't have a profiles table for clients, so we can't fetch their names yet.
      // The UI will show a fallback name.
      setBookings(bookingsData);

    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoadingBookings(false);
    }
  };

  useEffect(() => {
    loadBookings();
    loadEarnings();

    const channel = supabase
      .channel('realtime-bookings')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bookings' }, (payload) => {
        if (payload.new.volunteer_id === profile.id) {
          loadBookings(); // Reload all bookings to get the new one with client data
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile]);

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="volunteer-card max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Complete Your Profile</CardTitle>
            <CardDescription>
              Set up your volunteer profile to start receiving bookings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/volunteer-profile">
              <Button className="w-full marketplace-button">
                Create Profile
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = [
    {
      title: 'Total Earnings',
      value: `₹${totalEarnings.toLocaleString()}`,
      icon: DollarSign,
      trend: '+12% from last month',
      color: 'text-green-600'
    },
    {
      title: 'Sessions Completed',
      value: profile.totalBookings.toString(),
      icon: CheckCircle,
      trend: '+3 new this week',
      color: 'text-blue-600'
    },
    {
      title: 'Average Rating',
      value: profile.rating.toFixed(1),
      icon: Star,
      trend: 'Excellent service',
      color: 'text-yellow-600'
    },
    {
      title: 'Response Rate',
      value: '98%',
      icon: Clock,
      trend: 'Very responsive',
      color: 'text-purple-600'
    }
  ];

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        <div className="animate-fade-up">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={clerkUser?.imageUrl} alt={profile.name} />
                <AvatarFallback>{profile.name?.[0]}</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl font-bold text-gradient mb-2">
                  Welcome back, {profile.name}!
                </h1>
                <p className="text-muted-foreground">
                  Manage your volunteer profile and track your impact
                </p>
              </div>
            </div>
            <div className="flex space-x-3 mt-4 md:mt-0">
              <Link to="/volunteer-profile">
                <Button variant="outline" className="marketplace-button">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              </Link>
              <Link to="/volunteer-bookings">
                <Button className="marketplace-button">
                  <Calendar className="w-4 h-4 mr-2" />
                  View Bookings
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index} className="volunteer-card">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {stat.title}
                        </p>
                        <p className="text-2xl font-bold mt-2">{stat.value}</p>
                        <p className={`text-xs mt-1 ${stat.color}`}>
                          {stat.trend}
                        </p>
                      </div>
                      <div className={`p-3 rounded-2xl bg-primary/10`}>
                        <Icon className={`w-6 h-6 text-primary`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Booking Requests */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">New Booking Requests</h2>
            {loadingBookings ? (
              <p>Loading booking requests...</p>
            ) : bookings.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-6">
                {bookings.map((booking) => (
                  <Card key={booking.id} className="volunteer-card">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Booking Request</CardTitle>
                        <Badge variant="secondary">{booking.status}</Badge>
                      </div>
                      <CardDescription>
                        From: {booking.client?.name || 'A client'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        {booking.message}
                      </p>
                      <div className="flex items-center justify-between text-sm">
                        <div>
                          <p><strong>Date:</strong> {new Date(booking.date).toLocaleDateString()}</p>
                          <p><strong>Time:</strong> {booking.time}</p>
                        </div>
                        <div className="text-right">
                          <p><strong>Duration:</strong> {booking.duration} hours</p>
                          <p><strong>Amount:</strong> ₹{booking.total_amount}</p>
                        </div>
                      </div>
                      <div className="flex space-x-2 pt-2">
                        <Button size="sm" className="w-full" onClick={() => handleAccept(booking)}>Accept</Button>
                        <Button size="sm" variant="outline" className="w-full" onClick={() => handleDecline(booking)}>Decline</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Mail className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No new booking requests</h3>
                <p className="text-muted-foreground">
                  We'll notify you here when you get a new request.
                </p>
              </div>
            )}
          </div>

          {/* Profile Overview */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Profile Card */}
            <div className="lg:col-span-2">
              <Card className="volunteer-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Your Profile</CardTitle>
                    {profile.isVerified && (
                      <Badge className="badge-verified">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-2">Contact Information</h4>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <p>{profile.email}</p>
                        <p>{profile.phone}</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Service Details</h4>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <p>Hourly Rate: ₹{profile.hourlyRate}</p>
                        <p>Rating: {profile.rating} ⭐</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">About You</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {profile.bio}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {profile.skills.map((skill) => (
                        <Badge key={skill.id} variant="secondary">
                          {skill.name}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Availability</h4>
                    <p className="text-sm text-muted-foreground">
                      {profile.availability}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="space-y-6">
              <Card className="volunteer-card">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link to="/volunteer-profile">
                    <Button variant="outline" className="w-full justify-start">
                      <Edit className="w-4 h-4 mr-2" />
                      Update Profile
                    </Button>
                  </Link>
                  <Link to="/volunteer-bookings">
                    <Button variant="outline" className="w-full justify-start">
                      <Calendar className="w-4 h-4 mr-2" />
                      Manage Bookings
                    </Button>
                  </Link>
                  <Link to="/volunteer-analytics">
                    <Button variant="outline" className="w-full justify-start">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      View Analytics
                    </Button>
                  </Link>
                  <Link to="/client-reviews">
                    <Button variant="outline" className="w-full justify-start">
                      <Users className="w-4 h-4 mr-2" />
                      Client Reviews
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="volunteer-card">
                <CardHeader>
                  <CardTitle>Profile Completeness</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span>Profile Info</span>
                      <CheckCircle className="w-4 h-4 text-success" />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Skills Added</span>
                      <CheckCircle className="w-4 h-4 text-success" />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Availability Set</span>
                      <CheckCircle className="w-4 h-4 text-success" />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Verification</span>
                      {profile.isVerified ? (
                        <CheckCircle className="w-4 h-4 text-success" />
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          Pending
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm font-medium text-center">
                      100% Complete
                    </p>
                    <div className="w-full bg-muted rounded-full h-2 mt-2">
                      <div className="bg-primary h-2 rounded-full w-full"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VolunteerDashboard;