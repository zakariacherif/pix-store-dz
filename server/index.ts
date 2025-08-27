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

// ===== CORS =====
app.use(
  cors({
    origin: [
      "https://pix-store-dz.vercel.app", // frontend on Vercel
      "http://localhost:5173",           // local dev
    ],
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
            createTableIfMissing: true, // Add this to auto-create sessions table
          })
        : undefined, // MemoryStore only in dev
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production", // only over HTTPS in prod
      httpOnly: true,
      sameSite: "none", // important for cross-origin cookies (Vercel ↔ Render)
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
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }
      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // ===== Error Handler =====
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    console.error("Unhandled error:", err);
  });

  // ===== Development vs Production =====
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    console.log(
      "Production mode: Frontend is hosted on Vercel, not serving static files"
    );

    // Health check
    app.get("/health", (_req, res) => {
      res.json({ status: "OK", message: "Backend server is running" });
    });
  }

  // ===== PORT Binding (important for Render) =====
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(port, "0.0.0.0", () => {
    log(`🚀 Server running on port ${port}`);
  });
})();
