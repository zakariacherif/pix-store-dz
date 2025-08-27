import { QueryClient, QueryFunction } from "@tanstack/react-query";

// ===== Backend Base URL (Render) =====
// Use environment variable for flexibility across environments (dev, prod)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://pix-store-dz.onrender.com";

// Validate API_BASE_URL
if (!API_BASE_URL) {
  throw new Error("NEXT_PUBLIC_API_URL environment variable is not set");
}

// ===== Error Handling =====
async function throwIfResNotOk(res: Response, method: string, url: string) {
  if (!res.ok) {
    let errorMessage = `${res.status}: ${res.statusText}`;
    try {
      const text = await res.text();
      errorMessage = `${res.status}: ${text || res.statusText} (${method} ${url})`;
    } catch (err) {
      console.error("Error parsing response:", err);
    }
    const error = new Error(errorMessage);
    (error as any).status = res.status;
    throw error;
  }
}

// ===== Helper to always prepend backend URL =====
function withBaseUrl(url: string) {
  if (url.startsWith("http")) return url; // already absolute
  if (!url.startsWith("/")) url = "/" + url; // ensure leading slash
  return `${API_BASE_URL}${url}`;
}

// ===== Generic API Request =====
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown,
  options: { on401?: "returnNull" | "throw" } = { on401: "throw" }
): Promise<Response | null> {
  try {
    const fullUrl = withBaseUrl(url);
    const res = await fetch(fullUrl, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    if (options.on401 === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res, method, fullUrl);
    return res;
  } catch (error) {
    console.error(`API request error (${method} ${url}):`, { error, stack: error.stack });
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";

// ===== Query Function for React Query =====
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    try {
      // queryKey might be ["products"] or ["/products"]
      const url = queryKey.join("/") as string;
      const fullUrl = withBaseUrl(url);

      const res = await fetch(fullUrl, {
        credentials: "include",
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null as T;
      }

      await throwIfResNotOk(res, "GET", fullUrl);
      return (await res.json()) as T;
    } catch (error) {
      console.error(`Query error (${queryKey.join("/")}):`, { error, stack: error.stack });
      throw error;
    }
  };

// ===== React Query Client =====
// Note: Adjust staleTime and retry based on endpoint needs:
// - /api/products, /api/wilayas: staleTime ~5min
// - /api/admin/analytics: staleTime ~1min for fresher data
// - /api/admin/profile: retry false to quickly detect session expiration
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000), // Exponential backoff
      onError: (error) => {
        console.error("Query error:", { error, stack: error.stack });
        // Note: Handle errors in components (e.g., show toast via useToast)
      },
    },
    mutations: {
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
      onError: (error) => {
        console.error("Mutation error:", { error, stack: error.stack });
        // Note: Handle errors in components (e.g., show toast via useToast)
      },
    },
  },
});
