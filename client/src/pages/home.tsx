import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, ShoppingCart, Users, Truck, Shield, Menu, X } from "lucide-react";
import ProductCard from "@/components/product-card";
import CheckoutModal from "@/components/checkout-modal";
import { cartManager } from "@/lib/cart";
import { CartState } from "@/types";
import { Product } from "@shared/schema";

export default function Home() {
  const [cartState, setCartState] = useState<CartState>(cartManager.getState());
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  useEffect(() => {
    const unsubscribe = cartManager.subscribe(setCartState);
    return unsubscribe;
  }, []);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeFilter === "all") return matchesSearch;
    if (activeFilter === "nouveau") return matchesSearch; // Could add a "isNew" field
    if (activeFilter === "homme" || activeFilter === "femme") {
      return matchesSearch && product.category === activeFilter;
    }
    
    return matchesSearch;
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
    { key: "homme", label: "Homme" },
    { key: "femme", label: "Femme" },
    { key: "nouveau", label: "Nouveautés" },
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
              <a href="/admin" className="hidden md:block text-sm text-gray-600 hover:text-primary transition-colors">
                <Shield className="h-4 w-4 inline mr-1" />
                Admin
              </a>
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
              <a href="/admin" className="block px-3 py-2 text-gray-600 hover:text-primary transition-colors">
                Admin
              </a>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary to-coral text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6" data-testid="text-hero-title">
            Pix Store DZ
          </h1>
          <p className="text-xl md:text-2xl mb-8 opacity-90" data-testid="text-hero-subtitle">
            Votre destination pour les meilleurs t-shirts en Algérie
          </p>
          <p className="text-lg mb-10 max-w-2xl mx-auto opacity-80" data-testid="text-hero-description">
            Découvrez notre collection exclusive de t-shirts de qualité premium. Livraison dans toute l'Algérie avec les meilleurs prix.
          </p>
          
          {/* Search Bar */}
          <div className="max-w-lg mx-auto relative">
            <Input
              type="text"
              placeholder="Rechercher des produits..."
              className="w-full px-6 py-4 pr-16 rounded-full text-gray-900 text-lg border-0"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-search"
            />
            <Button
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-primary hover:bg-primary-dark text-white rounded-full"
              data-testid="button-search"
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
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
                <Shield className="mx-auto" />
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
