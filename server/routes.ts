import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProductSchema, insertWilayaSchema, type CreateOrderRequest } from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcrypt";
import session from "express-session";
import connectPg from "connect-pg-simple";

// Session configuration
const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
const pgStore = connectPg(session);

const sessionStore = new pgStore({
  conString: process.env.DATABASE_URL,
  createTableIfMissing: false,
  ttl: sessionTtl,
  tableName: "sessions",
});

const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || "fallback-secret-key",
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: sessionTtl,
  },
});

// Auth middleware
const isAuthenticated = (req: any, res: any, next: any) => {
  if (req.session && req.session.adminId) {
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

export async function registerRoutes(app: Express): Promise<Server> {
  // Session middleware
  app.use(sessionMiddleware);

  // Initialize admin user if not exists
  const initAdmin = async () => {
    try {
      const existingAdmin = await storage.getAdminByEmail("cherif.zakaria2019@gmail.com");
      if (!existingAdmin) {
        const hashedPassword = await bcrypt.hash("Cmz.0665397175", 10);
        await storage.createAdmin({
          email: "cherif.zakaria2019@gmail.com",
          password: hashedPassword,
        });
      }
    } catch (error) {
      console.error("Error initializing admin:", error);
    }
  };

  // Initialize default wilayas
  const initWilayas = async () => {
    try {
      const existingWilayas = await storage.getWilayas();
      if (existingWilayas.length === 0) {
        const defaultWilayas = [
          { code: "01", name: "Alger", deliveryPrice: "300" },
          { code: "31", name: "Oran", deliveryPrice: "500" },
          { code: "25", name: "Constantine", deliveryPrice: "600" },
          { code: "19", name: "Sétif", deliveryPrice: "550" },
          { code: "05", name: "Batna", deliveryPrice: "650" },
          { code: "23", name: "Annaba", deliveryPrice: "700" },
          { code: "13", name: "Tlemcen", deliveryPrice: "750" },
          // Add more wilayas as needed
        ];

        for (const wilayaData of defaultWilayas) {
          await storage.updateWilayaDeliveryPrice("", wilayaData.deliveryPrice);
        }
      }
    } catch (error) {
      console.error("Error initializing wilayas:", error);
    }
  };

  await initAdmin();
  await initWilayas();

  // Public routes

  // Get all products
  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
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
      console.error("Error fetching product:", error);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  // Get all wilayas
  app.get("/api/wilayas", async (req, res) => {
    try {
      const wilayas = await storage.getWilayas();
      res.json(wilayas);
    } catch (error) {
      console.error("Error fetching wilayas:", error);
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
      console.error("Error creating order:", error);
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
      console.error("Error during login:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid login data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to login" });
    }
  });

  app.post("/api/admin/logout", (req: any, res) => {
    req.session.destroy((err: any) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.json({ message: "Logout successful" });
    });
  });

  app.get("/api/admin/profile", isAuthenticated, async (req: any, res) => {
    try {
      const admin = await storage.getAdminByEmail("cherif.zakaria2019@gmail.com");
      if (!admin) {
        return res.status(404).json({ message: "Admin not found" });
      }
      res.json({ id: admin.id, email: admin.email });
    } catch (error) {
      console.error("Error fetching admin profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  // Protected admin routes

  // Products management
  app.post("/api/admin/products", isAuthenticated, async (req, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(productData);
      res.status(201).json(product);
    } catch (error) {
      console.error("Error creating product:", error);
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
      res.json(product);
    } catch (error) {
      console.error("Error updating product:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid product data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  app.delete("/api/admin/products/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteProduct(req.params.id);
      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Orders management
  app.get("/api/admin/orders", isAuthenticated, async (req, res) => {
    try {
      const orders = await storage.getOrders();
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.put("/api/admin/orders/:id/status", isAuthenticated, async (req, res) => {
    try {
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }
      const order = await storage.updateOrderStatus(req.params.id, status);
      res.json(order);
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({ message: "Failed to update order status" });
    }
  });

  // Delivery pricing management
  app.put("/api/admin/wilayas/:id/delivery-price", isAuthenticated, async (req, res) => {
    try {
      const { price } = req.body;
      if (!price) {
        return res.status(400).json({ message: "Price is required" });
      }
      const wilaya = await storage.updateWilayaDeliveryPrice(req.params.id, price);
      res.json(wilaya);
    } catch (error) {
      console.error("Error updating delivery price:", error);
      res.status(500).json({ message: "Failed to update delivery price" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
