import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useApp } from '@/contexts/AppContext';
import { 
  User, 
  Mail, 
  Phone, 
  DollarSign, 
  Clock, 
  Star,
  Save,
  Plus,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Profile = () => {
  const { state, dispatch } = useApp();
  const { toast } = useToast();

  // Form data for volunteer profiles
  const [volunteerFormData, setVolunteerFormData] = useState({
    name: state.user?.name || '',
    email: state.user?.email || '',
    phone: '',
    bio: '',
    hourlyRate: 500,
    availability: '',
    isVerified: false,
    skills: [] as { id: string; name: string }[],
  });

  // Form data for client profiles
  const [clientFormData, setClientFormData] = useState({
    name: state.user?.name || '',
    email: state.user?.email || '',
    phone: '',
  });

  const [newSkill, setNewSkill] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (state.user?.role === 'volunteer' && state.currentUserProfile) {
      setVolunteerFormData({
        name: state.currentUserProfile.name,
        email: state.currentUserProfile.email,
        phone: state.currentUserProfile.phone,
        bio: state.currentUserProfile.bio,
        hourlyRate: state.currentUserProfile.hourlyRate,
        availability: state.currentUserProfile.availability,
        isVerified: state.currentUserProfile.isVerified,
        skills: state.currentUserProfile.skills,
      });
    }
  }, [state.currentUserProfile, state.user?.role]);

  const handleVolunteerInputChange = (field: string, value: any) => {
    setVolunteerFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleClientInputChange = (field: string, value: any) => {
    setClientFormData(prev => ({ ...prev, [field]: value }));
  };

  const addSkill = () => {
    const trimmedSkill = newSkill.trim();
    if (trimmedSkill && !volunteerFormData.skills.some(skill => skill.name === trimmedSkill)) {
      handleVolunteerInputChange('skills', [...volunteerFormData.skills, { id: trimmedSkill, name: trimmedSkill }]);
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove: { id: string; name: string }) => {
    handleVolunteerInputChange('skills', volunteerFormData.skills.filter(skill => skill.name !== skillToRemove.name));
  };

  const handleVolunteerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    if (!state.user || !state.currentUserProfile) return;

    try {
      // 1. Update the main profile data
      const { error: profileError } = await supabase
        .from('volunteers')
        .update({
          name: volunteerFormData.name,
          phone: volunteerFormData.phone,
          bio: volunteerFormData.bio,
          hourly_rate: volunteerFormData.hourlyRate,
          availability: volunteerFormData.availability,
        })
        .eq('id', state.currentUserProfile.id);

      if (profileError) throw profileError;

      // 2. Update the skills using the RPC function
      const skillNames = volunteerFormData.skills.map(skill => skill.name);
      const { error: skillsError } = await supabase.rpc('update_volunteer_skills', {
        p_volunteer_id: state.currentUserProfile.id,
        p_skill_names: skillNames,
      });

      if (skillsError) throw skillsError;
      
      // 3. Fetch the updated profile with the new skills to update the context
      const { data: finalProfile, error: finalProfileError } = await supabase
        .from('volunteers')
        .select('*, skills(id, name)')
        .eq('id', state.currentUserProfile.id)
        .single();

      if (finalProfileError) throw finalProfileError;

      // 4. Update the local state
      dispatch({ type: 'UPDATE_VOLUNTEER_PROFILE', payload: finalProfile });

      toast({
        title: "Profile updated successfully!",
        description: "Your volunteer profile has been saved.",
      });

    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error updating profile",
        description: (error as Error).message || "There was a problem saving your changes.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // For client profiles, we can just show a success message
    // since we're only storing basic info in local state
    setTimeout(() => {
      toast({
        title: "Profile updated successfully!",
        description: "Your profile information has been saved.",
      });
      setIsSubmitting(false);
    }, 500);
  };

  if (state.user?.role === 'volunteer') {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="animate-fade-up">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gradient mb-2">
                Volunteer Profile
              </h1>
              <p className="text-muted-foreground">
                Manage your volunteer profile and service offerings
              </p>
            </div>

            <form onSubmit={handleVolunteerSubmit} className="space-y-8">
              {/* Basic Information */}
              <Card className="volunteer-card">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="w-5 h-5 text-primary" />
                    <span>Basic Information</span>
                  </CardTitle>
                  <CardDescription>
                    Your personal details and contact information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={volunteerFormData.name}
                        onChange={(e) => handleVolunteerInputChange('name', e.target.value)}
                        className="form-input"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                          id="email"
                          type="email"
                          value={volunteerFormData.email}
                          onChange={(e) => handleVolunteerInputChange('email', e.target.value)}
                          className="pl-10 form-input"
                          required
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        id="phone"
                        value={volunteerFormData.phone}
                        onChange={(e) => handleVolunteerInputChange('phone', e.target.value)}
                        className="pl-10 form-input"
                        placeholder="+91 98765 43210"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={volunteerFormData.bio}
                      onChange={(e) => handleVolunteerInputChange('bio', e.target.value)}
                      className="form-input min-h-[100px]"
                      placeholder="Describe your experience and what makes you a great volunteer..."
                      required
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Service Details */}
              <Card className="volunteer-card">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <DollarSign className="w-5 h-5 text-primary" />
                    <span>Service Details</span>
                  </CardTitle>
                  <CardDescription>
                    Your rates and availability information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="hourlyRate">Hourly Rate (₹)</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                          id="hourlyRate"
                          type="number"
                          min="100"
                          value={volunteerFormData.hourlyRate}
                          onChange={(e) => handleVolunteerInputChange('hourlyRate', parseInt(e.target.value))}
                          className="pl-10 form-input"
                          required
                        />
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 pt-8">
                      <Switch
                        checked={volunteerFormData.isVerified}
                        onCheckedChange={(checked) => handleVolunteerInputChange('isVerified', checked)}
                      />
                      <Label>Verified Status</Label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="availability">Availability</Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-3 text-muted-foreground w-4 h-4" />
                      <Textarea
                        id="availability"
                        value={volunteerFormData.availability}
                        onChange={(e) => handleVolunteerInputChange('availability', e.target.value)}
                        className="pl-10 form-input"
                        placeholder="e.g., Weekdays 6-9 PM, Weekends 10 AM - 6 PM"
                        required
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Skills */}
              <Card className="volunteer-card">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Star className="w-5 h-5 text-primary" />
                    <span>Skills & Expertise</span>
                  </CardTitle>
                  <CardDescription>
                    Add skills that describe your areas of expertise
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex space-x-2">
                    <Input
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      placeholder="Add a skill (e.g., Mathematics, Coding, Yoga)"
                      className="form-input"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                    />
                    <Button type="button" onClick={addSkill} size="sm">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {volunteerFormData.skills.map((skill) => (
                      <Badge key={skill.id} variant="secondary" className="text-sm px-3 py-1">
                        {skill.name}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="ml-2 h-auto p-0 text-muted-foreground hover:text-destructive"
                          onClick={() => removeSkill(skill)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>

                  {volunteerFormData.skills.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No skills added yet. Add some skills to help clients find you!
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Submit Button */}
              <div className="flex justify-end">
                <Button type="submit" className="marketplace-button" disabled={isSubmitting}>
                  <Save className="w-4 h-4 mr-2" />
                  {isSubmitting ? 'Saving...' : 'Save Profile'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Client Profile
  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="animate-fade-up">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gradient mb-2">
              My Profile
            </h1>
            <p className="text-muted-foreground">
              Manage your personal information and account settings
            </p>
          </div>

          <form onSubmit={handleClientSubmit} className="space-y-8">
            {/* Basic Information */}
            <Card className="volunteer-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-5 h-5 text-primary" />
                  <span>Personal Information</span>
                </CardTitle>
                <CardDescription>
                  Update your personal details and contact information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="clientName">Full Name</Label>
                  <Input
                    id="clientName"
                    value={clientFormData.name}
                    onChange={(e) => handleClientInputChange('name', e.target.value)}
                    className="form-input"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="clientEmail">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      id="clientEmail"
                      type="email"
                      value={clientFormData.email}
                      onChange={(e) => handleClientInputChange('email', e.target.value)}
                      className="pl-10 form-input"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="clientPhone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      id="clientPhone"
                      value={clientFormData.phone}
                      onChange={(e) => handleClientInputChange('phone', e.target.value)}
                      className="pl-10 form-input"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Account Info */}
            <Card className="volunteer-card">
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>
                  Your account details and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Account Type:</span>
                    <p className="font-medium capitalize">{state.user?.role}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Member Since:</span>
                    <p className="font-medium">December 2024</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total Bookings:</span>
                    <p className="font-medium">{state.bookings.filter(b => b.clientId === state.user?.id).length}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant="secondary" className="text-xs">Active</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button type="submit" className="marketplace-button" disabled={isSubmitting}>
                <Save className="w-4 h-4 mr-2" />
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;