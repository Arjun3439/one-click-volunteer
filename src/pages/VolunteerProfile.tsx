import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  User,
  Mail,
  Phone,
  DollarSign,
  Clock,
  Star,
  Save,
  Plus,
  X,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Import Supabase and App Context
import { supabase } from '@/lib/supabase';
import { useApp } from '@/contexts/AppContext';
import { useUser } from '@clerk/clerk-react';

// Check if Supabase is configured
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';


const VolunteerProfile = () => {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useUser();

  const [formData, setFormData] = useState({
    name: state.user?.name || '',
    email: state.user?.email || '',
    phone: '',
    bio: '',
    hourlyRate: 500,
    availability: '',
    isVerified: false,
    skills: [] as { id: string; name: string }[],
  });

  const [isUploading, setIsUploading] = useState(false);
  const [newSkill, setNewSkill] = useState('');

  useEffect(() => {
    if (state.currentUserProfile) {
      setFormData({
        name: state.currentUserProfile.name,
        email: state.currentUserProfile.email,
        phone: state.currentUserProfile.phone || '',
        bio: state.currentUserProfile.bio || '',
        hourlyRate: state.currentUserProfile.hourlyRate,
        availability: state.currentUserProfile.availability || '',
        isVerified: state.currentUserProfile.isVerified,
        skills: state.currentUserProfile.skills || [],
      });
    }
  }, [state.currentUserProfile, state.user]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev,
      [field]: value
    }));
  };

  const addSkill = () => {
    const trimmedSkill = newSkill.trim();
    if (trimmedSkill && !formData.skills.some(skill => skill.name === trimmedSkill)) {
      handleInputChange('skills', [...formData.skills, { id: trimmedSkill, name: trimmedSkill }]);
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove: { id: string; name: string }) => {
    handleInputChange('skills', formData.skills.filter(skill => skill.name !== skillToRemove.name));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!state.user || !user) {
      toast({ title: "Error", description: "You must be logged in.", variant: "destructive" });
      return;
    }

    setIsUploading(true);

    try {
      const supabaseUserId = user.id; // Use Clerk user ID

      // 4. Upsert the rest of the volunteer profile data into your 'volunteers' table
      const { skills, ...profileData } = formData;

      const profileDataForUpsert = {
        ...profileData,
        user_id: supabaseUserId, // Use the correct Supabase user ID
        rating: state.currentUserProfile?.rating || 5.0,
        total_bookings: state.currentUserProfile?.totalBookings || 0,
      };

      const { data: upsertedProfile, error: upsertError } = await supabase
        .from('volunteers')
        .upsert(profileDataForUpsert, { onConflict: 'user_id' })
        .select()
        .single();

      if (upsertError) {
        throw upsertError;
      }

      // 5. Update skills
      const skillNames = skills.map(skill => skill.name);
      const { error: skillsError } = await supabase.rpc('update_volunteer_skills', {
        p_volunteer_id: upsertedProfile.id,
        p_skill_names: skillNames,
      });

      if (skillsError) throw skillsError;

      // 6. Fetch final profile and update state
      const { data: finalProfile, error: finalProfileError } = await supabase
        .from('volunteers')
        .select('*, skills(id, name)')
        .eq('id', upsertedProfile.id)
        .single();

      if (finalProfileError) throw finalProfileError;

      dispatch({ type: 'UPDATE_VOLUNTEER_PROFILE', payload: finalProfile });

      toast({ title: "Profile Posted Successfully!", description: "Your profile is now live." });
      navigate('/volunteer-dashboard');

    } catch (error) {
      console.error("Error creating/updating profile: ", error);
      toast({ title: "Upload Failed", description: (error as Error).message || "There was an error saving your profile.", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  return ( 
    <div className = "min-h-screen bg-background py-8" >
      <div className = "container mx-auto px-4 max-w-3xl" >
        <div className = "animate-fade-up" >
          <div className = "mb-8" >
            <h1 className = "text-3xl font-bold text-gradient mb-2" >
              Create Your Volunteer Profile 
            </h1> 
            <p className = "text-muted-foreground" >
              Set up your profile to connect with clients and showcase your skills 
            </p> 
          </div>

          <form onSubmit = {handleSubmit} className = "space-y-8" >
            <Card className = "volunteer-card" >
              <CardHeader >
                <CardTitle className = "flex items-center space-x-2" >
                  <User className = "w-5 h-5 text-primary" />
                  <span> Basic Information </span> 
                </CardTitle> 
                <CardDescription >
                  Tell us about yourself and how clients can reach you 
                </CardDescription> 
              </CardHeader> 
              <CardContent className = "space-y-4" >


                <div className = "grid md:grid-cols-2 gap-4" >
                  <div className = "space-y-2" >
                    <Label htmlFor = "name" > Full Name </Label> 
                    <Input id = "name" value = {formData.name} onChange = {(e) => handleInputChange('name', e.target.value)} required />
                  </div> 
                  <div className = "space-y-2" >
                    <Label htmlFor = "email" > Email </Label> 
                    <div className = "relative" >
                      <Mail className = "absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input id = "email" type = "email" value = {formData.email} onChange = {(e) => handleInputChange('email', e.target.value)} className = "pl-10" required />
                    </div> 
                  </div> 
                </div>

                <div className = "space-y-2" >
                  <Label htmlFor = "phone" > Phone Number </Label> 
                  <div className = "relative" >
                    <Phone className = "absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input id = "phone" value = {formData.phone} onChange = {(e) => handleInputChange('phone', e.target.value)} className = "pl-10" placeholder = "+91 98765 43210" required />
                  </div> 
                </div>

                <div className = "space-y-2" >
                  <Label htmlFor = "bio" > Bio </Label> 
                  <Textarea id = "bio" value = {formData.bio} onChange = {(e) => handleInputChange('bio', e.target.value)} className = "min-h-[100px]" placeholder = "Describe your experience..." required />
                </div> 
              </CardContent> 
            </Card>

            <Card className = "volunteer-card" >
              <CardHeader >
                <CardTitle className = "flex items-center space-x-2" >
                  <DollarSign className = "w-5 h-5 text-primary" />
                  <span> Service Details </span> 
                </CardTitle> 
                <CardDescription >
                  Set your rates and availability 
                </CardDescription> 
              </CardHeader> 
              <CardContent className = "space-y-4" >
                <div className = "grid md:grid-cols-2 gap-4" >
                  <div className = "space-y-2" >
                    <Label htmlFor = "hourlyRate" > Hourly Rate(₹) </Label> 
                    <div className = "relative" >
                      <DollarSign className = "absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input id = "hourlyRate" type = "number" min = "100" value = {formData.hourlyRate} onChange = {(e) => handleInputChange('hourlyRate', parseInt(e.target.value))} className = "pl-10 form-input" required />
                    </div> 
                  </div> 
                  <div className = "flex items-center space-x-3 pt-8" >
                    <Switch checked = {formData.isVerified} onCheckedChange = {(checked) => handleInputChange('isVerified', checked)} /> 
                    <Label > Mark as Verified(Demo) </Label> 
                  </div> 
                </div>

                <div className = "space-y-2" >
                  <Label htmlFor = "availability" > Availability </Label> 
                  <div className = "relative" >
                    <Clock className = "absolute left-3 top-3 text-muted-foreground w-4 h-4" />
                    <Textarea id = "availability" value = {formData.availability} onChange = {(e) => handleInputChange('availability', e.target.value)} className = "pl-10 form-input" placeholder = "e.g., Weekdays 6-9 PM, Weekends 10 AM - 6 PM" required />
                  </div> 
                </div> 
              </CardContent> 
            </Card>

            <Card className = "volunteer-card" >
              <CardHeader >
                <CardTitle className = "flex items-center space-x-2" >
                  <Star className = "w-5 h-5 text-primary" />
                  <span> Skills & Categories </span> 
                </CardTitle> 
                <CardDescription >
                  Add skills that describe your expertise 
                </CardDescription> 
              </CardHeader> 
              <CardContent className = "space-y-4" >
                <div className = "flex space-x-2" >
                  <Input value = {newSkill} onChange = {(e) => setNewSkill(e.target.value)} placeholder = "Add a skill (e.g., Mathematics, Coding, Yoga)" className = "form-input" onKeyPress = {(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())} /> 
                  <Button type = "button" onClick = {addSkill} size = "sm" >
                    <Plus className = "w-4 h-4" />
                  </Button> 
                </div>

                <div className = "flex flex-wrap gap-2" > 
                  {formData.skills.map((skill) => ( 
                    <Badge key = {skill.id} variant = "secondary" className = "text-sm px-3 py-1" > 
                      {skill.name} 
                      <Button type = "button" variant = "ghost" size = "sm" className = "ml-2 h-auto p-0 text-muted-foreground hover:text-destructive" onClick = {() => removeSkill(skill)} >
                        <X className = "w-3 h-3" />
                      </Button> 
                    </Badge>
                  ))} 
                </div> 
              </CardContent> 
            </Card>

            <div className = "flex justify-end space-x-4" >
              <Button type = "button" variant = "outline" onClick = {() => navigate(-1)} >
                Cancel 
              </Button> 
              <Button type = "submit" className = "marketplace-button" disabled = {isUploading} >
                <Save className = "w-4 h-4 mr-2" /> 
                {isUploading ? 'Saving Profile...' : 'Save Profile'} 
              </Button> 
            </div> 
          </form> 
        </div> 
      </div> 
    </div>
  );
};

export default VolunteerProfile;