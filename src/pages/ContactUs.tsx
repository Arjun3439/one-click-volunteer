import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  Send,
  Heart,
  MessageSquare,
  HelpCircle,
  Star
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/contexts/AppContext';

const ContactUs = () => {
  const { toast } = useToast();
  const { state } = useApp();
  const [formData, setFormData] = useState({
    message: '',
    rating: 0,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!state.user) {
      toast({ title: "Error", description: "You must be logged in to submit feedback.", variant: "destructive" });
      setIsSubmitting(false);
      return;
    }

    try {
      const { error } = await supabase.from('feedback').insert({
        user_id: state.user.id,
        user_role: state.user.role || 'unknown',
        user_name: state.user.name || 'Anonymous',
        feedback_text: formData.message,
        rating: formData.rating,
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Feedback submitted successfully!",
        description: "Thank you for your valuable feedback.",
      });
      
      // Reset form
      setFormData({
        message: '',
        rating: 0,
      });

    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast({
        title: "Failed to submit feedback",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = [
    {
      icon: Mail,
      title: 'Email Us',
      description: 'Send us an email anytime',
      value: 'support@oneclickvolunteer.com',
      action: 'mailto:support@oneclickvolunteer.com'
    },
    {
      icon: Phone,
      title: 'Call Us',
      description: 'Mon-Fri from 9am to 6pm',
      value: '+91 12345 67890',
      action: 'tel:+911234567890'
    },
    {
      icon: MapPin,
      title: 'Visit Us',
      description: 'Come say hello at our office',
      value: 'Mumbai, Maharashtra, India',
      action: '#'
    },
    {
      icon: Clock,
      title: 'Support Hours',
      description: 'We\'re here to help',
      value: 'Mon-Fri: 9AM - 6PM IST',
      action: '#'
    }
  ];

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="animate-fade-up">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center space-x-2 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-glow rounded-xl flex items-center justify-center">
                <Heart className="w-6 h-6 text-primary-foreground" />
              </div>
              <h1 className="text-4xl font-bold text-gradient">
                Share Your Feedback
              </h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We'd love to hear your thoughts and suggestions to improve our platform.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Feedback Form */}
            <div className="lg:col-span-2">
              <Card className="volunteer-card">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MessageSquare className="w-5 h-5 text-primary" />
                    <span>Submit Your Feedback</span>
                  </CardTitle>
                  <CardDescription>
                    Help us improve by sharing your experience
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="message">Your Feedback</Label>
                      <Textarea
                        id="message"
                        value={formData.message}
                        onChange={(e) => handleInputChange('message', e.target.value)}
                        className="form-input min-h-[120px]"
                        placeholder="Tell us what you think..."
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="rating">Rating (1-5 Stars)</Label>
                      <Input
                        id="rating"
                        type="number"
                        value={formData.rating}
                        onChange={(e) => handleInputChange('rating', parseInt(e.target.value))}
                        min="1"
                        max="5"
                        className="form-input"
                        placeholder="e.g., 5"
                      />
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full marketplace-button"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        'Submitting...'
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Submit Feedback
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Contact Information */}
            <div className="space-y-6">
              {/* Contact Methods */}
              <Card className="volunteer-card">
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                  <CardDescription>
                    Choose your preferred way to reach us
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {contactInfo.map((info, index) => {
                    const Icon = info.icon;
                    return (
                      <div key={index} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{info.title}</h4>
                          <p className="text-sm text-muted-foreground mb-1">
                            {info.description}
                          </p>
                          <p className="text-sm font-medium text-primary">
                            {info.value}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* FAQ */}
              <Card className="volunteer-card">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <HelpCircle className="w-5 h-5 text-primary" />
                    <span>Quick Help</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Common Questions</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• How do I create a volunteer profile?</li>
                      <li>• How does the booking system work?</li>
                      <li>• What are the payment methods?</li>
                      <li>• How do I get verified?</li>
                    </ul>
                  </div>
                  <Button variant="outline" size="sm" className="w-full">
                    View FAQ
                  </Button>
                </CardContent>
              </Card>

              {/* Response Time */}
              <Card className="volunteer-card">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Clock className="w-6 h-6 text-success" />
                    </div>
                    <h4 className="font-medium">Quick Response</h4>
                    <p className="text-sm text-muted-foreground">
                      We typically respond within 2-4 hours during business hours
                    </p>
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

export default ContactUs;
