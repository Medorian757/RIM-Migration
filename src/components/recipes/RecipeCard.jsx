import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChefHat, Edit2, Trash2, Clock, DollarSign, Package, TrendingUp } from "lucide-react";

export default function RecipeCard({ recipe, items, onEdit, onDelete }) {
  
  // Calculate total ingredient cost
// Calculate total ingredient cost using Recipe UOM costing
const getRecipeUnitCost = (item) => {
  if (!item) return 0;

  const purchaseCost = Number(item.purchase_cost || 0);
  const unitsPerCase = Number(item.units_per_case || 0);
  const stockUnit = item.unit;
  const recipeUom = item.uom;

if (purchaseCost <= 0 || unitsPerCase <= 0) {
  return Number(item.unit_cost || 0);
}
  const normalizeUnit = (unit) => {
    const map = {
      gallons: "gal",
      gallon: "gal",
      liters: "l",
      liter: "l",
      cups: "cup",
      lbs: "lb",
      pounds: "lb",
      pound: "lb",
      pieces: "each",
    };

    return map[unit] || unit;
  };

  const from = normalizeUnit(stockUnit);
  const to = normalizeUnit(recipeUom);

  const conversions = {
    // Weight — base unit: oz
    oz: { group: "weight", factor: 1 },
    lb: { group: "weight", factor: 16 },
    g: { group: "weight", factor: 0.0352739619 },
    kg: { group: "weight", factor: 35.2739619 },

    // Volume — base unit: fl oz
    "fl oz": { group: "volume", factor: 1 },
    gal: { group: "volume", factor: 128 },
    cup: { group: "volume", factor: 8 },
    tbsp: { group: "volume", factor: 0.5 },
    tsp: { group: "volume", factor: 1 / 6 },
    ml: { group: "volume", factor: 0.0338140227 },
    l: { group: "volume", factor: 33.8140227 },

    // Count
    each: { group: "count", factor: 1 },
  };

if (!conversions[from] || !conversions[to]) {
  return Number(item.unit_cost || 0);
}

if (conversions[from].group !== conversions[to].group) {
  return Number(item.unit_cost || 0);
}
  const recipeQuantity =
    unitsPerCase *
    conversions[from].factor /
    conversions[to].factor;

  return recipeQuantity > 0
    ? purchaseCost / recipeQuantity
    : 0;
};

const ingredientCost = (recipe.ingredients || []).reduce((sum, ing) => {
  const item = items.find(i => i.id === ing.item_id);
  const unitCost = getRecipeUnitCost(item);

  return sum + unitCost * Number(ing.quantity || 0);
}, 0);  
  const laborCost = Number(recipe.labor_cost || 0);
  const overheadCost = Number(recipe.overhead_cost || 0);
  const totalCost = ingredientCost + laborCost + overheadCost;

  const itemsPerBatch = Number(recipe.yield_quantity || 0);
  const costPerUnit = itemsPerBatch > 0
    ? totalCost / itemsPerBatch
    : 0;

  const sellingPrice =
    recipe.selling_price !== undefined && recipe.selling_price !== null
      ? Number(recipe.selling_price)
      : 0;
  const profitPerUnit = sellingPrice - costPerUnit;
  const profitMargin = sellingPrice > 0 ? ((profitPerUnit / sellingPrice) * 100).toFixed(1) : 0;
  
  return (
    <Card className="group bg-white border-0 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center flex-shrink-0">
              <ChefHat className="h-6 w-6 text-purple-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-900 truncate">{recipe.name}</h3>
              {recipe.prep_time_minutes && (
                <div className="flex items-center gap-1 mt-1">
                  <Clock className="h-3 w-3 text-slate-400" />
                  <p className="text-xs text-slate-500">{recipe.prep_time_minutes} min</p>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" onClick={() => onEdit(recipe)} className="h-8 w-8">
              <Edit2 className="h-4 w-4 text-slate-500" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onDelete(recipe)} className="h-8 w-8 hover:bg-rose-50">
              <Trash2 className="h-4 w-4 text-slate-500 hover:text-rose-500" />
            </Button>
          </div>
        </div>
        
        {recipe.description && (
          <p className="text-sm text-slate-600 mb-4 line-clamp-2">{recipe.description}</p>
        )}
        
        {/* Ingredients */}
        <div className="mb-4">
          <p className="text-xs font-medium text-slate-500 mb-2">Ingredients</p>
          <div className="space-y-1">
            {(recipe.ingredients || []).slice(0, 3).map((ing, idx) => {
              const item = items.find(i => i.id === ing.item_id);
              return item ? (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 truncate">{item.name}</span>
                  <span className="text-slate-400 text-xs ml-2 flex-shrink-0">{ing.quantity} units</span>
                </div>
              ) : null;
            })}
            {(recipe.ingredients || []).length > 3 && (
              <p className="text-xs text-slate-400">+ {recipe.ingredients.length - 3} more...</p>
            )}
          </div>
        </div>
        
        {/* Cost Breakdown */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100/50 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Ingredients</span>
            <span className="font-medium text-slate-900">${ingredientCost.toFixed(2)}</span>
          </div>
          {laborCost > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Labor</span>
              <span className="font-medium text-slate-900">${laborCost.toFixed(2)}</span>
            </div>
          )}
          {overheadCost > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Overhead</span>
              <span className="font-medium text-slate-900">${overheadCost.toFixed(2)}</span>
            </div>
          )}
          <div className="pt-2 border-t border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">Total Batch Cost</span>
              <span className="font-semibold text-slate-900">${totalCost.toFixed(2)}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Items Produced per Batch</span>
              <span className="font-medium text-slate-900">{itemsPerBatch}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">Cost per Item</span>
              <span className="text-lg font-bold text-slate-900">${costPerUnit.toFixed(2)}</span>
            </div>
          </div>
        </div>
        
        {/* Profitability */}
        {sellingPrice > 0 && (
          <div className="mt-3 p-3 rounded-lg bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-900">
                  ${profitPerUnit.toFixed(2)} profit/item
                </span>
              </div>
              <Badge className={`${
                profitMargin >= 30 ? 'bg-emerald-100 text-emerald-700' : 
                profitMargin >= 15 ? 'bg-yellow-100 text-yellow-700' : 
                'bg-rose-100 text-rose-700'
              } border-0`}>
                {profitMargin}% margin
              </Badge>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
