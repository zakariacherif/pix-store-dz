import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Check } from "lucide-react";
import { Product } from "@shared/schema";
import { Link } from "wouter";

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const [isAdded, setIsAdded] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation(); // prevent triggering parent link
    e.preventDefault();
    onAddToCart(product);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const formatPrice = (price: string) => {
    const numPrice = parseFloat(price);
    return `${numPrice.toLocaleString()} DA`;
  };

  const isOutOfStock = product.stock !== null && product.stock <= 0;

  return (
    <Card 
      className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow overflow-hidden group cursor-pointer"
      data-testid={`card-product-${product.id}`}
    >
      <Link href={`/product/${product.id}`}>
        <div className="relative overflow-hidden block">
          <div className={`w-full h-64 bg-gray-200 ${!isImageLoaded ? 'animate-pulse' : ''}`}>
            <img
              src={product.imageUrl}
              alt={product.name}
              className={`w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300 ${
                isImageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setIsImageLoaded(true)}
              onError={() => setIsImageLoaded(true)}
              data-testid={`img-product-${product.id}`}
            />
          </div>

          {product.category === "nouveau" && (
            <Badge className="absolute top-4 left-4 bg-green-500 text-white">
              Nouveau
            </Badge>
          )}

          {isOutOfStock && (
            <Badge className="absolute top-4 left-4 bg-red-500 text-white">
              Rupture de stock
            </Badge>
          )}
        </div>
      </Link>
      
      <CardContent className="p-6">
        <Link href={`/product/${product.id}`}>
          <h3 
            className="font-semibold text-lg text-gray-900 mb-2"
            data-testid={`text-product-name-${product.id}`}
          >
            {product.name}
          </h3>
        </Link>

        <p 
          className="text-gray-600 text-sm mb-4"
          data-testid={`text-product-description-${product.id}`}
        >
          {product.description || "Description non disponible"}
        </p>
        
        <div className="flex items-center justify-between">
          <div 
            className="text-2xl font-bold text-primary"
            data-testid={`text-product-price-${product.id}`}
          >
            {formatPrice(product.price)}
          </div>
          
          <Button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`transition-colors ${
              isAdded 
                ? "bg-green-500 hover:bg-green-600" 
                : "bg-primary hover:bg-primary-dark"
            } ${isOutOfStock ? "bg-gray-400 cursor-not-allowed" : ""}`}
            data-testid={`button-add-cart-${product.id}`}
          >
            {isAdded ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Ajouté
              </>
            ) : (
              <>
                <ShoppingCart className="h-4 w-4 mr-2" />
                {isOutOfStock ? "Indisponible" : "Ajouter"}
              </>
            )}
          </Button>
        </div>
        
        {product.stock !== null && product.stock > 0 && product.stock <= 5 && (
          <p className="text-orange-500 text-xs mt-2" data-testid={`text-stock-warning-${product.id}`}>
            Plus que {product.stock} en stock !
          </p>
        )}
      </CardContent>
    </Card>
  );
}
