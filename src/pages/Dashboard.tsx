import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Server, CheckCircle, XCircle, TrendingUp, Plus } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/services/api";

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ totalServers: 0, upServers: 0, downServers: 0, plan: 'free' });
  const [uptimeData, setUptimeData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await api.getDashboardStats();
        setStats(data.stats);
        setUptimeData(data.uptimeData);
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">Loading...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Welcome, {user?.name || 'User'}</h1>
            <p className="text-muted-foreground">Monitoring overview dashboard</p>
          </div>
          <Link to="/servers/add">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Server
            </Button>
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Servers</CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalServers}</div>
              <p className="text-xs text-muted-foreground">Monitoring aktif</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Server UP</CardTitle>
              <CheckCircle className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{stats.upServers}</div>
              <p className="text-xs text-muted-foreground">Berjalan normal</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Server DOWN</CardTitle>
              <XCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats.downServers}</div>
              <p className="text-xs text-muted-foreground">Perlu perhatian</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Account Status</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent capitalize">{stats.plan}</div>
              {stats.plan === 'free' && (
                <Link to="/billing" className="text-xs text-primary hover:underline">
                  Upgrade to Pro
                </Link>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Uptime History (24 Hours)</CardTitle>
            <CardDescription>Average uptime percentage over the last day</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={uptimeData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="time" className="text-muted-foreground" />
                  <YAxis className="text-muted-foreground" />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="uptime"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <Link to="/servers/add">
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add New Server
              </Button>
            </Link>
            <Link to="/notifications">
              <Button variant="outline">Configure Notifications</Button>
            </Link>
            <Link to="/billing">
              <Button variant="outline">View Billing</Button>
            </Link>
            {user?.role === 'admin' && (
              <Link to="/admin">
                <Button variant="default" className="bg-purple-600 hover:bg-purple-700">
                  Admin Panel
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
