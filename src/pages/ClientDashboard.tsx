import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/lib/supabase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Search,
  Star,
  Clock,
  DollarSign,
  Filter,
  Heart,
  CheckCircle,
  X,
} from 'lucide-react';

const ClientDashboard = () => {
  const { state } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('');
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hiddenVolunteers, setHiddenVolunteers] = useState([]);
  const [showArchived, setShowArchived] = useState(false); // New state for showing archived volunteers
  const [showFilters, setShowFilters] = useState(false);

  const toggleFilters = () => {
    setShowFilters(prev => !prev);
  };

  const loadVolunteers = async () => {
    try {
      const { data, error } = await supabase
        .from('volunteers')
        .select('*, skills(id, name)')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading volunteers:', error);
      } else if (data) {
        const volunteersData = data.map(volunteer => ({
          id: volunteer.id,
          userId: volunteer.user_id,
          name: volunteer.name,
          email: volunteer.email,
          phone: volunteer.phone,
          bio: volunteer.bio,
          hourlyRate: volunteer.hourly_rate,
          availability: volunteer.availability,
          isVerified: volunteer.is_verified,
          skills: volunteer.skills,
          imageUrl: volunteer.profile_photo_url,
          rating: volunteer.rating,
          totalBookings: volunteer.total_bookings,
        }));
        setVolunteers(volunteersData);
      }
    } catch (error) {
      console.error('Error loading volunteers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const storedHiddenVolunteers = JSON.parse(localStorage.getItem('hiddenVolunteers') || '[]');
    setHiddenVolunteers(storedHiddenVolunteers);
    loadVolunteers();
  }, []); // Run only once on mount

  // This effect will re-run whenever hiddenVolunteers changes, ensuring persistence
  useEffect(() => {
    localStorage.setItem('hiddenVolunteers', JSON.stringify(hiddenVolunteers));
  }, [hiddenVolunteers]);

  const handleHide = (volunteerId) => {
    console.log('Hiding volunteer:', volunteerId);
    setHiddenVolunteers(prevHidden => {
      const updatedHidden = [...prevHidden, volunteerId];
      console.log('Updated hidden volunteers:', updatedHidden);
      return updatedHidden;
    });
  };

  const handleUnhide = (volunteerId) => {
    setHiddenVolunteers(prevHidden => {
      const updatedHidden = prevHidden.filter(id => id !== volunteerId);
      console.log('Unhiding volunteer:', volunteerId);
      console.log('Updated hidden volunteers:', updatedHidden);
      return updatedHidden;
    });
  };

  const allSkills = Array.from(
    new Map(volunteers.flatMap(v => v.skills).map(skill => [skill.name, skill])).values()
  );

  const filteredVolunteers = volunteers.filter(volunteer => {
    const isHidden = hiddenVolunteers.includes(volunteer.id);

    if (showArchived) {
      // If showing archived, only include if it's hidden
      return isHidden;
    } else {
      // If not showing archived, exclude if it's hidden
      if (isHidden) return false;

      const matchesSearch = (volunteer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           volunteer.bio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           volunteer.skills?.some(skill => skill.name.toLowerCase().includes(searchTerm.toLowerCase()))) ?? false;
      
      console.log(`Volunteer: ${volunteer.name}, SearchTerm: ${searchTerm}, MatchesSearch: ${matchesSearch}`);
      
      const matchesSkill = !selectedSkill || volunteer.skills?.some(skill => skill.name === selectedSkill);
      
      return matchesSearch && matchesSkill;
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading volunteers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="hero-section py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="animate-fade-up">
            <h1 className="text-4xl md:text-6xl font-bold text-primary-foreground mb-6">
              Find the Perfect
              <span className="block text-primary-foreground/90">Volunteer</span>
            </h1>
            <p className="text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
              Connect with skilled volunteers ready to help you achieve your goals. 
              Book services instantly and make a difference together.
            </p>
            <div className="flex flex-col md:flex-row gap-4 justify-center items-center max-w-lg mx-auto">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  placeholder="Search for volunteers, skills, or services..."
                  value={searchTerm}
                  onChange={(e) => {
                    console.log('Input change:', e.target.value);
                    setSearchTerm(e.target.value);
                  }}
                  className="pl-10 py-3 bg-white/10 border-white/20 text-primary-foreground placeholder:text-primary-foreground/60"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filters and Results */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {/* Quick Filters */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Browse by Category</h2>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedSkill === '' ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedSkill('')}
                className="marketplace-button"
              >
                All Categories
              </Button>
              {allSkills.map((skill) => (
                <Button
                  key={skill.id}
                  variant={selectedSkill === skill.name ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedSkill(skill.name)}
                  className="marketplace-button"
                >
                  {skill.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Results */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold">
              {filteredVolunteers.length} volunteers available
            </h3>
            <Button variant="outline" size="sm" onClick={toggleFilters}>
              <Filter className="w-4 h-4 mr-2" />
              More Filters
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowArchived(prev => !prev)}
            >
              {showArchived ? 'Show Active Volunteers' : 'See Archived Volunteers'}
            </Button>
          </div>

          {showFilters && (
            <div className="mb-8">
              <Card>
                <CardHeader>
                  <CardTitle>More Filters</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Filter controls will be here.</p>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVolunteers.map((volunteer) => (
              <Card key={volunteer.id} className="volunteer-card group relative">
                {showArchived ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 left-2 h-6 w-6 rounded-full bg-gray-900/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleUnhide(volunteer.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 left-2 h-6 w-6 rounded-full bg-gray-900/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleHide(volunteer.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
                <CardHeader className="pb-4">
                  <div className="flex items-start space-x-4">
                    <Avatar className="w-16 h-16 rounded-2xl">
                      <AvatarImage src={volunteer.imageUrl} alt={volunteer.name} />
                      <AvatarFallback>{volunteer.name?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <CardTitle className="text-lg">{volunteer.name || 'Name not available'}</CardTitle>
                        {volunteer.isVerified && (
                          <CheckCircle className="w-5 h-5 text-success" />
                        )}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span>{volunteer.rating}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{volunteer.totalBookings} sessions</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <CardDescription className="text-sm">
                    {volunteer.bio}
                  </CardDescription>
                  
                  <div className="flex flex-wrap gap-1">
                    {volunteer.skills.slice(0, 3).map((skill) => (
                      <Badge key={skill.id} variant="secondary" className="text-xs">
                        {skill.name}
                      </Badge>
                    ))}
                    {volunteer.skills.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{volunteer.skills.length - 3} more
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1 text-primary font-semibold">
                      <DollarSign className="w-4 h-4" />
                      <span>₹{volunteer.hourlyRate || 'N/A'}/hour</span>
                    </div>
                    {volunteer.isVerified && (
                      <Badge className="badge-verified">
                        Verified
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex space-x-2 pt-2">
                    <Link to={`/volunteer/${volunteer.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        View Profile
                      </Button>
                    </Link>
                    <Link to={`/book/${volunteer.id}`} className="flex-1">
                      <Button size="sm" className="w-full marketplace-button">
                        Book Now
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredVolunteers.length === 0 && (
            <div className="text-center py-12">
              <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No volunteers found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search criteria or browse all categories
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default ClientDashboard;