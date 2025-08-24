import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Edit, Trash2, Package, X, ImageIcon } from "lucide-react";
import { Product, InsertProduct } from "@shared/schema";

export default function ProductForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<InsertProduct>({
    name: "",
    description: "",
    price: "",
    imageUrl: "",
    images: [],
    sizes: [],
    colors: [],
    stock: 0,
    category: "",
  });
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newSize, setNewSize] = useState("");
  const [newColor, setNewColor] = useState("");

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const createProductMutation = useMutation({
    mutationFn: async (productData: InsertProduct) => {
      const response = await apiRequest("POST", "/api/admin/products", productData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Produit créé",
        description: "Le produit a été ajouté avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      handleCloseModal();
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de créer le produit",
        variant: "destructive",
      });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, productData }: { id: string; productData: Partial<InsertProduct> }) => {
      const response = await apiRequest("PUT", `/api/admin/products/${id}`, productData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Produit modifié",
        description: "Le produit a été mis à jour avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      handleCloseModal();
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de modifier le produit",
        variant: "destructive",
      });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/admin/products/${id}`, {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Produit supprimé",
        description: "Le produit a été supprimé avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le produit",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingProduct) {
      updateProductMutation.mutate({ id: editingProduct.id, productData: formData });
    } else {
      createProductMutation.mutate(formData);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || "",
      price: product.price,
      imageUrl: product.imageUrl,
      images: product.images || [],
      sizes: product.sizes || [],
      colors: product.colors || [],
      stock: product.stock || 0,
      category: product.category || "",
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce produit ?")) {
      deleteProductMutation.mutate(id);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setFormData({
      name: "",
      description: "",
      price: "",
      imageUrl: "",
      images: [],
      sizes: [],
      colors: [],
      stock: 0,
      category: "",
    });
    setNewImageUrl("");
    setNewSize("");
    setNewColor("");
  };

  const formatPrice = (price: string) => {
    const numPrice = parseFloat(price);
    return `${numPrice.toLocaleString()} DA`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center" data-testid="text-products-management">
              <Package className="h-5 w-5 mr-2" />
              Gestion des Produits
            </CardTitle>
            <Button
              onClick={() => setIsModalOpen(true)}
              className="bg-primary hover:bg-primary-dark"
              data-testid="button-add-product"
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un produit
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-gray-600">Chargement des produits...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table data-testid="table-products">
                <TableHeader>
                  <TableRow>
                    <TableHead>Produit</TableHead>
                    <TableHead>Prix</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id} data-testid={`row-product-${product.id}`}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-10 h-10 rounded object-cover"
                            data-testid={`img-product-${product.id}`}
                          />
                          <div>
                            <div className="font-medium" data-testid={`text-product-name-${product.id}`}>
                              {product.name}
                            </div>
                            <div className="text-sm text-gray-500">{product.description}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell data-testid={`text-product-price-${product.id}`}>
                        {formatPrice(product.price)}
                      </TableCell>
                      <TableCell data-testid={`text-product-stock-${product.id}`}>
                        {product.stock || 0}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={product.isActive ? "default" : "secondary"}
                          className={product.isActive ? "bg-green-100 text-green-800" : ""}
                          data-testid={`badge-product-status-${product.id}`}
                        >
                          {product.isActive ? "Actif" : "Inactif"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(product)}
                            data-testid={`button-edit-${product.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(product.id)}
                            className="text-red-600 hover:text-red-800"
                            data-testid={`button-delete-${product.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Product Form Modal */}
      <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="modal-product-form">
          <DialogHeader>
            <DialogTitle data-testid="text-modal-title">
              {editingProduct ? "Modifier le produit" : "Ajouter un produit"}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4" data-testid="form-product">
            <div>
              <Label htmlFor="name">Nom du produit *</Label>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="mt-1"
                data-testid="input-product-name"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="mt-1"
                rows={3}
                data-testid="textarea-product-description"
              />
            </div>

            <div>
              <Label htmlFor="price">Prix (DA) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                required
                value={formData.price || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                className="mt-1"
                data-testid="input-product-price"
              />
            </div>

            <div>
              <Label htmlFor="imageUrl">URL de l'image *</Label>
              <Input
                id="imageUrl"
                type="url"
                required
                value={formData.imageUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                className="mt-1"
                placeholder="https://images.unsplash.com/..."
                data-testid="input-product-image"
              />
            </div>

            <div>
              <Label htmlFor="category">Catégorie</Label>
              <Select
                value={formData.category || ""}
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger className="mt-1" data-testid="select-product-category">
                  <SelectValue placeholder="Sélectionner une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="home">Home</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Additional Images */}
            <div>
              <Label>Images supplémentaires</Label>
              <div className="mt-2 space-y-2">
                <div className="flex space-x-2">
                  <Input
                    placeholder="URL de l'image"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    data-testid="input-new-image"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (newImageUrl.trim()) {
                        setFormData(prev => ({
                          ...prev,
                          images: [...(prev.images || []), newImageUrl.trim()]
                        }));
                        setNewImageUrl("");
                      }
                    }}
                    data-testid="button-add-image"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {formData.images && formData.images.length > 0 && (
                  <div className="grid grid-cols-2 gap-2" data-testid="list-images">
                    {formData.images.map((image, index) => (
                      <div key={index} className="relative group border rounded-lg p-2">
                        <img
                          src={image}
                          alt={`Image ${index + 1}`}
                          className="w-full h-20 object-cover rounded"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              images: prev.images?.filter((_, i) => i !== index) || []
                            }));
                          }}
                          data-testid={`button-remove-image-${index}`}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sizes */}
            <div>
              <Label>Tailles disponibles</Label>
              <div className="mt-2 space-y-2">
                <div className="flex space-x-2">
                  <Select value={newSize} onValueChange={setNewSize}>
                    <SelectTrigger data-testid="select-new-size">
                      <SelectValue placeholder="Sélectionner une taille" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="XS">XS</SelectItem>
                      <SelectItem value="S">S</SelectItem>
                      <SelectItem value="M">M</SelectItem>
                      <SelectItem value="L">L</SelectItem>
                      <SelectItem value="XL">XL</SelectItem>
                      <SelectItem value="XXL">XXL</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (newSize && !formData.sizes?.includes(newSize)) {
                        setFormData(prev => ({
                          ...prev,
                          sizes: [...(prev.sizes || []), newSize]
                        }));
                        setNewSize("");
                      }
                    }}
                    data-testid="button-add-size"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {formData.sizes && formData.sizes.length > 0 && (
                  <div className="flex flex-wrap gap-2" data-testid="list-sizes">
                    {formData.sizes.map((size, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="flex items-center space-x-1"
                      >
                        <span>{size}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              sizes: prev.sizes?.filter((_, i) => i !== index) || []
                            }));
                          }}
                          className="ml-1 hover:text-red-500"
                          data-testid={`button-remove-size-${index}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Colors */}
            <div>
              <Label>Couleurs disponibles</Label>
              <div className="mt-2 space-y-2">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Nom de la couleur (ex: Rouge, Bleu)"
                    value={newColor}
                    onChange={(e) => setNewColor(e.target.value)}
                    data-testid="input-new-color"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (newColor.trim() && !formData.colors?.includes(newColor.trim())) {
                        setFormData(prev => ({
                          ...prev,
                          colors: [...(prev.colors || []), newColor.trim()]
                        }));
                        setNewColor("");
                      }
                    }}
                    data-testid="button-add-color"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {formData.colors && formData.colors.length > 0 && (
                  <div className="flex flex-wrap gap-2" data-testid="list-colors">
                    {formData.colors.map((color, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="flex items-center space-x-1"
                      >
                        <span>{color}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              colors: prev.colors?.filter((_, i) => i !== index) || []
                            }));
                          }}
                          className="ml-1 hover:text-red-500"
                          data-testid={`button-remove-color-${index}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="stock">Stock</Label>
              <Input
                id="stock"
                type="number"
                min="0"
                value={formData.stock || 0}
                onChange={(e) => setFormData(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
                className="mt-1"
                data-testid="input-product-stock"
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <Button
                type="submit"
                className="flex-1 bg-primary hover:bg-primary-dark"
                disabled={createProductMutation.isPending || updateProductMutation.isPending}
                data-testid="button-save-product"
              >
                <Plus className="h-4 w-4 mr-2" />
                {editingProduct ? "Modifier" : "Ajouter"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseModal}
                data-testid="button-cancel-product"
              >
                Annuler
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
