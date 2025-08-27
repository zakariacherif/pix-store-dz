import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProductSchema, insertWilayaSchema, type CreateOrderRequest, wilayas } from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcrypt";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { db } from "./db";

// ===== Environment Variable Validation =====
const requiredEnvVars = ["DATABASE_URL", "SESSION_SECRET"];
requiredEnvVars.forEach((varName) => {
  if (!process.env[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
});

// Session configuration
const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
const pgStore = connectPg(session);

const sessionStore = new pgStore({
  conString: process.env.DATABASE_URL,
  createTableIfMissing: true, // Auto-create sessions table
  ttl: sessionTtl / 1000, // Convert to seconds for connect-pg-simple
  tableName: "sessions",
  errorLog: (err) => console.error("Session store error:", err), // Log session errors
});

// Session middleware
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET, // No fallback for security
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // HTTPS in prod
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // Cross-origin for Vercel
    maxAge: sessionTtl,
  },
});

// Extend session interface
declare module "express-session" {
  interface SessionData {
    adminId?: string;
  }
}

// Auth middleware
const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.session?.adminId) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
};

// Validation schemas
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const orderSchema = z.object({
  customerName: z.string().min(1),
  customerPhone: z.string().min(1),
  wilayaId: z.string().min(1),
  address: z.string().optional(),
  items: z.array(z.object({
    productId: z.string().min(1),
    quantity: z.number().min(1),
  })).min(1),
});

const orderStatusSchema = z.enum(["pending", "confirmed", "shipped", "delivered", "cancelled"]);

