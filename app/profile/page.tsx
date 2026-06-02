import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { TopNav } from "@/components/layout/top-nav";
import { salesRepository } from "@/lib/repositories/sales";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatCurrency } from "@/lib/utils/format";
import { getInitials } from "@/lib/utils";
import { ChangePasswordForm } from "@/components/profile/change-password-form";
import { DeleteAccountZone } from "@/components/profile/delete-account-zone";
import { RecoveryKeyZone } from "@/components/profile/recovery-key-zone";
import { AiSettingsForm } from "@/components/profile/ai-settings-form";
import { DataManagementForm } from "@/components/profile/data-management-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, User, Bot, Database } from "lucide-react";
import prisma from "@/lib/prisma";

export default async function ProfilePage() {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    redirect("/login");
  }

  const user = session.user;
  const [userSales, dbUser] = await Promise.all([
    salesRepository.getAllSales(user.id!),
    prisma.user.findUnique({ where: { id: user.id } })
  ]);
  
  const totalEntries = userSales.length;
  const totalGross = userSales.reduce((acc, sale) => acc + sale.grossSales, 0);
  const totalNet = userSales.reduce((acc, sale) => acc + sale.primaryNetRevenue, 0);

  return (
    <div className="min-h-screen bg-background flex flex-col w-full">
      <TopNav user={user} />
      <main className="flex-1 py-10">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8 w-full space-y-10">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="max-w-2xl">
              <h1 className="text-4xl font-bold tracking-tight text-foreground">Profile</h1>
              <p className="text-muted-foreground mt-2 text-base">Manage your account settings and preferences.</p>
            </div>
            
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4 max-w-[720px] mb-8">
                <TabsTrigger value="overview" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="ai-settings" className="flex items-center gap-2">
                  <Bot className="h-4 w-4" />
                  AI Config
                </TabsTrigger>
                <TabsTrigger value="data-management" className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Data
                </TabsTrigger>
                <TabsTrigger value="security" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Security
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-6 animate-in fade-in-50 duration-500">
                <div className="grid gap-6 md:grid-cols-2">
                  <Card>
                    <CardHeader className="flex flex-row items-center gap-4">
                      <Avatar className="size-16">
                        <AvatarFallback className="bg-primary/10 text-primary text-xl font-medium">
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-2xl">{user.name || "User"}</CardTitle>
                        <CardDescription>{user.email}</CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Account Status</p>
                          <p className="text-base font-semibold">Active</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Lifetime Statistics</CardTitle>
                      <CardDescription>Your overall performance metrics.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">Total Entries</span>
                        <span className="text-xl font-bold font-mono">{totalEntries}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">Lifetime Gross Revenue</span>
                        <span className="text-xl font-bold font-mono text-chart-1">{formatCurrency(totalGross)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">Lifetime Net Revenue</span>
                        <span className="text-xl font-bold font-mono text-primary">{formatCurrency(totalNet)}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="security" className="space-y-6 animate-in fade-in-50 duration-500">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-6">
                    <ChangePasswordForm />
                    <RecoveryKeyZone />
                  </div>
                  <DeleteAccountZone />
                </div>
              </TabsContent>
              
              <TabsContent value="ai-settings" className="space-y-6 animate-in fade-in-50 duration-500">
                <div className="grid gap-6 md:grid-cols-2">
                  <AiSettingsForm 
                    initialKey={dbUser?.openrouterKey ? "sk-or-v1-••••••••••••••••••••••••" : null} 
                    initialModel={dbUser?.aiModel || "deepseek/deepseek-v4-flash"} 
                  />
                </div>
              </TabsContent>

              <TabsContent value="data-management" className="space-y-6 animate-in fade-in-50 duration-500">
                <DataManagementForm />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}
