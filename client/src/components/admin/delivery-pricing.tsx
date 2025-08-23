import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Truck, MapPin } from "lucide-react";
import { Wilaya } from "@shared/schema";

export default function DeliveryPricing() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedWilayaId, setSelectedWilayaId] = useState("");
  const [newPrice, setNewPrice] = useState("");

  const { data: wilayas = [], isLoading } = useQuery<Wilaya[]>({
    queryKey: ["/api/wilayas"],
  });

  const updateDeliveryPriceMutation = useMutation({
    mutationFn: async ({ id, price }: { id: string; price: string }) => {
      const response = await apiRequest("PUT", `/api/admin/wilayas/${id}/delivery-price`, { price });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Prix mis à jour",
        description: "Le prix de livraison a été modifié avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/wilayas"] });
      setSelectedWilayaId("");
      setNewPrice("");
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le prix de livraison",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedWilayaId || !newPrice) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner une wilaya et saisir un prix",
        variant: "destructive",
      });
      return;
    }

    const price = parseFloat(newPrice);
    if (isNaN(price) || price < 0) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir un prix valide",
        variant: "destructive",
      });
      return;
    }

    updateDeliveryPriceMutation.mutate({ id: selectedWilayaId, price: newPrice });
  };

  const formatPrice = (price: string) => {
    const numPrice = parseFloat(price);
    return `${numPrice.toLocaleString()} DA`;
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Update Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center" data-testid="text-delivery-form-title">
            <Truck className="h-5 w-5 mr-2" />
            Modifier les tarifs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" data-testid="form-delivery-pricing">
            <div>
              <Label htmlFor="wilaya">Wilaya</Label>
              <Select
                value={selectedWilayaId}
                onValueChange={setSelectedWilayaId}
              >
                <SelectTrigger className="mt-1" data-testid="select-delivery-wilaya">
                  <SelectValue placeholder="Sélectionner une wilaya..." />
                </SelectTrigger>
                <SelectContent>
                  {wilayas.map((wilaya) => (
                    <SelectItem key={wilaya.id} value={wilaya.id}>
                      {wilaya.code} - {wilaya.name} ({formatPrice(wilaya.deliveryPrice)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="price">Prix de livraison (DA)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder="0.00"
                className="mt-1"
                data-testid="input-delivery-price"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary-dark"
              disabled={updateDeliveryPriceMutation.isPending}
              data-testid="button-update-delivery-price"
            >
              {updateDeliveryPriceMutation.isPending ? "Mise à jour..." : "Mettre à jour"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Current Pricing List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center" data-testid="text-pricing-list-title">
            <MapPin className="h-5 w-5 mr-2" />
            Tarifs actuels
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">Chargement...</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto" data-testid="list-delivery-prices">
              {wilayas.map((wilaya) => (
                <div
                  key={wilaya.id}
                  className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0"
                  data-testid={`item-wilaya-${wilaya.id}`}
                >
                  <div>
                    <span className="font-medium" data-testid={`text-wilaya-name-${wilaya.id}`}>
                      {wilaya.code} - {wilaya.name}
                    </span>
                  </div>
                  <div className="font-bold text-primary" data-testid={`text-wilaya-price-${wilaya.id}`}>
                    {formatPrice(wilaya.deliveryPrice)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {wilayas.length === 0 && !isLoading && (
            <div className="text-center py-8">
              <MapPin className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600" data-testid="text-no-wilayas">
                Aucune wilaya configurée
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
