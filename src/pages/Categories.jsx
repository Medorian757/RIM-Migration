import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit2, Trash2, FolderOpen, Package } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

import CategoryForm from "../components/inventory/CategoryForm";

export default function Categories() {
  const queryClient = useQueryClient();
  
  const [formOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deletingCategory, setDeletingCategory] = useState(null);
  
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: () => base44.entities.Category.list()
  });
  
  const { data: items = [], isLoading: itemsLoading } = useQuery({
    queryKey: ["items"],
    queryFn: () => base44.entities.InventoryItem.list()
  });
  
  const createCategory = useMutation({
    mutationFn: (data) => base44.entities.Category.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories"] })
  });
  
  const updateCategory = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Category.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories"] })
  });
  
  const deleteCategory = useMutation({
    mutationFn: (id) => base44.entities.Category.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories"] })
  });
  
  const handleSaveCategory = async (data) => {
    if (editingCategory) {
      await updateCategory.mutateAsync({ id: editingCategory.id, data });
    } else {
      await createCategory.mutateAsync(data);
    }
    setEditingCategory(null);
  };
  
  const handleDeleteCategory = async () => {
    if (deletingCategory) {
      await deleteCategory.mutateAsync(deletingCategory.id);
      setDeletingCategory(null);
    }
  };
  
  const getItemCountForCategory = (categoryId) => {
    return items.filter(item => item.category_id === categoryId).length;
  };
  
  const getTotalValueForCategory = (categoryId) => {
    return items
      .filter(item => item.category_id === categoryId)
      .reduce((sum, item) => sum + ((item.quantity || 0) * (item.unit_cost || 0)), 0);
  };
  
  const isLoading = categoriesLoading || itemsLoading;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Categories</h1>
            <p className="text-slate-500 mt-1">Organize your inventory with categories</p>
          </div>
          <Button
            onClick={() => {
              setEditingCategory(null);
              setFormOpen(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
        </div>
        
        {/* Categories Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array(6).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-xl" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
              <FolderOpen className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No categories yet</h3>
            <p className="text-slate-500 mb-4">Create categories to organize your inventory</p>
            <Button
              onClick={() => {
                setEditingCategory(null);
                setFormOpen(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Category
            </Button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {categories.map((category, index) => {
                const itemCount = getItemCountForCategory(category.id);
                const totalValue = getTotalValueForCategory(category.id);
                
                return (
                  <motion.div
                    key={category.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="p-6 bg-white border-0 shadow-sm hover:shadow-lg transition-all duration-300 group">
                      <div className="flex items-start justify-between mb-4">
                        <div 
                          className="h-12 w-12 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: `${category.color}20` }}
                        >
                          <FolderOpen className="h-6 w-6" style={{ color: category.color }} />
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingCategory(category);
                              setFormOpen(true);
                            }}
                            className="h-8 w-8"
                          >
                            <Edit2 className="h-4 w-4 text-slate-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingCategory(category)}
                            className="h-8 w-8 hover:bg-rose-50"
                          >
                            <Trash2 className="h-4 w-4 text-slate-500 hover:text-rose-500" />
                          </Button>
                        </div>
                      </div>
                      
                      <h3 className="text-lg font-semibold text-slate-900 mb-1">{category.name}</h3>
                      {category.description && (
                        <p className="text-sm text-slate-500 mb-4 line-clamp-2">{category.description}</p>
                      )}
                      
                      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-slate-400" />
                          <span className="text-sm font-medium text-slate-600">{itemCount} items</span>
                        </div>
                        <Badge variant="secondary" className="bg-slate-100">
                          ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </Badge>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
      
      {/* Category Form */}
      <CategoryForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingCategory(null);
        }}
        category={editingCategory}
        onSave={handleSaveCategory}
      />
      
      {/* Delete Confirmation */}
      <Dialog open={!!deletingCategory} onOpenChange={() => setDeletingCategory(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
          </DialogHeader>
          <DialogDescription className="py-4">
            Are you sure you want to delete <strong>"{deletingCategory?.name}"</strong>? 
            Items in this category won't be deleted, but they will become uncategorized.
          </DialogDescription>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingCategory(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteCategory}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}