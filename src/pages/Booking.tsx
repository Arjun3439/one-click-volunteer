import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Clock, DollarSign, User, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

const Booking = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const { toast } = useToast();
  
  const [volunteer, setVolunteer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingData, setBookingData] = useState({
    date: new Date(),
    time: '',
    duration: 1,
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load volunteer data
  useEffect(() => {
    const loadVolunteer = async () => {
      try {
        // Try to load from Supabase first
        const { data, error } = await supabase
          .from('volunteers')
          .select('*, skills(id, name)')
          .eq('id', id)
          .single();

        if (error) {
          throw error;
        } else if (data) {
          // Convert Supabase format to app format
          const volunteerData = {
            id: data.id,
            userId: data.user_id,
            name: data.name,
            email: data.email,
            phone: data.phone,
            bio: data.bio,
            hourlyRate: data.hourlyRate,
            availability: data.availability,
            isVerified: data.isVerified,
            skills: data.skills,
            profilePhoto: data.profile_photo_url,
            rating: data.rating,
            totalBookings: data.total_bookings,
          };
          setVolunteer(volunteerData);
        }
      } catch (error) {
        console.error('Error loading volunteer:', error);
        // Fallback to local data
        const localVolunteer = state.volunteers.find(v => v.id === id);
        setVolunteer(localVolunteer);
      } finally {
        setLoading(false);
      }
    };

    loadVolunteer();
  }, [id, state.volunteers]);

  const handleInputChange = (field: string, value: any) => {
    setBookingData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!volunteer || !state.user) {
      toast({
        title: "Error",
        description: "Missing volunteer or user information.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const totalAmount = volunteer.hourlyRate * bookingData.duration;
      
      const booking = {
        volunteer_id: volunteer.id,
        client_id: state.user.id,
        date: bookingData.date.toISOString().split('T')[0],
        time: bookingData.time,
        duration: bookingData.duration,
        status: 'pending',
        total_amount: totalAmount,
        message: bookingData.message,
      };

      // Add to Supabase
      const { data, error } = await supabase
        .from('bookings')
        .insert([booking])
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Add to local state
      dispatch({ type: 'ADD_BOOKING', payload: data });

      toast({
        title: "Booking Request Sent!",
        description: `Your booking request has been sent to ${volunteer.name}.`,
      });

      navigate('/my-bookings');

    } catch (error) {
      console.error('Error creating booking:', error);
      toast({
        title: "Booking Failed",
        description: "There was an error creating your booking.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading volunteer...</p>
        </div>
      </div>
    );
  }

  if (!volunteer) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold mb-2">Volunteer Not Found</h2>
            <p className="text-muted-foreground mb-4">The volunteer you're looking for doesn't exist.</p>
            <Button onClick={() => navigate('/client-dashboard')}>
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => navigate('/client-dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold">Book a Session</h1>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Volunteer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>Volunteer Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                  {volunteer.profilePhoto ? (
                    <img 
                      src={volunteer.profilePhoto} 
                      alt={volunteer.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-semibold">{volunteer.name}</h3>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1">
                      <DollarSign className="w-4 h-4 text-primary" />
                      <span className="font-semibold">₹{volunteer.hourlyRate}/hour</span>
                    </div>
                    {volunteer.isVerified && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        Verified
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">About</h4>
                <p className="text-sm text-muted-foreground">{volunteer.bio}</p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Skills</h4>
                <div className="flex flex-wrap gap-1">
                  {volunteer.skills.map((skill) => (
                    <span key={skill.id} className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded">
                      {skill.name}
                    </span>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Availability</h4>
                <p className="text-sm text-muted-foreground">{volunteer.availability}</p>
              </div>
            </CardContent>
          </Card>

          {/* Booking Form */}
          <Card>
            <CardHeader>
              <CardTitle>Booking Details</CardTitle>
              <CardDescription>
                Fill in the details for your session
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(bookingData.date, "PPP")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={bookingData.date}
                        onSelect={(date) => date && handleInputChange('date', date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time">Time</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      id="time"
                      type="time"
                      value={bookingData.time}
                      onChange={(e) => handleInputChange('time', e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (hours)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    max="8"
                    value={bookingData.duration}
                    onChange={(e) => handleInputChange('duration', parseInt(e.target.value))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message (optional)</Label>
                  <Textarea
                    id="message"
                    value={bookingData.message}
                    onChange={(e) => handleInputChange('message', e.target.value)}
                    placeholder="Tell the volunteer about your needs..."
                    className="min-h-[100px]"
                  />
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total Amount:</span>
                    <span className="text-xl font-bold text-primary">
                      ₹{volunteer.hourlyRate * bookingData.duration}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    ₹{volunteer.hourlyRate} × {bookingData.duration} hour{bookingData.duration > 1 ? 's' : ''}
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full marketplace-button"
                  disabled={isSubmitting || !bookingData.time}
                >
                  {isSubmitting ? 'Sending Request...' : 'Send Booking Request'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Booking;