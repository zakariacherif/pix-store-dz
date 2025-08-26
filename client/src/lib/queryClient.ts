import { QueryClient, QueryFunction } from "@tanstack/react-query";

// ===== Backend Base URL (Render) =====
const API_BASE_URL = "https://pix-store-dz.onrender.com";

// ===== Error Handling =====
async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
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
  data?: unknown
): Promise<Response> {
  const res = await fetch(withBaseUrl(url), {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";

// ===== Query Function for React Query =====
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // queryKey might be ["products"] or ["/products"]
    const url = queryKey.join("/") as string;

    const res = await fetch(withBaseUrl(url), {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null as T;
    }

    await throwIfResNotOk(res);
    return (await res.json()) as T;
  };

// ===== React Query Client =====
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
