import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShoppingCart, ArrowLeft, Heart, Truck, Shield, RotateCcw } from "lucide-react";
import { cartManager } from "@/lib/cart";
import { CartState } from "@/types";
import { Product } from "@shared/schema";
import CheckoutModal from "@/components/checkout-modal";
export default function ProductPage() {
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [, params] = useRoute("/product/:id");
  const [cartState, setCartState] = useState<CartState>(cartManager.getState());
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");

  const { data: product, isLoading } = useQuery<Product>({
    queryKey: ["/api/products", params?.id],
    enabled: !!params?.id,
  });

  useEffect(() => {
    const unsubscribe = cartManager.subscribe(setCartState);
    return unsubscribe;
  }, []);

  const handleAddToCart = () => {
    if (product) {
      cartManager.addItem({
        id: product.id,
        name: `${product.name}${selectedSize ? ` - ${selectedSize}` : ""}${selectedColor ? ` - ${selectedColor}` : ""}`,
        price: `${product.price} DA`,
        imageUrl: product.imageUrl,
      });
    }
  };

  const formatPrice = (price: string) => {
    const numPrice = parseFloat(price);
    return `${numPrice.toLocaleString()} DA`;
  };

  const availableImages = product ? [product.imageUrl, ...(product.images || [])] : [];
  const isOutOfStock = !product?.stock || product.stock <= 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Navigation */}
        <nav className="bg-white shadow-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <span className="text-2xl font-bold text-primary">Pix Store DZ</span>
              </div>
              <Button 
                variant="ghost"
                size="sm"
                className="relative"
                onClick={() => window.history.back()}
                data-testid="button-back"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Retour
              </Button>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement du produit...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Navigation */}
        <nav className="bg-white shadow-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <span className="text-2xl font-bold text-primary">Pix Store DZ</span>
              </div>
              <Button 
                variant="ghost"
                size="sm"
                className="relative"
                onClick={() => window.history.back()}
                data-testid="button-back"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Retour
              </Button>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Produit non trouvé</h1>
            <p className="text-gray-600 mb-8">Le produit que vous recherchez n'existe pas ou n'est plus disponible.</p>
            <Button onClick={() => window.location.href = "/"}>
              Retour à l'accueil
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-primary">Pix Store DZ</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost"
                size="sm"
                className="relative"
                onClick={() => window.history.back()}
                data-testid="button-back"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Retour
              </Button>
              <Button 
                variant="ghost"
                size="sm"
                className="relative"
                onClick={() => setIsCheckoutOpen(true)}
                data-testid="button-cart"
              >
                <ShoppingCart className="h-5 w-5" />
                {cartState.itemCount > 0 && (
                  <Badge 
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-primary text-white text-xs"
                    data-testid="text-cart-count"
                  >
                    {cartState.itemCount}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Product Details */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="lg:grid lg:grid-cols-2 lg:gap-x-8 lg:items-start">
          {/* Product Images */}
          <div className="flex flex-col-reverse">
            {/* Image Gallery */}
            <div className="mx-auto mt-6 w-full max-w-2xl sm:block lg:max-w-none">
              <div className="grid grid-cols-4 gap-6" aria-orientation="horizontal">
                {availableImages.map((image, index) => (
                  <button
                    key={index}
                    className={`relative flex h-24 cursor-pointer items-center justify-center rounded-md text-sm font-medium uppercase hover:bg-gray-50 focus:outline-none focus:ring focus:ring-opacity-50 focus:ring-offset-4 ${
                      index === selectedImageIndex
                        ? "ring-2 ring-primary"
                        : "ring-1 ring-gray-200"
                    }`}
                    onClick={() => setSelectedImageIndex(index)}
                    data-testid={`button-image-${index}`}
                  >
                    <span className="sr-only">Image {index + 1}</span>
                    <span className="absolute inset-0 overflow-hidden rounded-md">
                      <img
                        src={image}
                        alt={`${product.name} ${index + 1}`}
                        className="h-full w-full object-cover object-center"
                      />
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Main Image */}
            <div className="w-full aspect-square">
              <img
                src={availableImages[selectedImageIndex]}
                alt={product.name}
                className="h-full w-full object-cover object-center sm:rounded-lg"
                data-testid="img-main-product"
              />
            </div>
          </div>

          {/* Product Info */}
          <div className="mt-10 px-4 sm:mt-16 sm:px-0 lg:mt-0">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900" data-testid="text-product-name">
              {product.name}
            </h1>

            <div className="mt-3">
              <p className="text-3xl tracking-tight text-primary font-bold" data-testid="text-product-price">
                {formatPrice(product.price)}
              </p>
            </div>

            {/* Description */}
            <div className="mt-6">
              <h3 className="sr-only">Description</h3>
              <div className="text-base text-gray-700" data-testid="text-product-description">
                <p>{product.description || "Description non disponible"}</p>
              </div>
            </div>

            {/* Size Selection */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="mt-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-900">Taille</h3>
                </div>
                <Select value={selectedSize} onValueChange={setSelectedSize}>
                  <SelectTrigger className="mt-2" data-testid="select-product-size">
                    <SelectValue placeholder="Sélectionner une taille" />
                  </SelectTrigger>
                  <SelectContent>
                    {product.sizes.map((size) => (
                      <SelectItem key={size} value={size}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Color Selection */}
            {product.colors && product.colors.length > 0 && (
              <div className="mt-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-900">Couleur</h3>
                </div>
                <Select value={selectedColor} onValueChange={setSelectedColor}>
                  <SelectTrigger className="mt-2" data-testid="select-product-color">
                    <SelectValue placeholder="Sélectionner une couleur" />
                  </SelectTrigger>
                  <SelectContent>
                    {product.colors.map((color) => (
                      <SelectItem key={color} value={color}>
                        {color}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Stock Status */}
            <div className="mt-6">
              {isOutOfStock ? (
                <Badge variant="destructive" className="text-sm">
                  Rupture de stock
                </Badge>
              ) : (
                <Badge variant="default" className="bg-green-100 text-green-800 text-sm">
                  En stock ({product.stock || 0} disponible{(product.stock || 0) > 1 ? 's' : ''})
                </Badge>
              )}
            </div>

            {/* Add to Cart */}
            <div className="mt-10 flex sm:flex-col1">
              <Button
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className="max-w-xs flex-1 bg-primary border border-transparent rounded-md py-3 px-8 flex items-center justify-center text-base font-medium text-white hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:w-full"
                data-testid="button-add-to-cart"
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                {isOutOfStock ? "Rupture de stock" : "Ajouter au panier"}
              </Button>

              <Button
                variant="outline"
                className="ml-4 py-3 px-3 rounded-md flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-500"
                data-testid="button-favorite"
              >
                <Heart className="h-6 w-6" />
                <span className="sr-only">Ajouter aux favoris</span>
              </Button>
            </div>

            {/* Features */}
            <section className="mt-12 pt-12 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-900 mb-4">Avantages</h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <Truck className="h-5 w-5 text-primary mt-1 mr-3" />
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Livraison dans toute l'Algérie</h4>
                    <p className="text-sm text-gray-500">Livraison rapide dans les 58 wilayas</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Shield className="h-5 w-5 text-primary mt-1 mr-3" />
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Qualité garantie</h4>
                    <p className="text-sm text-gray-500">Produits de qualité premium</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <RotateCcw className="h-5 w-5 text-primary mt-1 mr-3" />
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Échange facile</h4>
                    <p className="text-sm text-gray-500">Retour et échange sous 7 jours</p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
       {/* Checkout Modal */}
            <CheckoutModal
              isOpen={isCheckoutOpen}
              onClose={() => setIsCheckoutOpen(false)}
              cartState={cartState}
            />
    </div>
  );
}