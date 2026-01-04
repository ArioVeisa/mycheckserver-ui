import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, CreditCard, Server, Eye, TrendingUp, ArrowLeft } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useAuth } from "@/contexts/AuthContext";

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/api\/?$/, '');

interface Stats {
    totalUsers: number;
    proUsers: number;
    freeUsers: number;
    totalServers: number;
    todayVisitors: number;
    totalRevenue: number;
}

interface VisitorData {
    date: string;
    visits: number;
}

const AdminDashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState<Stats | null>(null);
    const [visitorData, setVisitorData] = useState<VisitorData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');

                // Fetch stats
                const statsRes = await fetch(`${API_URL}/api/admin/stats`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (statsRes.ok) {
                    const statsData = await statsRes.json();
                    setStats(statsData);
                }

                // Fetch visitor analytics
                const visitorsRes = await fetch(`${API_URL}/api/admin/visitors?days=7`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (visitorsRes.ok) {
                    const visitorsData = await visitorsRes.json();
                    setVisitorData(visitorsData.analytics || []);
                }
            } catch (error) {
                console.error('Failed to fetch admin data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link to="/dashboard">
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        </Link>
                        <h1 className="text-xl font-bold">Admin Dashboard</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link to="/admin/users">
                            <Button variant="outline">
                                <Users className="mr-2 h-4 w-4" />
                                Kelola Users
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
                            <p className="text-xs text-muted-foreground">
                                {stats?.proUsers || 0} Pro, {stats?.freeUsers || 0} Free
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pro Subscribers</CardTitle>
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{stats?.proUsers || 0}</div>
                            <p className="text-xs text-muted-foreground">Active subscriptions</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Servers</CardTitle>
                            <Server className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.totalServers || 0}</div>
                            <p className="text-xs text-muted-foreground">Being monitored</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Visitors Hari Ini</CardTitle>
                            <Eye className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.todayVisitors || 0}</div>
                            <p className="text-xs text-muted-foreground">Page views</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Revenue Card */}
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            Total Revenue
                        </CardTitle>
                        <CardDescription>Dari semua pembayaran yang berhasil</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-primary">
                            Rp {(stats?.totalRevenue || 0).toLocaleString('id-ID')}
                        </div>
                    </CardContent>
                </Card>

                {/* Visitor Analytics Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>Grafik Pengunjung (7 Hari Terakhir)</CardTitle>
                        <CardDescription>Jumlah kunjungan halaman per hari</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {visitorData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={visitorData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={(value) => new Date(value).toLocaleDateString('id-ID', { weekday: 'short' })}
                                    />
                                    <YAxis />
                                    <Tooltip
                                        labelFormatter={(value) => new Date(value).toLocaleDateString('id-ID', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="visits"
                                        stroke="hsl(var(--primary))"
                                        strokeWidth={2}
                                        dot={{ fill: 'hsl(var(--primary))' }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                                Belum ada data pengunjung
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
};

export default AdminDashboard;
