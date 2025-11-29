import { useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { CheckCircle, XCircle, Activity, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const mockResponseData = [
  { time: "00:00", ms: 125 },
  { time: "04:00", ms: 132 },
  { time: "08:00", ms: 145 },
  { time: "12:00", ms: 128 },
  { time: "16:00", ms: 156 },
  { time: "20:00", ms: 143 },
];

const mockLogs = [
  { timestamp: "2024-01-15 10:30:25", code: 200, responseTime: 125 },
  { timestamp: "2024-01-15 10:25:25", code: 200, responseTime: 132 },
  { timestamp: "2024-01-15 10:20:25", code: 200, responseTime: 128 },
  { timestamp: "2024-01-15 10:15:25", code: 500, responseTime: 0 },
  { timestamp: "2024-01-15 10:10:25", code: 200, responseTime: 145 },
];

const ServerDetail = () => {
  const { id } = useParams();

  // Mock server data
  const server = {
    id: id,
    name: "Production API",
    domain: "api.example.com",
    status: "up",
    responseTime: 125,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              {server.name}
              {server.status === "up" ? (
                <CheckCircle className="h-8 w-8 text-success" />
              ) : (
                <XCircle className="h-8 w-8 text-destructive" />
              )}
            </h1>
            <p className="text-muted-foreground">{server.domain}</p>
          </div>
          <Badge variant={server.status === "up" ? "default" : "destructive"} className="text-lg px-4 py-2">
            {server.status.toUpperCase()}
          </Badge>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Status</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">Online</div>
              <p className="text-xs text-muted-foreground">All systems operational</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Response Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{server.responseTime}ms</div>
              <p className="text-xs text-muted-foreground">Average in last hour</p>
            </CardContent>
          </Card>
        </div>

        {/* Response Time Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Response Time History</CardTitle>
            <CardDescription>Last 24 hours performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockResponseData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="time" className="text-muted-foreground" />
                  <YAxis className="text-muted-foreground" />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="ms" 
                    stroke="hsl(var(--accent))" 
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--accent))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Status Log */}
        <Card>
          <CardHeader>
            <CardTitle>Status Log</CardTitle>
            <CardDescription>Recent monitoring checks</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Status Code</TableHead>
                  <TableHead>Response Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockLogs.map((log, index) => (
                  <TableRow key={index}>
                    <TableCell>{log.timestamp}</TableCell>
                    <TableCell>
                      <Badge variant={log.code === 200 ? "default" : "destructive"}>
                        {log.code}
                      </Badge>
                    </TableCell>
                    <TableCell>{log.responseTime > 0 ? `${log.responseTime}ms` : "N/A"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ServerDetail;
