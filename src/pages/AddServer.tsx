import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { useToast } from "@/hooks/use-toast";

const AddServer = () => {
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [interval, setInterval] = useState("5");
  const [emailNotif, setEmailNotif] = useState(true);
  const [whatsappNotif, setWhatsappNotif] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Server added!",
        description: `${name} is now being monitored.`,
      });
      navigate("/servers");
      setLoading(false);
    }, 1000);
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Add New Server</h1>
          <p className="text-muted-foreground">Configure monitoring for your server</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Server Details</CardTitle>
            <CardDescription>Enter your server information</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Server Name</Label>
                <Input
                  id="name"
                  placeholder="Production API"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="domain">Domain or IP Address</Label>
                <Input
                  id="domain"
                  placeholder="api.example.com or 192.168.1.1"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="interval">Monitoring Interval</Label>
                <Select value={interval} onValueChange={setInterval}>
                  <SelectTrigger id="interval">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Minute</SelectItem>
                    <SelectItem value="2">2 Minutes</SelectItem>
                    <SelectItem value="5">5 Minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>Notification Methods</Label>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="email"
                    checked={emailNotif}
                    onCheckedChange={(checked) => setEmailNotif(checked as boolean)}
                  />
                  <label
                    htmlFor="email"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Email Notifications
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="whatsapp"
                    checked={whatsappNotif}
                    onCheckedChange={(checked) => setWhatsappNotif(checked as boolean)}
                  />
                  <label
                    htmlFor="whatsapp"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    WhatsApp Notifications (Pro only)
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? "Adding..." : "Add Server"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate("/servers")}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AddServer;
