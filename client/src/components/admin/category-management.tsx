import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Tags, Trash2, Plus } from "lucide-react";
import { useState } from "react";

export default function CategoryManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newCategoryName, setNewCategoryName] = useState("");

  const { data: categories = [], isLoading } = useQuery<string[]>({
    queryKey: ["/api/admin/categories"],
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await apiRequest("POST", "/api/admin/categories", { name });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Catégorie créée",
        description: "La nouvelle catégorie a été créée avec succès",
      });
      setNewCategoryName("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message === "Category already exists" ? "Cette catégorie existe déjà" : "Impossible de créer la catégorie",
        variant: "destructive",
      });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (category: string) => {
      const response = await apiRequest("DELETE", `/api/admin/categories/${encodeURIComponent(category)}`, {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Catégorie supprimée",
        description: "La catégorie a été supprimée avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la catégorie",
        variant: "destructive",
      });
    },
  });

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCategoryName.trim()) {
      createCategoryMutation.mutate(newCategoryName.trim());
    }
  };

  const handleDeleteCategory = (category: string) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer la catégorie "${category}" ? Cette action retirera la catégorie de tous les produits concernés.`)) {
      deleteCategoryMutation.mutate(category);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center" data-testid="text-categories-management">
          <Tags className="h-5 w-5 mr-2" />
          Gestion des Catégories
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-gray-600">Chargement des catégories...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Add new category form */}
            <div className="bg-gray-50 p-4 rounded-lg border">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Ajouter une nouvelle catégorie</h3>
              <form onSubmit={handleCreateCategory} className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Nom de la catégorie..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  disabled={createCategoryMutation.isPending}
                  className="flex-1"
                  data-testid="input-new-category"
                />
                <Button
                  type="submit"
                  disabled={!newCategoryName.trim() || createCategoryMutation.isPending}
                  className="flex items-center"
                  data-testid="button-add-category"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Ajouter
                </Button>
              </form>
            </div>

            {/* Existing categories */}
            <div className="space-y-4">
              {categories.length > 0 ? (
                <>
                  <p className="text-sm text-gray-600 mb-4">
                    Voici les catégories actuellement utilisées dans vos produits. Vous pouvez les supprimer si nécessaire.
                  </p>
                  <div className="grid gap-3" data-testid="list-categories">
                    {categories.map((category) => (
                      <div
                        key={category}
                        className="flex items-center justify-between p-3 border rounded-lg bg-gray-50"
                        data-testid={`item-category-${category}`}
                      >
                        <div className="flex items-center space-x-3">
                          <Badge className="bg-primary text-white" data-testid={`badge-category-${category}`}>
                            {category}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCategory(category)}
                          className="text-red-600 hover:text-red-800"
                          disabled={deleteCategoryMutation.isPending}
                          data-testid={`button-delete-category-${category}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <Tags className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600" data-testid="text-no-categories">
                    Aucune catégorie trouvée
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Les catégories apparaîtront ici lorsque vous ajouterez des produits avec des catégories.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}