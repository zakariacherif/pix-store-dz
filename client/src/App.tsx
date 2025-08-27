import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/components/ui/use-toast"; // Fixed import for useToast
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import Home from "@/pages/home";
import Product from "@/pages/product";
import Admin from "@/pages/admin";
import NotFound from "@/pages/not-found";

// Note: Ensure queryClient is configured with default options for retries and error handling:
// import { QueryClient } from "@tanstack/react-query";
// export const queryClient = new QueryClient({
//   defaultOptions: {
//     queries: {
//       retry: 2,
//       staleTime: 1000 * 60 * 5, // 5 minutes
//       onError: (error) => console.error("Query error:", error),
//     },
//   },
// });

// Note: Use environment variables for backend URL (e.g., process.env.NEXT_PUBLIC_API_URL)
// Ensure API calls include credentials: fetch(url, { credentials: "include" })

// Error Boundary Component
const ErrorBoundary = ({ children }: { children: React.ReactNode }) => {
  const { toast } = useToast();

  useEffect(() => {
    const handleQueryError = (error: unknown) => {
      console.error("Query error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    };

    queryClient.getQueryCache().subscribe((event) => {
      if (event.type === "queryFailed") {
        handleQueryError(event.query.meta?.error);
      }
    });

    return () => {
      queryClient.getQueryCache().unsubscribe();
    };
  }, [toast]);

  return <>{children}</>;
};

// Product Route Wrapper to Handle Invalid IDs
const ProductRoute = ({ params }: { params: { id: string } }) => {
  if (!params.id) {
    return <NotFound />;
  }
  return <Product id={params.id} />;
};

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/product/:id">{(params) => <ProductRoute params={params} />}</Route>
      <Route path="/admin" component={Admin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

export default App;
