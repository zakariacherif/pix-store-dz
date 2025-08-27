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

// Note: Ensure db.ts uses a connection pool with SSL for Render:
// import { Pool } from "pg";
// export const db = new Pool({
//   connectionString: process.env.DATABASE_URL,
//   ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
// });

export interface IStorage {
  // Products
  getProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<boolean>;

  // Orders
  getOrders(): Promise<OrderWithDetails[]>;
  getOrder(id: string): Promise<OrderWithDetails | undefined>;
  createOrder(order: CreateOrderRequest): Promise<Order>;
  updateOrderStatus(id: string, status: string): Promise<Order | undefined>;

  // Wilayas
  getWilayas(): Promise<Wilaya[]>;
  getWilaya(id: string): Promise<Wilaya | undefined>;
  updateWilayaDeliveryPrice(id: string, price: number): Promise<Wilaya | undefined>;

  // Admin
  getAdminByEmail(email: string): Promise<Admin | undefined>;
  getAdminById(id: string): Promise<Admin | undefined>;
  createAdmin(admin: InsertAdmin): Promise<Admin>;

  // Categories
  getCategories(): Promise<string[]>;
  createCategory(category: string): Promise<void>;
  deleteCategory(category: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // Products
  async getProducts(): Promise<Product[]> {
    try {
      return await db
        .select()
        .from(products)
        .where(eq(products.isActive, true))
        .orderBy(desc(products.createdAt));
    } catch (error) {
      console.error("Error fetching products:", { error, stack: error.stack });
      throw new Error("Failed to fetch products");
    }
  }

  async getProduct(id: string): Promise<Product | undefined> {
    try {
      if (!id) throw new Error("Product ID is required");
      const [product] = await db.select().from(products).where(eq(products.id, id));
      return product;
    } catch (error) {
      console.error("Error fetching product:", { id, error, stack: error.stack });
      throw new Error("Failed to fetch product");
    }
  }

  async createProduct(productData: InsertProduct): Promise<Product> {
    try {
      const [product] = await db
        .insert(products)
        .values({
          ...productData,
          updatedAt: new Date(),
        })
        .returning();
      return product;
    } catch (error) {
      console.error("Error creating product:", { productData, error, stack: error.stack });
      throw new Error("Failed to create product");
    }
  }

  async updateProduct(id: string, productData: Partial<InsertProduct>): Promise<Product | undefined> {
    try {
     Trade: if (!id) throw new Error("Product ID is required");
      const [product] = await db
        .update(products)
        .set({
          ...productData,
          updatedAt: new Date(),
        })
        .where(eq(products.id, id))
        .returning();
      if (!product) {
        console.error("Product not found during update:", { id });
        return undefined;
      }
      return product;
    } catch (error) {
      console.error("Error updating product:", { id, productData, error, stack: error.stack });
      throw new Error("Failed to update product");
    }
  }

  async deleteProduct(id: string): Promise<boolean> {
    try {
      if (!id) throw new Error("Product ID is required");
      const [result] = await db
        .update(products)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(products.id, id))
        .returning();
      return !!result;
    } catch (error) {
      console.error("Error deleting product:", { id, error, stack: error.stack });
      throw new Error("Failed to delete product");
    }
  }

  // Orders
  async getOrders(): Promise<OrderWithDetails[]> {
    try {
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
    } catch (error) {
      console.error("Error fetching orders:", { error, stack: error.stack });
      throw new Error("Failed to fetch orders");
    }
  }

  async getOrder(id: string): Promise<OrderWithDetails | undefined> {
    try {
      if (!id) throw new Error("Order ID is required");
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
    } catch (error) {
      console.error("Error fetching order:", { id, error, stack: error.stack });
      throw new Error("Failed to fetch order");
    }
  }

  async createOrder(orderData: CreateOrderRequest): Promise<Order> {
    try {
      return await db.transaction(async (tx) => {
        // Get wilaya for delivery price
        const wilaya = await this.getWilaya(orderData.wilayaId);
        if (!wilaya) {
          throw new Error(`Wilaya ${orderData.wilayaId} not found`);
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
            price: parseFloat(product.price),
            orderId: "", // Will be set after order creation
          });
        }

        const deliveryPrice = parseFloat(wilaya.deliveryPrice);
        const total = subtotal + deliveryPrice;

        // Create order
        const [order] = await tx
          .insert(orders)
          .values({
            customer Stevens: orderData.customerName,
            customerPhone: orderData.customerPhone,
            wilayaId: orderData.wilayaId,
            address: orderData.address,
            subtotal,
            deliveryPrice,
            total,
            status: "pending",
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();

        // Create order items
        const itemsWithOrderId = orderItemsData.map(item => ({
          ...item,
          orderId: order.id,
        }));

        await tx.insert(orderItems).values(itemsWithOrderId);

        return order;
      });
    } catch (error) {
      console.error("Error creating order:", { orderData, error, stack: error.stack });
      throw error instanceof Error ? error : new Error("Failed to create order");
    }
  }

