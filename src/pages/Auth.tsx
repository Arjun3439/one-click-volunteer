import React from 'react';
import { SignIn, SignUp } from '@clerk/clerk-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart } from 'lucide-react';

const Auth = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="w-full max-w-md animate-fade-up">
        {/* Logo and Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-2 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-glow rounded-xl flex items-center justify-center shadow-glow">
              <Heart className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-gradient">
              One-Click Volunteer
            </span>
          </div>
          <p className="text-muted-foreground">
            Connect, Serve, Impact - Join our community today
          </p>
        </div>

        {/* Auth Tabs */}
        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          
          <TabsContent value="signin" className="mt-0">
            <div className="flex justify-center">
              <SignIn 
                fallbackRedirectUrl="/role-selection"
                appearance={{
                  elements: {
                    formButtonPrimary: 'bg-primary hover:bg-primary/90 text-primary-foreground',
                    card: 'shadow-none border-0 bg-transparent',
                    headerTitle: 'text-foreground',
                    headerSubtitle: 'text-muted-foreground',
                    socialButtonsBlockButton: 'border border-border hover:bg-muted',
                    formFieldLabel: 'text-foreground',
                    formFieldInput: 'border-border focus:border-primary',
                    footerActionLink: 'text-primary hover:text-primary/90'
                  }
                }}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="signup" className="mt-0">
            <div className="flex justify-center">
              <SignUp 
                fallbackRedirectUrl="/role-selection"
                appearance={{
                  elements: {
                    formButtonPrimary: 'bg-primary hover:bg-primary/90 text-primary-foreground',
                    card: 'shadow-none border-0 bg-transparent',
                    headerTitle: 'text-foreground',
                    headerSubtitle: 'text-muted-foreground',
                    socialButtonsBlockButton: 'border border-border hover:bg-muted',
                    formFieldLabel: 'text-foreground',
                    formFieldInput: 'border-border focus:border-primary',
                    footerActionLink: 'text-primary hover:text-primary/90'
                  }
                }}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Auth;