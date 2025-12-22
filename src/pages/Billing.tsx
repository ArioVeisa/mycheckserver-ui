import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, CreditCard, Calendar, Loader2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import api from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

declare global {
  interface Window {
    snap: any;
  }
}

interface Payment {
  orderId: string;
  amount: number;
  plan: string;
  status: string;
  paymentType?: string;
  createdAt: string;
}

interface PlanData {
  plan: string;
  expiresAt?: string;
  daysRemaining?: number;
  limits: {
    maxServers: string | number;
    currentServers: number;
    minInterval: number;
    logRetention: number;
    whatsappNotif: boolean;
  };
}

const Billing = () => {
  const [planData, setPlanData] = useState<PlanData | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { refreshUser } = useAuth();

  useEffect(() => {
    const status = searchParams.get('status');
    if (status === 'success') {
      toast({ title: "Pembayaran berhasil!", description: "Akun Anda telah diupgrade ke Pro" });
      refreshUser();
    } else if (status === 'pending') {
      toast({ title: "Pembayaran pending", description: "Silakan selesaikan pembayaran Anda" });
    } else if (status === 'error') {
      toast({ title: "Pembayaran gagal", description: "Silakan coba lagi", variant: "destructive" });
    }
  }, [searchParams]);

  useEffect(() => {
    const loadMidtransScript = () => {
      if (document.getElementById('midtrans-script')) return;
      const script = document.createElement('script');
      script.id = 'midtrans-script';
      script.src = 'https://app.sandbox.midtrans.com/snap/snap.js';
      script.setAttribute('data-client-key', 'Mid-client-srWp3w2kAkWSdSUU');
      document.body.appendChild(script);
    };
    loadMidtransScript();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [planRes, historyRes] = await Promise.all([
          api.getCurrentPlan(),
          api.getPaymentHistory()
        ]);
        setPlanData(planRes);
        setPayments(historyRes.payments);
      } catch (error) {
        console.error('Failed to fetch billing data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleUpgrade = async () => {
    setPaying(true);
    try {
      const { token, orderId } = await api.createPayment();
      
      window.snap.pay(token, {
        onSuccess: async () => {
          toast({ title: "Memproses pembayaran...", description: "Mohon tunggu sebentar" });
          try {
            const result = await api.confirmPayment(orderId);
            if (result.success) {
              toast({ title: "Pembayaran berhasil!", description: "Akun Anda telah diupgrade ke Pro" });
              await refreshUser();
              window.location.reload();
            } else {
              toast({ title: "Info", description: result.message });
            }
          } catch (e) {
            console.error('Confirm payment error:', e);
            await refreshUser();
            window.location.reload();
          }
        },
        onPending: () => {
          toast({ title: "Pembayaran pending", description: "Silakan selesaikan pembayaran Anda" });
          setPaying(false);
        },
        onError: () => {
          toast({ title: "Pembayaran gagal", description: "Silakan coba lagi", variant: "destructive" });
          setPaying(false);
        },
        onClose: () => {
          setPaying(false);
        }
      });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">Loading...</div>
      </DashboardLayout>
    );
  }

  const isPro = planData?.plan === 'pro';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Billing</h1>
          <p className="text-muted-foreground">Manage your subscription and payments</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  Current Plan
                  <Badge variant={isPro ? "default" : "secondary"}>
                    {planData?.plan?.toUpperCase() || 'FREE'}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  {isPro 
                    ? `Expires in ${planData?.daysRemaining} days` 
                    : "You're currently on the Free plan"}
                </CardDescription>
              </div>
              <CreditCard className="h-6 w-6 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Servers</span>
                  <span className="font-medium">
                    {planData?.limits.currentServers} / {planData?.limits.maxServers}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Monitoring Interval</span>
                  <span className="font-medium">{planData?.limits.minInterval} minutes min</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">WhatsApp Notifications</span>
                  <span className="font-medium">
                    {planData?.limits.whatsappNotif ? 'Available' : 'Not available'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Log Retention</span>
                  <span className="font-medium">{planData?.limits.logRetention} days</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {!isPro && (
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
                  Rp 100
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

                <Button className="w-full" size="lg" onClick={handleUpgrade} disabled={paying}>
                  {paying ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Upgrade Now via Midtrans'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

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
            {payments.length > 0 ? (
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
                  {payments.map((payment) => (
                    <TableRow key={payment.orderId}>
                      <TableCell>{new Date(payment.createdAt).toLocaleDateString('id-ID')}</TableCell>
                      <TableCell className="capitalize">{payment.plan}</TableCell>
                      <TableCell>Rp {payment.amount.toLocaleString('id-ID')}</TableCell>
                      <TableCell>
                        <Badge variant={payment.status === 'paid' ? 'default' : 'secondary'}>
                          {payment.status.toUpperCase()}
                        </Badge>
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
