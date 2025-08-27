import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import session from "express-session";
import pgSession from "connect-pg-simple";
import { registerRoutes } from "./routes";
import { setupVite, log } from "./vite";

// ===== Database - Use consistent import =====
import { db } from "./db"; // Import from your central db.ts file

const app = express();

// ===== Environment Variable Validation =====
const requiredEnvVars = ["DATABASE_URL", "SESSION_SECRET"];
requiredEnvVars.forEach((varName) => {
  if (!process.env[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
});

// ===== CORS =====
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        "https://pix-store-dz.vercel.app",
        "http://localhost:5173",
      ];
      if (!origin || allowedOrigins.includes(origin) || origin?.includes(".vercel.app")) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true, // allows cookies to be sent
  })
);

// ===== Session Store =====
const PgSession = pgSession(session);

app.use(
  session({
    store:
      process.env.NODE_ENV === "production"
        ? new PgSession({
            conString: process.env.DATABASE_URL!,
            createTableIfMissing: true, // Auto-create sessions table
            errorLog: (err) => console.error("Session store error:", err), // Log session errors
          })
        : undefined, // MemoryStore in dev
    secret: process.env.SESSION_SECRET, // No fallback for security
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production", // HTTPS in prod
      httpOnly: true,
      sameSite: "none", // Required for cross-origin cookies (Vercel ↔ Render)
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
    },
  })
);

// ===== Parsers =====
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ===== Request Logger =====
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        const responseStr = JSON.stringify(capturedJsonResponse);
        logLine += ` :: ${responseStr.length > 100 ? responseStr.slice(0, 99) + "…" : responseStr}`;
      }
      log(logLine);
    }
  });

  next();
});

// ===== Health Check (available in all environments for Render) =====
app.get("/health", (_req, res) => {
  res.json({ status: "OK", message: "Backend server is running" });
});

(async () => {
  const server = await registerRoutes(app);

  // ===== Error Handler =====
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error("Unhandled error:", { status, message, stack: err.stack });
    res.status(status).json({ message });
  });

  // ===== Development vs Production =====
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    console.log(
      "Production mode: Frontend is hosted on Vercel, not serving static files"
    );
  }

  // ===== PORT Binding (important for Render) =====
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(port, "0.0.0.0", () => {
    log(`🚀 Server running on port ${port}, NODE_ENV=${process.env.NODE_ENV}`);
  });
})();
