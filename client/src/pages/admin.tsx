import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Shield, LogOut, Package, ShoppingCart, TrendingUp, Clock } from "lucide-react";
import ProductForm from "@/components/admin/product-form";
import OrdersTable from "@/components/admin/orders-table";
import DeliveryPricing from "@/components/admin/delivery-pricing";
import CategoryManagement from "@/components/admin/category-management";
import { AdminAuth } from "@/types";

export default function Admin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [auth, setAuth] = useState<AdminAuth>({ isAuthenticated: false, admin: null });
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });

  // Check authentication status
  const { data: adminProfile, isLoading: isCheckingAuth } = useQuery({
    queryKey: ["/api/admin/profile"],
    retry: false,
    enabled: !auth.isAuthenticated,
  });

  useEffect(() => {
    if (adminProfile) {
      setAuth({ isAuthenticated: true, admin: adminProfile as { id: string; email: string } });
    }
  }, [adminProfile]);

  const loginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const response = await apiRequest("POST", "/api/admin/login", credentials);
      return response.json();
    },
    onSuccess: (data) => {
      setAuth({ isAuthenticated: true, admin: data.admin });
      toast({
        title: "Connexion réussie",
        description: "Bienvenue dans l'administration !",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/profile"] });
    },
    onError: (error) => {
      toast({
        title: "Erreur de connexion",
        description: "Email ou mot de passe incorrect",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/logout", {});
      return response.json();
    },
    onSuccess: () => {
      setAuth({ isAuthenticated: false, admin: null });
      toast({
        title: "Déconnexion",
        description: "Vous avez été déconnecté avec succès",
      });
      queryClient.clear();
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(loginForm);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!auth.isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
            <CardTitle className="text-2xl" data-testid="text-admin-title">Administration</CardTitle>
            <p className="text-gray-600">Connectez-vous pour gérer votre boutique</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4" data-testid="form-admin-login">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={loginForm.email}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                  className="mt-1"
                  data-testid="input-admin-email"
                />
              </div>
              <div>
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={loginForm.password}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                  className="mt-1"
                  data-testid="input-admin-password"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary-dark"
                disabled={loginMutation.isPending}
                data-testid="button-admin-login"
              >
                {loginMutation.isPending ? "Connexion..." : "Se connecter"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900" data-testid="text-dashboard-title">
                Tableau de bord
              </h1>
              <p className="text-gray-600">Gérez vos produits et commandes</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600" data-testid="text-admin-email">
                {auth.admin?.email}
              </span>
              <Button
                variant="ghost"
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
                data-testid="button-admin-logout"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Déconnexion
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-200 text-sm">Total Produits</p>
                  <p className="text-3xl font-bold" data-testid="text-stat-products">0</p>
                </div>
                <Package className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-200 text-sm">Commandes</p>
                  <p className="text-3xl font-bold" data-testid="text-stat-orders">0</p>
                </div>
                <ShoppingCart className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-primary to-orange-light text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-200 text-sm">Revenus</p>
                  <p className="text-3xl font-bold" data-testid="text-stat-revenue">0 DA</p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-200 text-sm">En attente</p>
                  <p className="text-3xl font-bold" data-testid="text-stat-pending">0</p>
                </div>
                <Clock className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className="bg-white p-1 rounded-lg shadow-sm">
            <TabsTrigger 
              value="products" 
              className="data-[state=active]:bg-primary data-[state=active]:text-white"
              data-testid="tab-products"
            >
              Produits
            </TabsTrigger>
            <TabsTrigger 
              value="orders" 
              className="data-[state=active]:bg-primary data-[state=active]:text-white"
              data-testid="tab-orders"
            >
              Commandes
            </TabsTrigger>
            <TabsTrigger 
              value="delivery" 
              className="data-[state=active]:bg-primary data-[state=active]:text-white"
              data-testid="tab-delivery"
            >
              Tarifs Livraison
            </TabsTrigger>
            <TabsTrigger 
              value="categories" 
              className="data-[state=active]:bg-primary data-[state=active]:text-white"
              data-testid="tab-categories"
            >
              Catégories
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-6">
            <ProductForm />
          </TabsContent>

          <TabsContent value="orders" className="space-y-6">
            <OrdersTable />
          </TabsContent>

          <TabsContent value="delivery" className="space-y-6">
            <DeliveryPricing />
          </TabsContent>

          <TabsContent value="categories" className="space-y-6">
            <CategoryManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
