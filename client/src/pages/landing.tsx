import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center gaming-glow">
              <i className="fas fa-gamepad text-primary-foreground text-xl"></i>
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">GameVerse</h1>
              <p className="text-xs text-muted-foreground">Level Up Together</p>
            </div>
          </div>
          <Button 
            onClick={() => window.location.href = '/api/login'}
            className="bg-primary hover:bg-primary/90 text-primary-foreground gaming-glow"
            data-testid="button-login"
          >
            <i className="fas fa-sign-in-alt mr-2"></i>
            Sign In
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-5xl font-bold text-foreground mb-4">
              Connect. Game. <span className="text-primary">Dominate.</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Join the ultimate social platform for gamers. Share your achievements, 
              connect with fellow players, and build your gaming legacy.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <Card className="bg-card border-border hover:border-primary/30 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                  <i className="fas fa-trophy text-primary text-xl"></i>
                </div>
                <CardTitle className="text-foreground">Track Achievements</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Showcase your gaming accomplishments and climb the leaderboards
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-card border-border hover:border-accent/30 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center mb-4">
                  <i className="fas fa-users text-accent text-xl"></i>
                </div>
                <CardTitle className="text-foreground">Gaming Communities</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Join game-specific communities and connect with like-minded players
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-card border-border hover:border-secondary/30 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-secondary/20 rounded-lg flex items-center justify-center mb-4">
                  <i className="fas fa-video text-secondary text-xl"></i>
                </div>
                <CardTitle className="text-foreground">Stream Integration</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Share clips from Twitch, YouTube, and showcase your best moments
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* CTA */}
          <div className="mt-12">
            <Button 
              size="lg"
              onClick={() => window.location.href = '/api/login'}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 text-lg gaming-glow"
              data-testid="button-get-started"
            >
              <i className="fas fa-rocket mr-2"></i>
              Get Started - It's Free
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              Join thousands of gamers already on GameVerse
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-6">
        <div className="container mx-auto px-6 text-center text-muted-foreground">
          <p>&copy; 2024 GameVerse. Level up your gaming experience.</p>
        </div>
      </footer>
    </div>
  );
}
