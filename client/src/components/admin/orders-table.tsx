import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ShoppingCart, Phone, MapPin, Eye } from "lucide-react";
import { OrderWithDetails } from "@shared/schema";

export default function OrdersTable() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading } = useQuery<OrderWithDetails[]>({
    queryKey: ["/api/admin/orders"],
  });

  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await apiRequest("PUT", `/api/admin/orders/${id}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Statut mis à jour",
        description: "Le statut de la commande a été modifié avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive",
      });
    },
  });

  const handleStatusChange = (orderId: string, newStatus: string) => {
    updateOrderStatusMutation.mutate({ id: orderId, status: newStatus });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "En attente", className: "bg-yellow-100 text-yellow-800" },
      confirmed: { label: "Confirmée", className: "bg-blue-100 text-blue-800" },
      shipped: { label: "Expédiée", className: "bg-purple-100 text-purple-800" },
      delivered: { label: "Livrée", className: "bg-green-100 text-green-800" },
      cancelled: { label: "Annulée", className: "bg-red-100 text-red-800" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPrice = (price: string) => {
    const numPrice = parseFloat(price);
    return `${numPrice.toLocaleString()} DA`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center" data-testid="text-orders-management">
          <ShoppingCart className="h-5 w-5 mr-2" />
          Gestion des Commandes
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-gray-600">Chargement des commandes...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table data-testid="table-orders">
              <TableHeader>
                <TableRow>
                  <TableHead>Commande</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Wilaya</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id} data-testid={`row-order-${order.id}`}>
                    <TableCell>
                      <div className="font-medium" data-testid={`text-order-id-${order.id}`}>
                        #{order.id.slice(-8)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {order.items.length} article{order.items.length > 1 ? "s" : ""}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium" data-testid={`text-customer-name-${order.id}`}>
                          {order.customerName}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <Phone className="h-3 w-3 mr-1" />
                          {order.customerPhone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <MapPin className="h-3 w-3 mr-1 text-gray-400" />
                        <span data-testid={`text-wilaya-${order.id}`}>
                          {order.wilaya.code} - {order.wilaya.name}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        Livraison: {formatPrice(order.deliveryPrice)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-bold text-primary" data-testid={`text-total-${order.id}`}>
                        {formatPrice(order.total)}
                      </div>
                      <div className="text-xs text-gray-500">
                        Sous-total: {formatPrice(order.subtotal)}
                      </div>
                    </TableCell>
                    <TableCell data-testid={`badge-status-${order.id}`}>
                      {getStatusBadge(order.status || "pending")}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm" data-testid={`text-date-${order.id}`}>
                        {formatDate(order.createdAt!)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Select
                          value={order.status || "pending"}
                          onValueChange={(status) => handleStatusChange(order.id, status)}
                        >
                          <SelectTrigger className="w-32" data-testid={`select-status-${order.id}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">En attente</SelectItem>
                            <SelectItem value="confirmed">Confirmée</SelectItem>
                            <SelectItem value="shipped">Expédiée</SelectItem>
                            <SelectItem value="delivered">Livrée</SelectItem>
                            <SelectItem value="cancelled">Annulée</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Voir les détails"
                          data-testid={`button-view-${order.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {orders.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600" data-testid="text-no-orders">
              Aucune commande trouvée
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
