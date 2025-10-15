import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Star, DollarSign, Clock, Mail, Phone, User, CheckCircle } from "lucide-react";
import { useApp } from "../contexts/AppContext";
import { supabase } from "@/lib/supabase";

export default function VolunteerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state } = useApp();
  const [volunteer, setVolunteer] = useState(null);
  const [loading, setLoading] = useState(true);

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
            hourlyRate: data.hourly_rate,
            availability: data.availability,
            isVerified: data.is_verified,
            skills: data.skills,
            profilePhoto: data.profile_photo_url,
            rating: data.rating,
            totalBookings: data.total_bookings,
          };
          setVolunteer(volunteerData);
          console.log('Volunteer loaded from Supabase:', volunteerData);
        }
      } catch (error) {
        console.error('Error loading volunteer:', error);
        // Fallback to local data
        const localVolunteer = state.volunteers.find(v => v.id === id);
        setVolunteer(localVolunteer);
        console.log('Volunteer loaded from local data:', localVolunteer);
      } finally {
        setLoading(false);
      }
    };

    loadVolunteer();
  }, [id, state.volunteers]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading volunteer profile...</p>
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
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-2">
            <Card className="volunteer-card">
              <CardHeader>
                <div className="flex items-start space-x-4">
                  <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                    {volunteer.profilePhoto && volunteer.profilePhoto.startsWith('blob:') ? (
                      <img 
                        src={volunteer.profilePhoto} 
                        alt={volunteer.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.log('Image failed to load:', volunteer.profilePhoto);
                          e.currentTarget.style.display = 'none';
                        }}
                        onLoad={() => {
                          console.log('Image loaded successfully:', volunteer.profilePhoto);
                        }}
                      />
                    ) : volunteer.profilePhoto && volunteer.profilePhoto.startsWith('http') ? (
                      <img 
                        src={volunteer.profilePhoto} 
                        alt={volunteer.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.log('Image failed to load:', volunteer.profilePhoto);
                          e.currentTarget.style.display = 'none';
                        }}
                        onLoad={() => {
                          console.log('Image loaded successfully:', volunteer.profilePhoto);
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                        <User className="w-12 h-12 text-primary" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h1 className="text-3xl font-bold">{volunteer.name}</h1>
                      {volunteer.isVerified && (
                        <Badge className="badge-verified">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-4 text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span className="font-semibold">{volunteer.rating}</span>
                        <span className="text-sm">({volunteer.totalBookings} sessions)</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <DollarSign className="w-4 h-4 text-primary" />
                        <span className="font-semibold">₹{volunteer.hourlyRate}/hour</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">About</h3>
                  <p className="text-muted-foreground leading-relaxed">{volunteer.bio}</p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {volunteer.skills.map((skill) => (
                      <Badge key={skill.id} variant="secondary" className="text-sm px-3 py-1">
                        {skill.name}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Availability</h3>
                  <div className="flex items-center space-x-2 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>{volunteer.availability}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact & Actions */}
          <div className="space-y-6">
            <Card className="volunteer-card">
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{volunteer.email}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{volunteer.phone}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="volunteer-card">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full marketplace-button"
                  onClick={() => navigate(`/book/${volunteer.id}`)}
                >
                  Book a Session
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate('/client-dashboard')}
                >
                  Browse More Volunteers
                </Button>
              </CardContent>
            </Card>

            <Card className="volunteer-card">
              <CardHeader>
                <CardTitle>Profile Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Rating</span>
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="font-semibold">{volunteer.rating}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Sessions Completed</span>
                  <span className="font-semibold">{volunteer.totalBookings}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Hourly Rate</span>
                  <span className="font-semibold">₹{volunteer.hourlyRate}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}