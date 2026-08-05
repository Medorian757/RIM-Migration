import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, MapPin, AlertTriangle, Edit2, Trash2, History } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import ItemHistoryDialog from "./ItemHistoryDialog";

export default function ItemCard({ item, category, onEdit, onDelete, viewMode = "grid" }) {
  const [historyOpen, setHistoryOpen] = useState(false);
  const caseQty = item.case_quantity || 0;
  const minCases = item.min_cases || 0;
  const isLowStock = caseQty <= minCases && minCases > 0;
  const totalUnits = caseQty * (item.units_per_case || 1);
  const totalValue = totalUnits * (item.unit_cost || 0);
  
  if (viewMode === "list") {
    return (
      <Card className="p-4 bg-white border-0 shadow-sm hover:shadow-md transition-all duration-300">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
            {item.image_url ? (
              <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
            ) : (
              <Package className="h-6 w-6 text-slate-400" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-900 truncate">{item.name}</h3>
              {isLowStock && (
                <Badge variant="destructive" className="bg-rose-50 text-rose-600 border-0 text-xs">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Low Stock
                </Badge>
              )}
            </div>
            {item.sku && <p className="text-xs text-slate-400">SKU: {item.sku}</p>}
            {category && (
              <Badge 
                variant="secondary" 
                className="mt-1 text-xs"
                style={{ backgroundColor: `${category.color}20`, color: category.color }}
              >
                {category.name}
              </Badge>
            )}
          </div>
          
          <div className="text-center px-4">
            <p className="text-2xl font-bold text-slate-900">{caseQty}</p>
            <p className="text-xs text-slate-500">{item.case_unit || 'cases'}</p>
            {item.units_per_case > 1 && (
              <p className="text-xs text-slate-400 mt-0.5">{totalUnits} units total</p>
            )}
          </div>
          
          <div className="text-right px-4">
            <p className="text-lg font-semibold text-slate-900">${(item.unit_cost || 0).toFixed(2)}</p>
            <p className="text-xs text-slate-500">per unit</p>
          </div>
          
          <div className="text-right px-4">
            <p className="text-lg font-bold text-indigo-600">${totalValue.toFixed(2)}</p>
            <p className="text-xs text-slate-500">total value</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => onEdit(item)} className="h-8 w-8">
              <Edit2 className="h-4 w-4 text-slate-500" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setHistoryOpen(true)} className="h-8 w-8 hover:bg-indigo-50">
              <History className="h-4 w-4 text-slate-500 hover:text-indigo-500" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onDelete(item)} className="h-8 w-8 hover:bg-rose-50">
              <Trash2 className="h-4 w-4 text-slate-500 hover:text-rose-500" />
            </Button>
          </div>
        </div>
      <ItemHistoryDialog item={item} open={historyOpen} onClose={() => setHistoryOpen(false)} />
    <ItemHistoryDialog item={item} open={historyOpen} onClose={() => setHistoryOpen(false)} />
    </Card>
    );
    }
  
  return (
    <Card className="group bg-white border-0 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
      <div className="aspect-square bg-slate-50 relative overflow-hidden">
        {item.image_url ? (
          <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <Package className="h-16 w-16 text-slate-300" />
          </div>
        )}
        
        {isLowStock && (
          <div className="absolute top-3 left-3">
            <Badge variant="destructive" className="bg-rose-500 text-white border-0 text-xs shadow-lg">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Low Stock
            </Badge>
          </div>
        )}
        
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
          <Button variant="secondary" size="icon" onClick={() => onEdit(item)} className="h-8 w-8 bg-white/90 backdrop-blur-sm shadow-lg">
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button variant="secondary" size="icon" onClick={() => setHistoryOpen(true)} className="h-8 w-8 bg-white/90 backdrop-blur-sm shadow-lg hover:bg-indigo-50">
            <History className="h-4 w-4 text-indigo-500" />
          </Button>
          <Button variant="secondary" size="icon" onClick={() => onDelete(item)} className="h-8 w-8 bg-white/90 backdrop-blur-sm shadow-lg hover:bg-rose-50">
            <Trash2 className="h-4 w-4 text-rose-500" />
          </Button>
        </div>
      </div>
      
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-slate-900 truncate">{item.name}</h3>
          {item.sku && <p className="text-xs text-slate-400 mt-0.5">SKU: {item.sku}</p>}
        </div>
        
        {category && (
          <Badge 
            variant="secondary" 
            className="text-xs"
            style={{ backgroundColor: `${category.color}20`, color: category.color }}
          >
            {category.name}
          </Badge>
        )}
        
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <div>
            <p className="text-2xl font-bold text-slate-900">{caseQty}</p>
            <p className="text-xs text-slate-500">{item.case_unit || 'cases'}</p>
            {item.units_per_case > 1 && (
              <p className="text-xs text-slate-400">{totalUnits} units</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-indigo-600">${totalValue.toFixed(2)}</p>
            <p className="text-xs text-slate-500">${(item.unit_cost || 0).toFixed(2)}/{item.unit || 'unit'}</p>
          </div>
        </div>
        
        {item.location && (
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <MapPin className="h-3 w-3" />
            {item.location}
          </div>
        )}
      </div>
    </Card>
  );
}