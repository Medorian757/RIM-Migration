import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, ChefHat, TrendingUp, Package, DollarSign, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

import RecipeCard from "../components/recipes/RecipeCard";
import RecipeForm from "../components/recipes/RecipeForm";

export default function Recipes() {
  const queryClient = useQueryClient();
  
  const [formOpen, setFormOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [deletingRecipe, setDeletingRecipe] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: recipes = [], isLoading: recipesLoading } = useQuery({
    queryKey: ["recipes"],
    queryFn: () => base44.entities.Recipe.list("-created_date")
  });
  
  const { data: items = [], isLoading: itemsLoading } = useQuery({
    queryKey: ["items"],
    queryFn: () => base44.entities.InventoryItem.list()
  });
  
  const createRecipe = useMutation({
    mutationFn: (data) => base44.entities.Recipe.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["recipes"] })
  });
  
  const updateRecipe = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Recipe.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["recipes"] })
  });
  
  const deleteRecipe = useMutation({
    mutationFn: (id) => base44.entities.Recipe.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["recipes"] })
  });
  
  const handleSaveRecipe = async (data) => {
    if (editingRecipe) {
      await updateRecipe.mutateAsync({ id: editingRecipe.id, data });
    } else {
      await createRecipe.mutateAsync(data);
    }
    setEditingRecipe(null);
  };
  
  const handleDeleteRecipe = async () => {
    if (deletingRecipe) {
      await deleteRecipe.mutateAsync(deletingRecipe.id);
      setDeletingRecipe(null);
    }
  };
  
  const filteredRecipes = recipes.filter(recipe => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const outputItem = items.find(i => i.id === recipe.output_item_id);
    return (
      recipe.name?.toLowerCase().includes(query) ||
      recipe.description?.toLowerCase().includes(query) ||
      outputItem?.name?.toLowerCase().includes(query)
    );
  });
  
  // Calculate stats
  const totalRecipes = recipes.length;
  const avgProfitMargin = recipes.length > 0 
    ? recipes.reduce((sum, recipe) => {
        const ingredientCost = (recipe.ingredients || []).reduce((sum, ing) => {
          const item = items.find(i => i.id === ing.item_id);
          return sum + ((item?.unit_cost || 0) * (ing.quantity || 0));
        }, 0);
        const totalCost = ingredientCost + (recipe.labor_cost || 0) + (recipe.overhead_cost || 0);
        const costPerUnit = recipe.yield_quantity > 0 ? totalCost / recipe.yield_quantity : 0;
        const outputItem = items.find(i => i.id === recipe.output_item_id);
        const sellingPrice = recipe.selling_price !== undefined && recipe.selling_price !== null 
          ? recipe.selling_price 
          : (outputItem?.sale_price || 0);
        const profitPerUnit = sellingPrice - costPerUnit;
        const margin = sellingPrice > 0 ? ((profitPerUnit / sellingPrice) * 100) : 0;
        return sum + margin;
      }, 0) / recipes.length
    : 0;
  
  const highMarginRecipes = recipes.filter(recipe => {
    const ingredientCost = (recipe.ingredients || []).reduce((sum, ing) => {
      const item = items.find(i => i.id === ing.item_id);
      return sum + ((item?.unit_cost || 0) * (ing.quantity || 0));
    }, 0);
    const totalCost = ingredientCost + (recipe.labor_cost || 0) + (recipe.overhead_cost || 0);
    const costPerUnit = recipe.yield_quantity > 0 ? totalCost / recipe.yield_quantity : 0;
    const outputItem = items.find(i => i.id === recipe.output_item_id);
    const sellingPrice = recipe.selling_price !== undefined && recipe.selling_price !== null 
      ? recipe.selling_price 
      : (outputItem?.sale_price || 0);
    const profitPerUnit = sellingPrice - costPerUnit;
    const margin = sellingPrice > 0 ? ((profitPerUnit / sellingPrice) * 100) : 0;
    return margin >= 30;
  }).length;
  
  const isLoading = recipesLoading || itemsLoading;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Recipes & Costing</h1>
            <p className="text-slate-500 mt-1">Calculate production costs and profit margins</p>
          </div>
          <Button
            onClick={() => {
              setEditingRecipe(null);
              setFormOpen(true);
            }}
            className="bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-200"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Recipe
          </Button>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {isLoading ? (
            Array(3).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))
          ) : (
            <>
              <Card className="p-6 bg-white border-0 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Total Recipes</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{totalRecipes}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-purple-50">
                    <ChefHat className="h-5 w-5 text-purple-600" />
                  </div>
                </div>
              </Card>
              
              <Card className="p-6 bg-white border-0 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Avg Profit Margin</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{avgProfitMargin.toFixed(1)}%</p>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-50">
                    <TrendingUp className="h-5 w-5 text-emerald-600" />
                  </div>
                </div>
              </Card>
              
              <Card className="p-6 bg-white border-0 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">High Margin (30%+)</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{highMarginRecipes}</p>
                    <p className="text-xs text-slate-500 mt-1">of {totalRecipes} recipes</p>
                  </div>
                  <div className="p-3 rounded-xl bg-indigo-50">
                    <DollarSign className="h-5 w-5 text-indigo-600" />
                  </div>
                </div>
              </Card>
            </>
          )}
        </div>
        
        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search recipes..."
              className="pl-10 bg-white border-slate-200"
            />
          </div>
        </div>
        
        {/* Recipes Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array(6).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-96 rounded-xl" />
            ))}
          </div>
        ) : filteredRecipes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 mb-4">
              <ChefHat className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              {searchQuery ? "No recipes found" : "No recipes yet"}
            </h3>
            <p className="text-slate-500 mb-4">
              {searchQuery 
                ? "Try adjusting your search" 
                : "Create your first recipe to calculate production costs"}
            </p>
            {!searchQuery && (
              <Button
                onClick={() => {
                  setEditingRecipe(null);
                  setFormOpen(true);
                }}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Recipe
              </Button>
            )}
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredRecipes.map((recipe, index) => (
                <motion.div
                  key={recipe.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <RecipeCard
                    recipe={recipe}
                    items={items}
                    onEdit={(recipe) => {
                      setEditingRecipe(recipe);
                      setFormOpen(true);
                    }}
                    onDelete={setDeletingRecipe}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
        
        {!isLoading && filteredRecipes.length > 0 && (
          <div className="mt-6 text-center text-sm text-slate-500">
            Showing {filteredRecipes.length} of {recipes.length} recipes
          </div>
        )}
      </div>
      
      {/* Recipe Form */}
      <RecipeForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingRecipe(null);
        }}
        recipe={editingRecipe}
        items={items}
        onSave={handleSaveRecipe}
      />
      
      {/* Delete Confirmation */}
      <Dialog open={!!deletingRecipe} onOpenChange={() => setDeletingRecipe(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-rose-100">
                <AlertTriangle className="h-5 w-5 text-rose-600" />
              </div>
              <DialogTitle>Delete Recipe</DialogTitle>
            </div>
          </DialogHeader>
          <DialogDescription className="py-4">
            Are you sure you want to delete <strong>"{deletingRecipe?.name}"</strong>? This action cannot be undone.
          </DialogDescription>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingRecipe(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteRecipe}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}