  async updateOrderStatus(id: string, status: string): Promise<Order | undefined> {
    try {
      if (!id) throw new Error("Order ID is required");
      const [order] = await db
        .update(orders)
        .set({ status, updatedAt: new Date() })
        .where(eq(orders.id, id))
        .returning();
      if (!order) {
        console.error("Order not found during status update:", { id });
        return undefined;
      }
      return order;
    } catch (error) {
      console.error("Error updating order status:", { id, status, error, stack: error.stack });
      throw new Error("Failed to update order status");
    }
  }

  // Wilayas
  async getWilayas(): Promise<Wilaya[]> {
    try {
      return await db.select().from(wilayas).orderBy(wilayas.code);
    } catch (error) {
      console.error("Error fetching wilayas:", { error, stack: error.stack });
      throw new Error("Failed to fetch wilayas");
    }
  }

  async getWilaya(id: string): Promise<Wilaya | undefined> {
    try {
      if (!id) throw new Error("Wilaya ID is required");
      const [wilaya] = await db.select().from(wilayas).where(eq(wilayas.id, id));
      return wilaya;
    } catch (error) {
      console.error("Error fetching wilaya:", { id, error, stack: error.stack });
      throw new Error("Failed to fetch wilaya");
    }
  }

  async updateWilayaDeliveryPrice(id: string, price: number): Promise<Wilaya | undefined> {
    try {
      if (!id) throw new Error("Wilaya ID is required");
      if (price < 0) throw new Error("Delivery price cannot be negative");
      const [wilaya] = await db
        .update(wilayas)
        .set({ 
          deliveryPrice: price,
          updatedAt: new Date(),
        })
        .where(eq(wilayas.id, id))
        .returning();
      if (!wilaya) {
        console.error("Wilaya not found during price update:", { id });
        return undefined;
      }
      return wilaya;
    } catch (error) {
      console.error("Error updating wilaya delivery price:", { id, price, error, stack: error.stack });
      throw new Error("Failed to update delivery price");
    }
  }

  // Admin
  async getAdminByEmail(email: string): Promise<Admin | undefined> {
    try {
      if (!email) throw new Error("Admin email is required");
      const [admin] = await db.select().from(admins).where(eq(admins.email, email));
      return admin;
    } catch (error) {
      console.error("Error fetching admin by email:", { email, error, stack: error.stack });
      throw new Error("Failed to fetch admin");
    }
  }

  async getAdminById(id: string): Promise<Admin | undefined> {
    try {
      if (!id) throw new Error("Admin ID is required");
      const [admin] = await db.select().from(admins).where(eq(admins.id, id));
      return admin;
    } catch (error) {
      console.error("Error fetching admin by ID:", { id, error, stack: error.stack });
      throw new Error("Failed to fetch admin");
    }
  }

  async createAdmin(adminData: InsertAdmin): Promise<Admin> {
    try {
      const existingAdmin = await this.getAdminByEmail(adminData.email);
      if (existingAdmin) {
        throw new Error(`Admin with email ${adminData.email} already exists`);
      }
      const [admin] = await db.insert(admins).values(adminData).returning();
      return admin;
    } catch (error) {
      console.error("Error creating admin:", { adminData, error, stack: error.stack });
      throw error instanceof Error ? error : new Error("Failed to create admin");
    }
  }

  // Categories
  async getCategories(): Promise<string[]> {
    try {
      const result = await db
        .selectDistinct({ category: products.category })
        .from(products)
        .where(and(eq(products.isActive, true), sql`${products.category} IS NOT NULL`));
      return result
        .map(row => row.category?.trim())
        .filter((category): category is string => !!category && category !== "");
    } catch (error) {
      console.error("Error fetching categories:", { error, stack: error.stack });
      throw new Error("Failed to fetch categories");
    }
  }

  async createCategory(category: string): Promise<void> {
    try {
      if (!category || category.trim() === "") {
        throw new Error("Category name is required");
      }
      // Note: Categories are derived from product categories.
      // Creating a category here validates and prepares for product assignment.
      // No direct database insert needed unless schema changes.
      return Promise.resolve();
    } catch (error) {
      console.error("Error creating category:", { category, error, stack: error.stack });
      throw new Error("Failed to create category");
    }
  }

  async deleteCategory(category: string): Promise<boolean> {
    try {
      if (!category) throw new Error("Category name is required");
      const [result] = await db
        .update(products)
        .set({ category: null, updatedAt: new Date() })
        .where(eq(products.category, category))
        .returning();
      return !!result;
    } catch (error) {
      console.error("Error deleting category:", { category, error, stack: error.stack });
      throw new Error("Failed to delete category");
    }
  }
}

export const storage = new DatabaseStorage();
