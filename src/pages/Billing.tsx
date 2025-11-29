import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, CreditCard, Calendar } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const mockPaymentHistory = [
  { date: "2024-01-01", plan: "Pro", amount: "Rp 99.000", status: "Paid" },
  { date: "2023-12-01", plan: "Pro", amount: "Rp 99.000", status: "Paid" },
  { date: "2023-11-01", plan: "Pro", amount: "Rp 99.000", status: "Paid" },
];

const Billing = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Billing</h1>
          <p className="text-muted-foreground">Manage your subscription and payments</p>
        </div>

        {/* Current Plan */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  Current Plan
                  <Badge>Free</Badge>
                </CardTitle>
                <CardDescription>You're currently on the Free plan</CardDescription>
              </div>
              <CreditCard className="h-6 w-6 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Servers</span>
                  <span className="font-medium">1 / 1</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Monitoring Interval</span>
                  <span className="font-medium">5 minutes</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Notifications</span>
                  <span className="font-medium">Email only</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Log Retention</span>
                  <span className="font-medium">7 days</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upgrade to Pro */}
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Upgrade to Pro
              <Badge variant="default">Best Value</Badge>
            </CardTitle>
            <CardDescription>Unlock all features for professional monitoring</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-3xl font-bold">
                Rp 99.000
                <span className="text-base font-normal text-muted-foreground">/month</span>
              </div>

              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                  <span>Unlimited Servers</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                  <span>Monitoring Interval 1-5 minutes</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                  <span>WhatsApp Notifications</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                  <span>Email Notifications</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                  <span>30 Days Log Retention</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                  <span>Priority Support</span>
                </li>
              </ul>

              <Button className="w-full" size="lg">
                Upgrade Now via Midtrans
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Payment History */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle>Payment History</CardTitle>
                <CardDescription>Your past transactions</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {mockPaymentHistory.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockPaymentHistory.map((payment, index) => (
                    <TableRow key={index}>
                      <TableCell>{payment.date}</TableCell>
                      <TableCell>{payment.plan}</TableCell>
                      <TableCell>{payment.amount}</TableCell>
                      <TableCell>
                        <Badge variant="default">{payment.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No payment history yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Billing;