export async function registerRoutes(app: Express): Promise<Server> {
  // Session middleware
  app.use(sessionMiddleware);

  // Initialize admin user if not exists
  const initAdmin = async () => {
    try {
      const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";
      const adminPassword = process.env.ADMIN_PASSWORD || "secure-random-password"; // Set in Render env
      const existingAdmin = await storage.getAdminByEmail(adminEmail);
      if (!existingAdmin) {
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        await storage.createAdmin({
          email: adminEmail,
          password: hashedPassword,
        });
        console.log(`Admin created: ${adminEmail}`);
      }
    } catch (error) {
      console.error("Error initializing admin:", { error, stack: error.stack });
    }
  };

  // Initialize all 58 Algerian wilayas
  const initWilayas = async () => {
    try {
      const existingWilayas = await storage.getWilayas();
      if (existingWilayas.length === 0) {
        const algerianWilayas = [
          { code: "01", name: "Adrar", deliveryPrice: 800 },
          { code: "02", name: "Chlef", deliveryPrice: 500 },
          { code: "03", name: "Laghouat", deliveryPrice: 700 },
          { code: "04", name: "Oum El Bouaghi", deliveryPrice: 600 },
          { code: "05", name: "Batna", deliveryPrice: 650 },
          { code: "06", name: "Béjaïa", deliveryPrice: 550 },
          { code: "07", name: "Biskra", deliveryPrice: 700 },
          { code: "08", name: "Béchar", deliveryPrice: 900 },
          { code: "09", name: "Blida", deliveryPrice: 350 },
          { code: "10", name: "Bouira", deliveryPrice: 400 },
          { code: "11", name: "Tamanrasset", deliveryPrice: 1000 },
          { code: "12", name: "Tébessa", deliveryPrice: 750 },
          { code: "13", name: "Tlemcen", deliveryPrice: 600 },
          { code: "14", name: "Tiaret", deliveryPrice: 550 },
          { code: "15", name: "Tizi Ouzou", deliveryPrice: 450 },
          { code: "16", name: "Alger", deliveryPrice: 300 },
          { code: "17", name: "Djelfa", deliveryPrice: 650 },
          { code: "18", name: "Jijel", deliveryPrice: 600 },
          { code: "19", name: "Sétif", deliveryPrice: 550 },
          { code: "20", name: "Saïda", deliveryPrice: 650 },
          { code: "21", name: "Skikda", deliveryPrice: 650 },
          { code: "22", name: "Sidi Bel Abbès", deliveryPrice: 600 },
          { code: "23", name: "Annaba", deliveryPrice: 700 },
          { code: "24", name: "Guelma", deliveryPrice: 650 },
          { code: "25", name: "Constantine", deliveryPrice: 600 },
          { code: "26", name: "Médéa", deliveryPrice: 450 },
          { code: "27", name: "Mostaganem", deliveryPrice: 550 },
          { code: "28", name: "M'Sila", deliveryPrice: 650 },
          { code: "29", name: "Mascara", deliveryPrice: 600 },
          { code: "30", name: "Ouargla", deliveryPrice: 800 },
          { code: "31", name: "Oran", deliveryPrice: 500 },
          { code: "32", name: "El Bayadh", deliveryPrice: 700 },
          { code: "33", name: "Illizi", deliveryPrice: 1000 },
          { code: "34", name: "Bordj Bou Arréridj", deliveryPrice: 550 },
          { code: "35", name: "Boumerdès", deliveryPrice: 400 },
          { code: "36", name: "El Tarf", deliveryPrice: 750 },
          { code: "37", name: "Tindouf", deliveryPrice: 1000 },
          { code: "38", name: "Tissemsilt", deliveryPrice: 600 },
          { code: "39", name: "El Oued", deliveryPrice: 750 },
          { code: "40", name: "Khenchela", deliveryPrice: 700 },
          { code: "41", name: "Souk Ahras", deliveryPrice: 700 },
          { code: "42", name: "Tipaza", deliveryPrice: 400 },
          { code: "43", name: "Mila", deliveryPrice: 650 },
          { code: "44", name: "Aïn Defla", deliveryPrice: 500 },
          { code: "45", name: "Naâma", deliveryPrice: 750 },
          { code: "46", name: "Aïn Témouchent", deliveryPrice: 600 },
          { code: "47", name: "Ghardaïa", deliveryPrice: 750 },
          { code: "48", name: "Relizane", deliveryPrice: 550 },
          { code: "49", name: "Timimoun", deliveryPrice: 900 },
          { code: "50", name: "Bordj Badji Mokhtar", deliveryPrice: 1000 },
          { code: "51", name: "Ouled Djellal", deliveryPrice: 700 },
          { code: "52", name: "Béni Abbès", deliveryPrice: 900 },
          { code: "53", name: "In Salah", deliveryPrice: 1000 },
          { code: "54", name: "In Guezzam", deliveryPrice: 1000 },
          { code: "55", name: "Touggourt", deliveryPrice: 750 },
          { code: "56", name: "Djanet", deliveryPrice: 1000 },
          { code: "57", name: "El M'Ghair", deliveryPrice: 800 },
          { code: "58", name: "El Meniaa", deliveryPrice: 800 },
        ];

        // Batch insert for performance
        await db.insert(wilayas).values(algerianWilayas).onConflictDoNothing();
        console.log("Wilayas initialized");
      }
    } catch (error) {
      console.error("Error initializing wilayas:", { error, stack: error.stack });
    }
  };

  await initAdmin();
  await initWilayas();

  // Public routes

  // Get all products
  app.get("/api/products", async (_req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", { error, stack: error.stack });
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  // Get single product
  app.get("/api/products/:id", async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", { error, stack: error.stack });
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  // Get all wilayas
  app.get("/api/wilayas", async (_req, res) => {
    try {
      const wilayas = await storage.getWilayas();
      res.json(wilayas);
    } catch (error) {
      console.error("Error fetching wilayas:", { error, stack: error.stack });
      res.status(500).json({ message: "Failed to fetch wilayas" });
    }
  });

  // Create order
  app.post("/api/orders", async (req, res) => {
    try {
      const orderData = orderSchema.parse(req.body);
      const order = await storage.createOrder(orderData as CreateOrderRequest);
      res.status(201).json(order);
    } catch (error) {
      console.error("Error creating order:", { error, stack: error.stack });
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid order data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  // Admin authentication
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      const admin = await storage.getAdminByEmail(email);
      if (!admin) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(password, admin.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      req.session.adminId = admin.id;
      res.json({ message: "Login successful", admin: { id: admin.id, email: admin.email } });
    } catch (error) {
      console.error("Error during login:", { error, stack: error.stack });
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid login data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to login" });
    }
  });

  app.post("/api/admin/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Error during logout:", { err, stack: err.stack });
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.json({ message: "Logout successful" });
    });
  });

  app.get("/api/admin/profile", isAuthenticated, async (req, res) => {
    try {
      const admin = await storage.getAdminById(req.session.adminId!);
      if (!admin) {
        return res.status(404).json({ message: "Admin not found" });
      }
      res.json({ id: admin.id, email: admin.email });
    } catch (error) {
      console.error("Error fetching admin profile:", { error, stack: error.stack });
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  // Protected admin routes

  // Analytics endpoint
  app.get("/api/admin/analytics", isAuthenticated, async (_req, res) => {
    try {
      const products = await storage.getProducts();
      const orders = await storage.getOrders();
      
      const totalProducts = products.length;
      const totalOrders = orders.length;
      const pendingOrders = orders.filter(order => order.status === "pending").length;
      const totalRevenue = orders
        .filter(order => order.status === "delivered")
        .reduce((sum, order) => sum + parseFloat(order.total), 0);

      res.json({
        totalProducts,
        totalOrders,
        pendingOrders,
        totalRevenue,
      });
    } catch (error) {
      console.error("Error fetching analytics:", { error, stack: error.stack });
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Products management
  app.post("/api/admin/products", isAuthenticated, async (req, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(productData);
      res.status(201).json(product);
    } catch (error) {
      console.error("Error creating product:", { error, stack: error.stack });
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid product data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.put("/api/admin/products/:id", isAuthenticated, async (req, res) => {
    try {
      const productData = insertProductSchema.partial().parse(req.body);
      const product = await storage.updateProduct(req.params.id, productData);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error("Error updating product:", { error, stack: error.stack });
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid product data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  app.delete("/api/admin/products/:id", isAuthenticated, async (req, res) => {
    try {
      const deleted = await storage.deleteProduct(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      console.error("Error deleting product:", { error, stack: error.stack });
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Orders management
  app.get("/api/admin/orders", isAuthenticated, async (_req, res) => {
    try {
      const orders = await storage.getOrders();
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", { error, stack: error.stack });
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.put("/api/admin/orders/:id/status", isAuthenticated, async (req, res) => {
    try {
      const { status } = orderStatusSchema.parse(req.body);
      const order = await storage.updateOrderStatus(req.params.id, status);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      console.error("Error updating order status:", { error, stack: error.stack });
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid status", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update order status" });
    }
  });

  // Delivery pricing management
  app.put("/api/admin/wilayas/:id/delivery-price", isAuthenticated, async (req, res) => {
    try {
      const { price } = z.object({ price: z.number().min(0) }).parse(req.body);
      const wilaya = await storage.updateWilayaDeliveryPrice(req.params.id, price);
      if (!wilaya) {
        return res.status(404).json({ message: "Wilaya not found" });
      }
      res.json(wilaya);
    } catch (error) {
      console.error("Error updating delivery price:", { error, stack: error.stack });
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid price", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update delivery price" });
    }
  });

  // Category management
  app.get("/api/admin/categories", isAuthenticated, async (_req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", { error, stack: error.stack });
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post("/api/admin/categories", isAuthenticated, async (req, res) => {
    try {
      const { name } = z.object({ name: z.string().min(1).trim() }).parse(req.body);
      const categoryName = name.toLowerCase();
      const categories = await storage.getCategories();
      
      if (categories.includes(categoryName)) {
        return res.status(409).json({ message: "Category already exists" });
      }
      
      await storage.createCategory(categoryName);
      res.status(201).json({ message: "Category created successfully", category: categoryName });
    } catch (error) {
      console.error("Error creating category:", { error, stack: error.stack });
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid category name", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  app.delete("/api/admin/categories/:category", isAuthenticated, async (req, res) => {
    try {
      const deleted = await storage.deleteCategory(req.params.category);
      if (!deleted) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json({ message: "Category deleted successfully" });
    } catch (error) {
      console.error("Error deleting category:", { error, stack: error.stack });
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
