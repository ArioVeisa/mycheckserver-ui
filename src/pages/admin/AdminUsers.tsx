import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Search, Crown, User, Shield } from "lucide-react";

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/api\/?$/, '');

interface UserData {
    id: number;
    name: string;
    email: string;
    role: string;
    plan: string;
    planExpiresAt: string | null;
    emailVerified: boolean;
    hasGoogleAuth: boolean;
    avatar: string | null;
    createdAt: string;
    isSubscribed: boolean;
}

const AdminUsers = () => {
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_URL}/api/admin/users`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setUsers(data.users || []);
                }
            } catch (error) {
                console.error('Failed to fetch users:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase())
    );

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
                        <Link to="/admin">
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        </Link>
                        <h1 className="text-xl font-bold">Kelola Users</h1>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                <Card>
                    <CardHeader>
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                                <CardTitle>Daftar Users</CardTitle>
                                <CardDescription>Total {users.length} user terdaftar</CardDescription>
                            </div>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Cari user..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-10 w-full md:w-64"
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>User</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Plan</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Auth</TableHead>
                                        <TableHead>Bergabung</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredUsers.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    {user.avatar ? (
                                                        <img
                                                            src={user.avatar}
                                                            alt={user.name}
                                                            className="h-8 w-8 rounded-full"
                                                        />
                                                    ) : (
                                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                            <User className="h-4 w-4 text-primary" />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div className="font-medium">{user.name}</div>
                                                        <div className="text-sm text-muted-foreground">{user.email}</div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {user.role === 'admin' ? (
                                                    <Badge variant="default" className="bg-purple-600">
                                                        <Shield className="h-3 w-3 mr-1" />
                                                        Admin
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="secondary">User</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {user.plan === 'pro' ? (
                                                    <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500">
                                                        <Crown className="h-3 w-3 mr-1" />
                                                        Pro
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline">Free</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {user.isSubscribed ? (
                                                    <Badge variant="default" className="bg-green-600">Active</Badge>
                                                ) : user.plan === 'pro' ? (
                                                    <Badge variant="destructive">Expired</Badge>
                                                ) : (
                                                    <Badge variant="secondary">-</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-1">
                                                    {user.hasGoogleAuth && (
                                                        <Badge variant="outline" className="text-xs">
                                                            Google
                                                        </Badge>
                                                    )}
                                                    {user.emailVerified && (
                                                        <Badge variant="outline" className="text-xs text-green-600">
                                                            Verified
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-sm">
                                                {new Date(user.createdAt).toLocaleDateString('id-ID', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {filteredUsers.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                                {search ? 'Tidak ada user yang cocok' : 'Belum ada user terdaftar'}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
};

export default AdminUsers;
