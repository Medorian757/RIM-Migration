import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Grid3X3, List, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SearchFilters({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  stockFilter,
  setStockFilter,
  viewMode,
  setViewMode,
  categories,
  sortBy,
  setSortBy
}) {
  const hasActiveFilters = selectedCategory || stockFilter !== "all" || searchQuery;
  
  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("");
    setStockFilter("all");
  };
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items by name, SKU, or location..."
            className="pl-10 bg-white border-slate-200"
          />
        </div>
        
        {/* Category Filter */}
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-48 bg-white">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>All Categories</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat.id} value={cat.id}>
                <div className="flex items-center gap-2">
                  <div 
                    className="h-3 w-3 rounded-full" 
                    style={{ backgroundColor: cat.color || "#94a3b8" }}
                  />
                  {cat.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {/* Stock Filter */}
        <Select value={stockFilter} onValueChange={setStockFilter}>
          <SelectTrigger className="w-full sm:w-40 bg-white">
            <SelectValue placeholder="Stock Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Items</SelectItem>
            <SelectItem value="in_stock">In Stock</SelectItem>
            <SelectItem value="low_stock">Low Stock</SelectItem>
            <SelectItem value="out_of_stock">Out of Stock</SelectItem>
          </SelectContent>
        </Select>
        
        {/* Sort */}
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full sm:w-44 bg-white">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name_asc">Name (A-Z)</SelectItem>
            <SelectItem value="name_desc">Name (Z-A)</SelectItem>
            <SelectItem value="quantity_desc">Cases (High-Low)</SelectItem>
            <SelectItem value="quantity_asc">Cases (Low-High)</SelectItem>
            <SelectItem value="value_desc">Value (High-Low)</SelectItem>
            <SelectItem value="value_asc">Value (Low-High)</SelectItem>
            <SelectItem value="recent">Recently Added</SelectItem>
          </SelectContent>
        </Select>
        
        {/* View Toggle */}
        <div className="flex bg-white rounded-lg border border-slate-200 p-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setViewMode("grid")}
            className={cn(
              "h-8 w-8 rounded-md",
              viewMode === "grid" && "bg-indigo-100 text-indigo-600"
            )}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setViewMode("list")}
            className={cn(
              "h-8 w-8 rounded-md",
              viewMode === "list" && "bg-indigo-100 text-indigo-600"
            )}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-slate-500">Active filters:</span>
          {searchQuery && (
            <Badge variant="secondary" className="gap-1">
              Search: {searchQuery}
              <X className="h-3 w-3 cursor-pointer" onClick={() => setSearchQuery("")} />
            </Badge>
          )}
          {selectedCategory && (
            <Badge variant="secondary" className="gap-1">
              {categories.find(c => c.id === selectedCategory)?.name}
              <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedCategory("")} />
            </Badge>
          )}
          {stockFilter !== "all" && (
            <Badge variant="secondary" className="gap-1">
              {stockFilter.replace("_", " ")}
              <X className="h-3 w-3 cursor-pointer" onClick={() => setStockFilter("all")} />
            </Badge>
          )}
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-slate-500 h-7">
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
}