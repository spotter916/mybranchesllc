import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Calendar, MessageCircle, Shield } from "lucide-react";

import app_Icon from "@assets/app Icon.png";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 to-accent/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-4 mb-6">
              <img src={app_Icon} alt="My Branches" className="w-16 h-16 md:w-20 md:h-20" />
              <h1 className="text-4xl md:text-6xl font-bold text-foreground">
                My Branches
              </h1>
            </div>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Keep your family connected with contact management, group chat, and collaborative event planning
            </p>
            <Button 
              size="lg" 
              className="text-lg px-8 py-4"
              onClick={() => window.location.href = '/api/login'}
              data-testid="button-login"
            >
              Get Started
            </Button>
          </div>
        </div>
      </div>
      {/* Features Section */}
      <div className="py-24 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything you need to stay connected
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Manage your family network with powerful tools designed for modern families
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <Users className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">Contact Management</h3>
                <p className="text-muted-foreground">
                  Keep everyone's information updated and organized by household and family groups
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <MessageCircle className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">Group Chat</h3>
                <p className="text-muted-foreground">
                  Real-time messaging within family groups with secure, private conversations
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <Calendar className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">Event Planning</h3>
                <p className="text-muted-foreground">
                  Collaborative event planning with shared to-do lists and task assignments
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">Privacy Control</h3>
                <p className="text-muted-foreground">
                  Control what information you share with different family groups and members
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      {/* How it Works Section */}
      <div className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              How it works
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Get started in three simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                1
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">Create Your Household</h3>
              <p className="text-muted-foreground">
                Set up your household and invite family members to join your private group
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                2
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">Join Extended Family</h3>
              <p className="text-muted-foreground">
                Connect with cousins, grandparents, and other relatives in extended family groups
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                3
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">Plan & Collaborate</h3>
              <p className="text-muted-foreground">
                Organize events, assign tasks, and stay connected through group chat
              </p>
            </div>
          </div>
        </div>
      </div>
      {/* CTA Section */}
      <div className="py-24 bg-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-6">
            Ready to connect your family?
          </h2>
          <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            Join thousands of families already using My Branches to stay organized and connected
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            className="text-lg px-8 py-4"
            onClick={() => window.location.href = '/api/login'}
            data-testid="button-cta-login"
          >
            Start Connecting Today
          </Button>
        </div>
      </div>
    </div>
  );
}
