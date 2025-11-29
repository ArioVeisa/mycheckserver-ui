import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Plus, CheckCircle, XCircle, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const mockServers = [
  { id: 1, name: "Production API", domain: "api.example.com", status: "up", responseTime: 125 },
  { id: 2, name: "Website", domain: "www.example.com", status: "up", responseTime: 98 },
  { id: 3, name: "Database Server", domain: "db.example.com", status: "down", responseTime: 0 },
  { id: 4, name: "CDN", domain: "cdn.example.com", status: "up", responseTime: 45 },
  { id: 5, name: "Admin Panel", domain: "admin.example.com", status: "up", responseTime: 156 },
];

const ServerList = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Server List</h1>
            <p className="text-muted-foreground">Manage and monitor your servers</p>
          </div>
          <Link to="/servers/add">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Server
            </Button>
          </Link>
        </div>

        <div className="grid gap-4">
          {mockServers.map((server) => (
            <Card key={server.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      {server.name}
                      {server.status === "up" ? (
                        <CheckCircle className="h-5 w-5 text-success" />
                      ) : (
                        <XCircle className="h-5 w-5 text-destructive" />
                      )}
                    </CardTitle>
                    <CardDescription>{server.domain}</CardDescription>
                  </div>
                  <Badge variant={server.status === "up" ? "default" : "destructive"}>
                    {server.status.toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      <span>Response Time: {server.responseTime}ms</span>
                    </div>
                  </div>
                  <Link to={`/servers/${server.id}`}>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {mockServers.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Activity className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No servers yet</h3>
              <p className="text-muted-foreground mb-4">Add your first server to start monitoring</p>
              <Link to="/servers/add">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Server
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ServerList;
