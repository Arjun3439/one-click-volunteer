import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useApp } from '@/contexts/AppContext';
import { Heart, Users, HandHeart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const RoleSelection = () => {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleRoleSelection = (role: 'volunteer' | 'client') => {
    dispatch({ type: 'SET_ROLE', payload: role });
    
    toast({
      title: `Welcome ${role === 'volunteer' ? 'Volunteer' : 'Client'}!`,
      description: `You've joined as a ${role}. Let's get started!`,
    });

    if (role === 'volunteer') {
      navigate('/volunteer-profile');
    } else {
      navigate('/client-dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="w-full max-w-4xl animate-fade-up">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-glow rounded-2xl flex items-center justify-center shadow-glow">
              <Heart className="w-8 h-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gradient">
                Welcome, {state.user?.name}!
              </h1>
              <p className="text-muted-foreground">
                Choose how you'd like to participate in our community
              </p>
            </div>
          </div>
        </div>

        {/* Role Selection Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* Volunteer Card */}
          <Card className="volunteer-card cursor-pointer group hover:shadow-glow transition-all duration-300">
            <CardHeader className="text-center">
              <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                <HandHeart className="w-10 h-10 text-primary" />
              </div>
              <CardTitle className="text-2xl">Become a Volunteer</CardTitle>
              <CardDescription className="text-base">
                Share your skills, help others, and make a meaningful impact in your community
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-sm text-muted-foreground">
                    Set your own hourly rates
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-sm text-muted-foreground">
                    Choose your availability
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-sm text-muted-foreground">
                    Build your reputation
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-sm text-muted-foreground">
                    Connect with people who need your help
                  </span>
                </div>
              </div>
              <Button
                className="w-full marketplace-button mt-6"
                onClick={() => handleRoleSelection('volunteer')}
              >
                Join as Volunteer
              </Button>
            </CardContent>
          </Card>

          {/* Client Card */}
          <Card className="volunteer-card cursor-pointer group hover:shadow-glow transition-all duration-300">
            <CardHeader className="text-center">
              <div className="w-20 h-20 bg-accent/50 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-accent/70 transition-colors">
                <Users className="w-10 h-10 text-primary" />
              </div>
              <CardTitle className="text-2xl">Find Volunteers</CardTitle>
              <CardDescription className="text-base">
                Discover skilled volunteers ready to help with your projects and goals
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-sm text-muted-foreground">
                    Browse verified volunteers
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-sm text-muted-foreground">
                    Book services instantly
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-sm text-muted-foreground">
                    Rate and review services
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-sm text-muted-foreground">
                    Get help when you need it
                  </span>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full marketplace-button mt-6 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                onClick={() => handleRoleSelection('client')}
              >
                Join as Client
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Help Text */}
        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground">
            Don't worry, you can always change your role later in your profile settings
          </p>
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;