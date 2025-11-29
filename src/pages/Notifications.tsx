import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, CheckCircle, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Notifications = () => {
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const { toast } = useToast();

  const handleAddWhatsApp = () => {
    toast({
      title: "WhatsApp Added",
      description: "Verification SMS has been sent.",
    });
    setWhatsappNumber("");
  };

  const handleVerifyEmail = () => {
    toast({
      title: "Verification Email Sent",
      description: "Check your inbox to verify your email.",
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">Manage your notification preferences</p>
        </div>

        {/* Email Notifications */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Mail className="h-6 w-6 text-primary" />
                <div>
                  <CardTitle>Email Notifications</CardTitle>
                  <CardDescription>Get alerts via email</CardDescription>
                </div>
              </div>
              <Badge variant="default" className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Verified
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>Email Address</Label>
                <p className="text-sm text-muted-foreground mt-1">user@example.com</p>
              </div>
              <Button variant="outline" onClick={handleVerifyEmail}>
                Resend Verification Email
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* WhatsApp Notifications */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Phone className="h-6 w-6 text-accent" />
                <div>
                  <CardTitle>WhatsApp Notifications</CardTitle>
                  <CardDescription>Get instant alerts on WhatsApp (Pro only)</CardDescription>
                </div>
              </div>
              <Badge variant="secondary">Pro Feature</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="whatsapp">Phone Number</Label>
                <div className="flex gap-2">
                  <Input
                    id="whatsapp"
                    placeholder="+62812345678"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                  />
                  <Button onClick={handleAddWhatsApp}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </div>
              </div>

              {/* Mock existing numbers */}
              <div className="space-y-2">
                <Label>Registered Numbers</Label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">+62812345678</span>
                    </div>
                    <Badge variant="default" className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Verified
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Notification Preferences</CardTitle>
            <CardDescription>Choose when to receive notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Server Down Alerts</p>
                  <p className="text-sm text-muted-foreground">Instant notification when server goes down</p>
                </div>
                <Badge>Enabled</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Slow Response Alerts</p>
                  <p className="text-sm text-muted-foreground">Alert when response time is above threshold</p>
                </div>
                <Badge>Enabled</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Daily Summary</p>
                  <p className="text-sm text-muted-foreground">Daily report of all servers status</p>
                </div>
                <Badge variant="secondary">Disabled</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Notifications;
