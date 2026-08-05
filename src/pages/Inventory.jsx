import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, DollarSign, AlertTriangle, TrendingUp, Plus, FolderPlus, ArrowLeftRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import StatsCard from "../components/inventory/StatsCard";
import ConversionCalculator from "../components/inventory/ConversionCalculator";
import ItemCard from "../components/inventory/ItemCard";
import ItemForm from "../components/inventory/ItemForm";
import CategoryForm from "../components/inventory/CategoryForm";
import SearchFilters from "../components/inventory/SearchFilters";
import DeleteConfirmDialog from "../components/inventory/DeleteConfirmDialog";

export default function Inventory() {
  const queryClient = useQueryClient();
  
  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [viewMode, setViewMode] = useState("list");
  const [sortBy, setSortBy] = useState("recent");
  
  const [itemFormOpen, setItemFormOpen] = useState(false);
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  
  // Queries
  const { data: items = [], isLoading: itemsLoading } = useQuery({
    queryKey: ["items"],
    queryFn: () => base44.entities.InventoryItem.list("-created_date")
  });
  
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: () => base44.entities.Category.list()
  });
  
  // Mutations
  const createItem = useMutation({
    mutationFn: (data) => base44.entities.InventoryItem.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["items"] })
  });
  
  const updateItem = useMutation({
    mutationFn: ({ id, data }) => base44.entities.InventoryItem.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["items"] })
  });
  
  const deleteItem = useMutation({
    mutationFn: (id) => base44.entities.InventoryItem.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["items"] })
  });
  
  const createCategory = useMutation({
    mutationFn: (data) => base44.entities.Category.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories"] })
  });
  
  const updateCategory = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Category.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories"] })
  });
  
  // Computed values
  const stats = useMemo(() => {
    const totalItems = items.length;
    const totalCases = items.reduce((sum, item) => sum + (item.case_quantity || 0), 0);
    const totalValue = items.reduce((sum, item) => {
      const units = (item.case_quantity || 0) * (item.units_per_case || 1);
      return sum + (units * (item.unit_cost || 0));
    }, 0);
    const potentialRevenue = items.reduce((sum, item) => {
      const units = (item.case_quantity || 0) * (item.units_per_case || 1);
      return sum + (units * (item.sale_price || 0));
    }, 0);
    const lowStockItems = items.filter(item => {
      const minCases = item.min_cases || 0;
      return (item.case_quantity || 0) <= minCases && minCases > 0;
    }).length;
    
    return { totalItems, totalCases, totalValue, potentialRevenue, lowStockItems };
  }, [items]);
  
  // Filtered & Sorted Items
  const filteredItems = useMemo(() => {
    let result = [...items];
    
    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(item => 
        item.name?.toLowerCase().includes(query) ||
        item.sku?.toLowerCase().includes(query) ||
        item.location?.toLowerCase().includes(query)
      );
    }
    
    // Category
    if (selectedCategory) {
      result = result.filter(item => item.category_id === selectedCategory);
    }
    
    // Stock filter
    if (stockFilter === "in_stock") {
      result = result.filter(item => (item.case_quantity || 0) > 0);
    } else if (stockFilter === "low_stock") {
      result = result.filter(item => (item.case_quantity || 0) > 0 && (item.case_quantity || 0) <= (item.min_cases || 0) && (item.min_cases || 0) > 0);
    } else if (stockFilter === "out_of_stock") {
      result = result.filter(item => (item.case_quantity || 0) === 0);
    }
    
    // Sort
    switch (sortBy) {
      case "name_asc":
        result.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        break;
      case "name_desc":
        result.sort((a, b) => (b.name || "").localeCompare(a.name || ""));
        break;
      case "quantity_desc":
        result.sort((a, b) => (b.case_quantity || 0) - (a.case_quantity || 0));
        break;
      case "quantity_asc":
        result.sort((a, b) => (a.case_quantity || 0) - (b.case_quantity || 0));
        break;
      case "value_desc":
        result.sort((a, b) => {
          const aVal = (a.case_quantity || 0) * (a.units_per_case || 1) * (a.unit_cost || 0);
          const bVal = (b.case_quantity || 0) * (b.units_per_case || 1) * (b.unit_cost || 0);
          return bVal - aVal;
        });
        break;
      case "value_asc":
        result.sort((a, b) => {
          const aVal = (a.case_quantity || 0) * (a.units_per_case || 1) * (a.unit_cost || 0);
          const bVal = (b.case_quantity || 0) * (b.units_per_case || 1) * (b.unit_cost || 0);
          return aVal - bVal;
        });
        break;
      default:
        break;
    }
    
    return result;
  }, [items, searchQuery, selectedCategory, stockFilter, sortBy]);
  
  // Handlers
  const handleSaveItem = async (data) => {
    if (editingItem) {
      // Compute changes
      const TRACKED = ["name","description","sku","category_id","case_quantity","case_unit","units_per_case","unit","min_cases","unit_cost","sale_price","location","notes","tags"];
      const changes = TRACKED.reduce((acc, field) => {
        const oldVal = String(editingItem[field] ?? "");
        const newVal = String(data[field] ?? "");
        if (oldVal !== newVal) acc.push({ field, old_value: oldVal, new_value: newVal });
        return acc;
      }, []);
      await updateItem.mutateAsync({ id: editingItem.id, data });
      if (changes.length > 0) {
        const user = await base44.auth.me().catch(() => null);
        await base44.entities.ChangeHistory.create({
          item_id: editingItem.id,
          item_name: data.name,
          action: "updated",
          changes,
          changed_by: user?.email || ""
        });
      }
    } else {
      const created = await createItem.mutateAsync(data);
      const user = await base44.auth.me().catch(() => null);
      await base44.entities.ChangeHistory.create({
        item_id: created.id,
        item_name: data.name,
        action: "created",
        changes: [],
        changed_by: user?.email || ""
      });
    }
    setEditingItem(null);
  };
  
  const handleSaveCategory = async (data) => {
    if (editingCategory) {
      await updateCategory.mutateAsync({ id: editingCategory.id, data });
    } else {
      await createCategory.mutateAsync(data);
    }
    setEditingCategory(null);
  };
  
  const handleDeleteItem = async () => {
    if (deletingItem) {
      await deleteItem.mutateAsync(deletingItem.id);
    }
  };
  
  const openEditItem = (item) => {
    setEditingItem(item);
    setItemFormOpen(true);
  };
  
  const getCategoryById = (id) => categories.find(c => c.id === id);
  
  const isLoading = itemsLoading || categoriesLoading;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Inventory</h1>
            <p className="text-slate-500 mt-1">Manage your items and track stock levels</p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setCalculatorOpen(true)}
              className="bg-white"
            >
              <ArrowLeftRight className="h-4 w-4 mr-2" />
              Converter
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setEditingCategory(null);
                setCategoryFormOpen(true);
              }}
              className="bg-white"
            >
              <FolderPlus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
            <Button
              onClick={() => {
                setEditingItem(null);
                setItemFormOpen(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {isLoading ? (
            Array(4).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))
          ) : (
            <>
              <StatsCard
                title="Total Items"
                value={stats.totalItems}
                subtitle={`${stats.totalCases} cases/bags in stock`}
                icon={Package}
              />
              <StatsCard
                title="Inventory Value"
                value={`$${stats.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                subtitle="Total cost of goods"
                icon={DollarSign}
              />
              <StatsCard
                title="Potential Revenue"
                value={`$${stats.potentialRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                subtitle={`$${(stats.potentialRevenue - stats.totalValue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} profit margin`}
                icon={TrendingUp}
              />
              <StatsCard
                title="Low Stock Alerts"
                value={stats.lowStockItems}
                subtitle="Items need restocking"
                icon={AlertTriangle}
                className={stats.lowStockItems > 0 ? "border-l-4 border-rose-500" : ""}
              />
            </>
          )}
        </div>
        
        {/* Search & Filters */}
        <div className="mb-6">
          <SearchFilters
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            stockFilter={stockFilter}
            setStockFilter={setStockFilter}
            viewMode={viewMode}
            setViewMode={setViewMode}
            categories={categories}
            sortBy={sortBy}
            setSortBy={setSortBy}
          />
        </div>
        
        {/* Items Grid/List */}
        {isLoading ? (
          <div className={viewMode === "grid" 
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            : "space-y-3"
          }>
            {Array(8).fill(0).map((_, i) => (
              <Skeleton key={i} className={viewMode === "grid" ? "h-80 rounded-xl" : "h-20 rounded-xl"} />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
              <Package className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No items found</h3>
            <p className="text-slate-500 mb-4">
              {searchQuery || selectedCategory || stockFilter !== "all"
                ? "Try adjusting your filters"
                : "Get started by adding your first inventory item"}
            </p>
            {!searchQuery && !selectedCategory && stockFilter === "all" && (
              <Button
                onClick={() => {
                  setEditingItem(null);
                  setItemFormOpen(true);
                }}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Item
              </Button>
            )}
          </motion.div>
        ) : (
          <div className={viewMode === "grid" 
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            : "space-y-3"
          }>
            <AnimatePresence mode="popLayout">
              {filteredItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <ItemCard
                    item={item}
                    category={getCategoryById(item.category_id)}
                    onEdit={openEditItem}
                    onDelete={setDeletingItem}
                    viewMode={viewMode}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
        
        {/* Results count */}
        {!isLoading && filteredItems.length > 0 && (
          <div className="mt-6 text-center text-sm text-slate-500">
            Showing {filteredItems.length} of {items.length} items
          </div>
        )}
      </div>
      
      {/* Modals */}
      <ItemForm
        open={itemFormOpen}
        onClose={() => {
          setItemFormOpen(false);
          setEditingItem(null);
        }}
        item={editingItem}
        categories={categories}
        onSave={handleSaveItem}
      />
      
      <CategoryForm
        open={categoryFormOpen}
        onClose={() => {
          setCategoryFormOpen(false);
          setEditingCategory(null);
        }}
        category={editingCategory}
        onSave={handleSaveCategory}
      />
      
      <ConversionCalculator
        open={calculatorOpen}
        onClose={() => setCalculatorOpen(false)}
      />

      <DeleteConfirmDialog
        open={!!deletingItem}
        onClose={() => setDeletingItem(null)}
        item={deletingItem}
        onConfirm={handleDeleteItem}
      />
    </div>
  );
}