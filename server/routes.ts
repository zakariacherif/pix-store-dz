import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProductSchema, insertWilayaSchema, type CreateOrderRequest, wilayas } from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcrypt";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { db } from "./db";

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

// Extend session interface
declare module "express-session" {
  interface SessionData {
    adminId?: string;
  }
}

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

  // Initialize all 58 Algerian wilayas
  const initWilayas = async () => {
    try {
      const existingWilayas = await storage.getWilayas();
      if (existingWilayas.length === 0) {
        const algerianWilayas = [
          { code: "01", name: "Adrar", deliveryPrice: "800" },
          { code: "02", name: "Chlef", deliveryPrice: "500" },
          { code: "03", name: "Laghouat", deliveryPrice: "700" },
          { code: "04", name: "Oum El Bouaghi", deliveryPrice: "600" },
          { code: "05", name: "Batna", deliveryPrice: "650" },
          { code: "06", name: "Béjaïa", deliveryPrice: "550" },
          { code: "07", name: "Biskra", deliveryPrice: "700" },
          { code: "08", name: "Béchar", deliveryPrice: "900" },
          { code: "09", name: "Blida", deliveryPrice: "350" },
          { code: "10", name: "Bouira", deliveryPrice: "400" },
          { code: "11", name: "Tamanrasset", deliveryPrice: "1000" },
          { code: "12", name: "Tébessa", deliveryPrice: "750" },
          { code: "13", name: "Tlemcen", deliveryPrice: "600" },
          { code: "14", name: "Tiaret", deliveryPrice: "550" },
          { code: "15", name: "Tizi Ouzou", deliveryPrice: "450" },
          { code: "16", name: "Alger", deliveryPrice: "300" },
          { code: "17", name: "Djelfa", deliveryPrice: "650" },
          { code: "18", name: "Jijel", deliveryPrice: "600" },
          { code: "19", name: "Sétif", deliveryPrice: "550" },
          { code: "20", name: "Saïda", deliveryPrice: "650" },
          { code: "21", name: "Skikda", deliveryPrice: "650" },
          { code: "22", name: "Sidi Bel Abbès", deliveryPrice: "600" },
          { code: "23", name: "Annaba", deliveryPrice: "700" },
          { code: "24", name: "Guelma", deliveryPrice: "650" },
          { code: "25", name: "Constantine", deliveryPrice: "600" },
          { code: "26", name: "Médéa", deliveryPrice: "450" },
          { code: "27", name: "Mostaganem", deliveryPrice: "550" },
          { code: "28", name: "M'Sila", deliveryPrice: "650" },
          { code: "29", name: "Mascara", deliveryPrice: "600" },
          { code: "30", name: "Ouargla", deliveryPrice: "800" },
          { code: "31", name: "Oran", deliveryPrice: "500" },
          { code: "32", name: "El Bayadh", deliveryPrice: "700" },
          { code: "33", name: "Illizi", deliveryPrice: "1000" },
          { code: "34", name: "Bordj Bou Arréridj", deliveryPrice: "550" },
          { code: "35", name: "Boumerdès", deliveryPrice: "400" },
          { code: "36", name: "El Tarf", deliveryPrice: "750" },
          { code: "37", name: "Tindouf", deliveryPrice: "1000" },
          { code: "38", name: "Tissemsilt", deliveryPrice: "600" },
          { code: "39", name: "El Oued", deliveryPrice: "750" },
          { code: "40", name: "Khenchela", deliveryPrice: "700" },
          { code: "41", name: "Souk Ahras", deliveryPrice: "700" },
          { code: "42", name: "Tipaza", deliveryPrice: "400" },
          { code: "43", name: "Mila", deliveryPrice: "650" },
          { code: "44", name: "Aïn Defla", deliveryPrice: "500" },
          { code: "45", name: "Naâma", deliveryPrice: "750" },
          { code: "46", name: "Aïn Témouchent", deliveryPrice: "600" },
          { code: "47", name: "Ghardaïa", deliveryPrice: "750" },
          { code: "48", name: "Relizane", deliveryPrice: "550" },
          { code: "49", name: "Timimoun", deliveryPrice: "900" },
          { code: "50", name: "Bordj Badji Mokhtar", deliveryPrice: "1000" },
          { code: "51", name: "Ouled Djellal", deliveryPrice: "700" },
          { code: "52", name: "Béni Abbès", deliveryPrice: "900" },
          { code: "53", name: "In Salah", deliveryPrice: "1000" },
          { code: "54", name: "In Guezzam", deliveryPrice: "1000" },
          { code: "55", name: "Touggourt", deliveryPrice: "750" },
          { code: "56", name: "Djanet", deliveryPrice: "1000" },
          { code: "57", name: "El M'Ghair", deliveryPrice: "800" },
          { code: "58", name: "El Meniaa", deliveryPrice: "800" }
        ];

        for (const wilayaData of algerianWilayas) {
          const [wilaya] = await db
            .insert(wilayas)
            .values({
              code: wilayaData.code,
              name: wilayaData.name,
              deliveryPrice: wilayaData.deliveryPrice,
            })
            .returning();
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

  // Category management
  app.get("/api/admin/categories", isAuthenticated, async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.delete("/api/admin/categories/:category", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteCategory(req.params.category);
      res.json({ message: "Category deleted successfully" });
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
