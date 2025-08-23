import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { X, CreditCard, Minus, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CartState } from "@/types";
import { cartManager } from "@/lib/cart";
import { apiRequest } from "@/lib/queryClient";
import { Wilaya, CreateOrderRequest } from "@shared/schema";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartState: CartState;
}

export default function CheckoutModal({ isOpen, onClose, cartState }: CheckoutModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [selectedWilayaId, setSelectedWilayaId] = useState("");
  const [address, setAddress] = useState("");
  const [deliveryPrice, setDeliveryPrice] = useState(0);

  const { data: wilayas = [] } = useQuery<Wilaya[]>({
    queryKey: ["/api/wilayas"],
  });

  const createOrderMutation = useMutation({
    mutationFn: async (orderData: CreateOrderRequest) => {
      const response = await apiRequest("POST", "/api/orders", orderData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Commande confirmée !",
        description: "Nous vous contacterons bientôt pour confirmer votre commande.",
      });
      cartManager.clearCart();
      onClose();
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de passer la commande. Veuillez réessayer.",
        variant: "destructive",
      });
      console.error("Error creating order:", error);
    },
  });

  const resetForm = () => {
    setCustomerName("");
    setCustomerPhone("");
    setSelectedWilayaId("");
    setAddress("");
    setDeliveryPrice(0);
  };

  useEffect(() => {
    if (selectedWilayaId) {
      const selectedWilaya = wilayas.find(w => w.id === selectedWilayaId);
      if (selectedWilaya) {
        setDeliveryPrice(parseFloat(selectedWilaya.deliveryPrice));
      }
    } else {
      setDeliveryPrice(0);
    }
  }, [selectedWilayaId, wilayas]);

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    cartManager.updateQuantity(productId, newQuantity);
  };

  const handleRemoveItem = (productId: string) => {
    cartManager.removeItem(productId);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (cartState.items.length === 0) {
      toast({
        title: "Panier vide",
        description: "Ajoutez des produits à votre panier avant de commander.",
        variant: "destructive",
      });
      return;
    }

    const orderData: CreateOrderRequest = {
      customerName,
      customerPhone,
      wilayaId: selectedWilayaId,
      address,
      items: cartState.items.map(item => ({
        productId: item.id,
        quantity: item.quantity,
      })),
    };

    createOrderMutation.mutate(orderData);
  };

  const total = cartState.total + deliveryPrice;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-screen overflow-y-auto" data-testid="modal-checkout">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span data-testid="text-checkout-title">Commander</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              data-testid="button-close-checkout"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Cart Items */}
          <div className="space-y-4" data-testid="section-cart-items">
            <h3 className="font-medium text-gray-900">Articles dans votre panier</h3>
            {cartState.items.map((item) => (
              <Card key={item.id} className="p-3">
                <div className="flex items-center space-x-3">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-12 h-12 object-cover rounded"
                    data-testid={`img-cart-item-${item.id}`}
                  />
                  <div className="flex-1">
                    <h4 className="font-medium text-sm" data-testid={`text-cart-item-name-${item.id}`}>
                      {item.name}
                    </h4>
                    <p className="text-primary font-bold text-sm" data-testid={`text-cart-item-price-${item.id}`}>
                      {item.price}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                      data-testid={`button-decrease-${item.id}`}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center" data-testid={`text-quantity-${item.id}`}>
                      {item.quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                      data-testid={`button-increase-${item.id}`}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-red-500 hover:text-red-700"
                      data-testid={`button-remove-${item.id}`}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Customer Information Form */}
          <form onSubmit={handleSubmit} className="space-y-4" data-testid="form-checkout">
            <div>
              <Label htmlFor="customerName">Nom complet *</Label>
              <Input
                id="customerName"
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="mt-1"
                data-testid="input-customer-name"
              />
            </div>

            <div>
              <Label htmlFor="customerPhone">Numéro de téléphone *</Label>
              <Input
                id="customerPhone"
                type="tel"
                required
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="0X XX XX XX XX"
                className="mt-1"
                data-testid="input-customer-phone"
              />
            </div>

            <div>
              <Label htmlFor="wilaya">Wilaya *</Label>
              <Select
                value={selectedWilayaId}
                onValueChange={setSelectedWilayaId}
                required
              >
                <SelectTrigger className="mt-1" data-testid="select-wilaya">
                  <SelectValue placeholder="Choisir votre wilaya..." />
                </SelectTrigger>
                <SelectContent>
                  {wilayas.map((wilaya) => (
                    <SelectItem 
                      key={wilaya.id} 
                      value={wilaya.id}
                      data-testid={`option-wilaya-${wilaya.id}`}
                    >
                      {wilaya.code} - {wilaya.name} ({parseFloat(wilaya.deliveryPrice).toLocaleString()} DA)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="address">Adresse complète</Label>
              <Textarea
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Votre adresse complète..."
                className="mt-1"
                rows={3}
                data-testid="textarea-address"
              />
            </div>

            {/* Order Summary */}
            <Card className="bg-gray-50">
              <CardContent className="p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Sous-total:</span>
                  <span data-testid="text-subtotal">{cartState.total.toLocaleString()} DA</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Livraison:</span>
                  <span data-testid="text-delivery-cost">{deliveryPrice.toLocaleString()} DA</span>
                </div>
                <hr className="my-2" />
                <div className="flex justify-between text-lg font-bold text-primary">
                  <span>Total:</span>
                  <span data-testid="text-total-cost">{total.toLocaleString()} DA</span>
                </div>
              </CardContent>
            </Card>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary-dark"
              disabled={createOrderMutation.isPending || cartState.items.length === 0}
              data-testid="button-confirm-order"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              {createOrderMutation.isPending ? "Traitement..." : "Confirmer la commande"}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
