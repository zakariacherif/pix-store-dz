export interface CartItem {
  id: string;
  name: string;
  price: string;
  quantity: number;
  imageUrl: string;
}

export interface CartState {
  items: CartItem[];
  total: number;
  itemCount: number;
}

export interface AdminAuth {
  isAuthenticated: boolean;
  admin: { id: string; email: string } | null;
}
