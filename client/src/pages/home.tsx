import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Users, Truck, Menu, X, CheckCircle } from "lucide-react";
import ProductCard from "@/components/product-card";
import CheckoutModal from "@/components/checkout-modal";
import { cartManager } from "@/lib/cart";
import { CartState } from "@/types";
import { Product } from "@shared/schema";

export default function Home() {
  const [cartState, setCartState] = useState<CartState>(cartManager.getState());
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  useEffect(() => {
    const unsubscribe = cartManager.subscribe(setCartState);
    return unsubscribe;
  }, []);

  const filteredProducts = products.filter(product => {
    if (activeFilter === "all") return true;
    if (activeFilter === "home") {
      return product.category === "home";
    }
    
    return true;
  });

  const handleAddToCart = (product: Product) => {
    cartManager.addItem({
      id: product.id,
      name: product.name,
      price: `${product.price} DA`,
      imageUrl: product.imageUrl,
    });
  };

  const filters = [
    { key: "all", label: "Tous les produits" },
    { key: "home", label: "Home" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl font-bold text-primary">Pix Store DZ</span>
              </div>
              <div className="hidden md:block ml-10">
                <div className="flex items-baseline space-x-8">
                  <a href="#" className="text-gray-900 hover:text-primary px-3 py-2 text-sm font-medium transition-colors">
                    Accueil
                  </a>
                  <a href="#products" className="text-primary px-3 py-2 text-sm font-medium">
                    Produits
                  </a>
                  <a href="#" className="text-gray-900 hover:text-primary px-3 py-2 text-sm font-medium transition-colors">
                    À propos
                  </a>
                  <a href="#" className="text-gray-900 hover:text-primary px-3 py-2 text-sm font-medium transition-colors">
                    Contact
                  </a>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
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
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                data-testid="button-mobile-menu"
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>
        
        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <a href="#" className="block px-3 py-2 text-gray-900 hover:text-primary transition-colors">
                Accueil
              </a>
              <a href="#products" className="block px-3 py-2 text-primary">
                Produits
              </a>
              <a href="#" className="block px-3 py-2 text-gray-900 hover:text-primary transition-colors">
                À propos
              </a>
              <a href="#" className="block px-3 py-2 text-gray-900 hover:text-primary transition-colors">
                Contact
              </a>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary via-coral to-orange-600 text-white py-24 md:py-32 overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 bg-black bg-opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-x-32 -translate-y-32"></div>
          <div className="absolute top-1/2 right-0 w-96 h-96 bg-white opacity-5 rounded-full translate-x-48 -translate-y-48"></div>
          <div className="absolute bottom-0 left-1/3 w-32 h-32 bg-white opacity-10 rounded-full translate-y-16"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mb-8">
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold mb-6 tracking-tight" data-testid="text-hero-title">
                <span className="bg-gradient-to-r from-white to-orange-100 bg-clip-text text-transparent">
                  Pix Store DZ
                </span>
              </h1>
              <div className="w-24 h-1 bg-white mx-auto rounded-full opacity-60"></div>
            </div>
            
            <p className="text-2xl md:text-3xl lg:text-4xl mb-8 font-light leading-relaxed" data-testid="text-hero-subtitle">
              Votre destination pour les 
              <span className="font-semibold text-orange-200"> meilleurs t-shirts</span> en Algérie
            </p>
            
            <p className="text-lg md:text-xl mb-12 max-w-3xl mx-auto leading-relaxed opacity-90" data-testid="text-hero-description">
              Découvrez notre collection exclusive de t-shirts de qualité premium. 
              Designs uniques, matières exceptionnelles et livraison rapide dans toutes les wilayas d'Algérie.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                size="lg"
                className="bg-white text-primary hover:bg-gray-100 font-semibold px-8 py-4 text-lg rounded-full shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}
                data-testid="button-shop-now"
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                Découvrir la Collection
              </Button>
              
              <Button 
                variant="outline"
                size="lg"
                className="border-2 border-white text-white hover:bg-white hover:text-primary font-semibold px-8 py-4 text-lg rounded-full backdrop-blur-sm bg-white bg-opacity-10 hover:bg-opacity-100 transition-all duration-300"
                data-testid="button-learn-more"
              >
                En savoir plus
              </Button>
            </div>
            
            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-6 border border-white border-opacity-20">
                <div className="text-3xl font-bold mb-2">58</div>
                <div className="text-orange-200 font-medium">Wilayas couvertes</div>
              </div>
              <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-6 border border-white border-opacity-20">
                <div className="text-3xl font-bold mb-2">100%</div>
                <div className="text-orange-200 font-medium">Qualité garantie</div>
              </div>
              <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-6 border border-white border-opacity-20">
                <div className="text-3xl font-bold mb-2">24h</div>
                <div className="text-orange-200 font-medium">Livraison express</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg className="w-full h-12 md:h-20 text-white" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M0,0V60c0,0,200,40,600,40s600-40,600-40V0Z" className="fill-current"></path>
          </svg>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="space-y-4">
              <div className="text-primary text-5xl">
                <Users className="mx-auto" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900" data-testid="text-stat-clients">5000+</h3>
              <p className="text-gray-600">Clients satisfaits</p>
            </div>
            <div className="space-y-4">
              <div className="text-primary text-5xl">
                <Truck className="mx-auto" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900" data-testid="text-stat-wilayas">58 Wilayas</h3>
              <p className="text-gray-600">Livraison nationale</p>
            </div>
            <div className="space-y-4">
              <div className="text-primary text-5xl">
                <CheckCircle className="mx-auto" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900" data-testid="text-stat-quality">100%</h3>
              <p className="text-gray-600">Qualité garantie</p>
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section id="products" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4" data-testid="text-products-title">
              Nos T-shirts
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto" data-testid="text-products-subtitle">
              Collection exclusive de t-shirts de qualité premium pour hommes et femmes
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap justify-center mb-12 space-x-4">
            {filters.map((filter) => (
              <Button
                key={filter.key}
                variant={activeFilter === filter.key ? "default" : "outline"}
                className={`px-6 py-2 rounded-full transition-colors ${
                  activeFilter === filter.key
                    ? "bg-primary text-white border-primary"
                    : "border-gray-300 text-gray-700 hover:border-primary hover:text-primary"
                }`}
                onClick={() => setActiveFilter(filter.key)}
                data-testid={`button-filter-${filter.key}`}
              >
                {filter.label}
              </Button>
            ))}
          </div>

          {/* Product Grid */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-gray-600">Chargement des produits...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8" data-testid="grid-products">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
          )}

          {filteredProducts.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg" data-testid="text-no-products">
                Aucun produit trouvé pour cette recherche.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="text-2xl font-bold text-primary mb-4">Pix Store DZ</div>
              <p className="text-gray-300 mb-4">
                Votre destination pour les meilleurs t-shirts en Algérie. Qualité premium, livraison rapide dans toutes les wilayas.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold text-lg mb-4">Navigation</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-300 hover:text-primary transition-colors">Accueil</a></li>
                <li><a href="#products" className="text-gray-300 hover:text-primary transition-colors">Produits</a></li>
                <li><a href="#" className="text-gray-300 hover:text-primary transition-colors">À propos</a></li>
                <li><a href="#" className="text-gray-300 hover:text-primary transition-colors">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-lg mb-4">Service Client</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-300 hover:text-primary transition-colors">Livraison</a></li>
                <li><a href="#" className="text-gray-300 hover:text-primary transition-colors">Retours</a></li>
                <li><a href="#" className="text-gray-300 hover:text-primary transition-colors">FAQ</a></li>
                <li><a href="#" className="text-gray-300 hover:text-primary transition-colors">Support</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-lg mb-4">Contact</h4>
              <div className="space-y-2 text-gray-300">
                <p>+213 XXX XXX XXX</p>
                <p>contact@pixstoredz.com</p>
                <p>Alger, Algérie</p>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Pix Store DZ. Tous droits réservés.</p>
          </div>
        </div>
      </footer>

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cartState={cartState}
      />
    </div>
  );
}
