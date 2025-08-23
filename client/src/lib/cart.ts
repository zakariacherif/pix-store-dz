import { CartItem, CartState } from "@/types";

class CartManager {
  private listeners: ((state: CartState) => void)[] = [];
  private state: CartState = {
    items: [],
    total: 0,
    itemCount: 0,
  };

  constructor() {
    // Load cart from localStorage
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem("cart");
      if (stored) {
        this.state = JSON.parse(stored);
      }
    } catch (error) {
      console.error("Error loading cart from storage:", error);
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem("cart", JSON.stringify(this.state));
    } catch (error) {
      console.error("Error saving cart to storage:", error);
    }
  }

  private calculateTotals() {
    this.state.itemCount = this.state.items.reduce((sum, item) => sum + item.quantity, 0);
    this.state.total = this.state.items.reduce((sum, item) => {
      const price = parseFloat(item.price.replace(/[^\d.]/g, ""));
      return sum + (price * item.quantity);
    }, 0);
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.state));
  }

  addItem(product: { id: string; name: string; price: string; imageUrl: string }) {
    const existingItem = this.state.items.find(item => item.id === product.id);
    
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      this.state.items.push({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        imageUrl: product.imageUrl,
      });
    }
    
    this.calculateTotals();
    this.saveToStorage();
    this.notifyListeners();
  }

  removeItem(productId: string) {
    this.state.items = this.state.items.filter(item => item.id !== productId);
    this.calculateTotals();
    this.saveToStorage();
    this.notifyListeners();
  }

  updateQuantity(productId: string, quantity: number) {
    const item = this.state.items.find(item => item.id === productId);
    if (item) {
      if (quantity <= 0) {
        this.removeItem(productId);
      } else {
        item.quantity = quantity;
        this.calculateTotals();
        this.saveToStorage();
        this.notifyListeners();
      }
    }
  }

  clearCart() {
    this.state = {
      items: [],
      total: 0,
      itemCount: 0,
    };
    this.saveToStorage();
    this.notifyListeners();
  }

  getState(): CartState {
    return { ...this.state };
  }

  subscribe(listener: (state: CartState) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
}

export const cartManager = new CartManager();
