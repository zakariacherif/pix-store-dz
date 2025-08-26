import {
  products,
  orders,
  orderItems,
  wilayas,
  admins,
  type Product,
  type InsertProduct,
  type Order,
  type InsertOrder,
  type OrderItem,
  type InsertOrderItem,
  type Wilaya,
  type InsertWilaya,
  type Admin,
  type InsertAdmin,
  type OrderWithDetails,
  type CreateOrderRequest,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

export interface IStorage {
  // Products
  getProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product>;
  deleteProduct(id: string): Promise<void>;

  // Orders
  getOrders(): Promise<OrderWithDetails[]>;
  getOrder(id: string): Promise<OrderWithDetails | undefined>;
  createOrder(order: CreateOrderRequest): Promise<Order>;
  updateOrderStatus(id: string, status: string): Promise<Order>;

  // Wilayas
  getWilayas(): Promise<Wilaya[]>;
  getWilaya(id: string): Promise<Wilaya | undefined>;
  updateWilayaDeliveryPrice(id: string, price: string): Promise<Wilaya>;

  // Admin
  getAdminByEmail(email: string): Promise<Admin | undefined>;
  getAdminById(id: string): Promise<Admin | undefined>; // ← ADDED THIS METHOD
  createAdmin(admin: InsertAdmin): Promise<Admin>;

  // Categories
  getCategories(): Promise<string[]>;
  createCategory(category: string): Promise<void>;
  deleteCategory(category: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Products
  async getProducts(): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.isActive, true)).orderBy(desc(products.createdAt));
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async createProduct(productData: InsertProduct): Promise<Product> {
    const [product] = await db
      .insert(products)
      .values({
        ...productData,
        updatedAt: new Date(),
      })
      .returning();
    return product;
  }

  async updateProduct(id: string, productData: Partial<InsertProduct>): Promise<Product> {
    const [product] = await db
      .update(products)
      .set({
        ...productData,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning();
    return product;
  }

  async deleteProduct(id: string): Promise<void> {
    await db.update(products).set({ isActive: false }).where(eq(products.id, id));
  }

  // Orders
  async getOrders(): Promise<OrderWithDetails[]> {
    const ordersWithDetails = await db.query.orders.findMany({
      with: {
        wilaya: true,
        items: {
          with: {
            product: true,
          },
        },
      },
      orderBy: [desc(orders.createdAt)],
    });
    return ordersWithDetails;
  }

  async getOrder(id: string): Promise<OrderWithDetails | undefined> {
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, id),
      with: {
        wilaya: true,
        items: {
          with: {
            product: true,
          },
        },
      },
    });
    return order;
  }

  async createOrder(orderData: CreateOrderRequest): Promise<Order> {
    // Get wilaya for delivery price
    const wilaya = await this.getWilaya(orderData.wilayaId);
    if (!wilaya) {
      throw new Error("Wilaya not found");
    }

    // Calculate totals
    let subtotal = 0;
    const orderItemsData: InsertOrderItem[] = [];

    for (const item of orderData.items) {
      const product = await this.getProduct(item.productId);
      if (!product) {
        throw new Error(`Product ${item.productId} not found`);
      }
      const itemTotal = parseFloat(product.price) * item.quantity;
      subtotal += itemTotal;
      
      orderItemsData.push({
        productId: item.productId,
        quantity: item.quantity,
        price: product.price,
        orderId: "", // Will be set after order creation
      });
    }

    const deliveryPrice = parseFloat(wilaya.deliveryPrice);
    const total = subtotal + deliveryPrice;

    // Create order
    const [order] = await db
      .insert(orders)
      .values({
        customerName: orderData.customerName,
        customerPhone: orderData.customerPhone,
        wilayaId: orderData.wilayaId,
        address: orderData.address,
        subtotal: subtotal.toString(),
        deliveryPrice: wilaya.deliveryPrice,
        total: total.toString(),
      })
      .returning();

    // Create order items
    const itemsWithOrderId = orderItemsData.map(item => ({
      ...item,
      orderId: order.id,
    }));

    await db.insert(orderItems).values(itemsWithOrderId);

    return order;
  }

  async updateOrderStatus(id: string, status: string): Promise<Order> {
    const [order] = await db
      .update(orders)
      .set({ status, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return order;
  }

  // Wilayas
  async getWilayas(): Promise<Wilaya[]> {
    return await db.select().from(wilayas).orderBy(wilayas.code);
  }

  async getWilaya(id: string): Promise<Wilaya | undefined> {
    const [wilaya] = await db.select().from(wilayas).where(eq(wilayas.id, id));
    return wilaya;
  }

  async updateWilayaDeliveryPrice(id: string, price: string): Promise<Wilaya> {
    const [wilaya] = await db
      .update(wilayas)
      .set({ 
        deliveryPrice: price,
        updatedAt: new Date(),
      })
      .where(eq(wilayas.id, id))
      .returning();
    return wilaya;
  }

  // Admin
  async getAdminByEmail(email: string): Promise<Admin | undefined> {
    const [admin] = await db.select().from(admins).where(eq(admins.email, email));
    return admin;
  }

  // ADDED THIS METHOD - CRITICAL FOR FIXING LOGIN
  async getAdminById(id: string): Promise<Admin | undefined> {
    const [admin] = await db.select().from(admins).where(eq(admins.id, id));
    return admin;
  }

  async createAdmin(adminData: InsertAdmin): Promise<Admin> {
    const [admin] = await db
      .insert(admins)
      .values(adminData)
      .returning();
    return admin;
  }

  // Categories
  async getCategories(): Promise<string[]> {
    const result = await db
      .selectDistinct({ category: products.category })
      .from(products)
      .where(and(eq(products.isActive, true), sql`${products.category} IS NOT NULL`));
    
    return result
      .map(row => row.category)
      .filter(category => category && category.trim() !== "") as string[];
  }

  async createCategory(category: string): Promise<void> {
    // Categories are automatically created when products are assigned to them
    // This method serves as a validation point for category creation
    // No database operation needed as categories are derived from product categories
    return Promise.resolve();
  }

  async deleteCategory(category: string): Promise<void> {
    // Set category to null for all products with this category
    await db
      .update(products)
      .set({ category: null })
      .where(eq(products.category, category));
  }
}

export const storage = new DatabaseStorage();
