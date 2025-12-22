import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Bell, Clock, Shield, CheckCircle2, Zap } from "lucide-react";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-foreground">MyCheckServer</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-muted-foreground hover:text-primary transition-colors">
              Features
            </a>
            <a href="#pricing" className="text-muted-foreground hover:text-primary transition-colors">
              Pricing
            </a>
            <Link to="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link to="/register">
              <Button>Register</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 md:py-32 bg-gradient-hero text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            Monitor server kamu secara otomatis
          </h1>
          <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto opacity-90 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-150">
            Tambahkan server kamu dan dapatkan notifikasi saat down atau lambat. 
            Monitoring 24/7 untuk memastikan server selalu online.
          </p>
          <Link to="/register">
            <Button size="lg" variant="secondary" className="animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
              Mulai Sekarang
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Fitur Unggulan</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Semua yang kamu butuhkan untuk monitoring server yang handal
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-2 hover:border-primary transition-all duration-300 hover:shadow-lg">
              <CardHeader>
                <Activity className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Monitoring Otomatis</CardTitle>
                <CardDescription>
                  Server kamu dicek secara berkala sesuai interval yang kamu tentukan
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-accent transition-all duration-300 hover:shadow-lg">
              <CardHeader>
                <Bell className="h-10 w-10 text-accent mb-2" />
                <CardTitle>Notifikasi Real-time</CardTitle>
                <CardDescription>
                  Dapatkan notifikasi via WhatsApp dan Email saat ada masalah
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary transition-all duration-300 hover:shadow-lg">
              <CardHeader>
                <Clock className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Interval Fleksibel</CardTitle>
                <CardDescription>
                  Pilih interval monitoring dari 1-5 menit sesuai kebutuhan
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-accent transition-all duration-300 hover:shadow-lg">
              <CardHeader>
                <Shield className="h-10 w-10 text-accent mb-2" />
                <CardTitle>Free & Pro Tier</CardTitle>
                <CardDescription>
                  Mulai gratis, upgrade ke Pro untuk fitur unlimited
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary transition-all duration-300 hover:shadow-lg">
              <CardHeader>
                <CheckCircle2 className="h-10 w-10 text-success mb-2" />
                <CardTitle>Response Time Tracking</CardTitle>
                <CardDescription>
                  Pantau performa server dengan grafik response time
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-accent transition-all duration-300 hover:shadow-lg">
              <CardHeader>
                <Zap className="h-10 w-10 text-accent mb-2" />
                <CardTitle>Status History</CardTitle>
                <CardDescription>
                  Lihat log lengkap status server hingga 30 hari
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-secondary/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Harga yang Jelas</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Pilih paket yang sesuai dengan kebutuhan kamu
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Tier */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-2xl">Free</CardTitle>
                <CardDescription>Cocok untuk mulai</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">Rp 0</span>
                  <span className="text-muted-foreground">/bulan</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                    <span>1 Server</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                    <span>Interval 5 menit</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                    <span>Notifikasi Email</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                    <span>Log 7 hari</span>
                  </li>
                </ul>
                <Link to="/register" className="block mt-6">
                  <Button variant="outline" className="w-full">
                    Mulai Gratis
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Pro Tier */}
            <Card className="border-2 border-primary shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  Pro
                  <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full">
                    Popular
                  </span>
                </CardTitle>
                <CardDescription>Untuk kebutuhan profesional</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">Rp 100</span>
                  <span className="text-muted-foreground">/bulan</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                    <span className="font-medium">Unlimited Server</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                    <span className="font-medium">Interval 1-5 menit</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                    <span className="font-medium">Notifikasi WhatsApp</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                    <span className="font-medium">Notifikasi Email</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                    <span className="font-medium">Log 30 hari</span>
                  </li>
                </ul>
                <Link to="/register" className="block mt-6">
                  <Button className="w-full">
                    Upgrade ke Pro
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t bg-card">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2024 MyCheckServer. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
