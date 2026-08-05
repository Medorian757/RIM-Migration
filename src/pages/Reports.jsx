import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import { Package, DollarSign, TrendingUp, AlertTriangle, ArrowUp, ArrowDown, TrendingDown } from "lucide-react";

const COLORS = ['#4F46E5', '#7C3AED', '#EC4899', '#F97316', '#22C55E', '#14B8A6', '#06B6D4', '#3B82F6'];

export default function Reports() {
  const { data: items = [], isLoading: itemsLoading } = useQuery({
    queryKey: ["items"],
    queryFn: () => base44.entities.InventoryItem.list()
  });
  
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: () => base44.entities.Category.list()
  });

  const { data: changeHistory = [], isLoading: historyLoading } = useQuery({
    queryKey: ["changeHistory"],
    queryFn: () => base44.entities.ChangeHistory.list("-created_date", 500)
  });
  
  const isLoading = itemsLoading || categoriesLoading || historyLoading;
  
  const stats = useMemo(() => {
    const totalItems = items.length;
    const totalQuantity = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const totalCost = items.reduce((sum, item) => sum + ((item.quantity || 0) * (item.unit_cost || 0)), 0);
    const totalRevenue = items.reduce((sum, item) => sum + ((item.quantity || 0) * (item.sale_price || 0)), 0);
    const totalProfit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0;
    const lowStockItems = items.filter(item => item.quantity <= item.min_quantity && item.min_quantity > 0);
    const outOfStockItems = items.filter(item => item.quantity === 0);
    
    return { totalItems, totalQuantity, totalCost, totalRevenue, totalProfit, profitMargin, lowStockItems, outOfStockItems };
  }, [items]);
  
  const categoryData = useMemo(() => {
    return categories.map(cat => {
      const categoryItems = items.filter(item => item.category_id === cat.id);
      const totalValue = categoryItems.reduce((sum, item) => sum + ((item.quantity || 0) * (item.unit_cost || 0)), 0);
      const itemCount = categoryItems.length;
      
      return {
        name: cat.name,
        value: totalValue,
        items: itemCount,
        color: cat.color || COLORS[0]
      };
    }).filter(cat => cat.value > 0).sort((a, b) => b.value - a.value);
  }, [items, categories]);
  
  const topItems = useMemo(() => {
    return [...items]
      .map(item => ({
        ...item,
        totalValue: (item.quantity || 0) * (item.unit_cost || 0)
      }))
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 10);
  }, [items]);
  
  // Price Creep: items whose unit_cost has increased over time
  const priceCreepData = useMemo(() => {
    const itemCostChanges = {};
    // Go through history oldest-first to build a timeline per item
    const sorted = [...changeHistory].sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
    sorted.forEach(record => {
      const costChange = (record.changes || []).find(c => c.field === "unit_cost");
      if (!costChange) return;
      const oldVal = parseFloat(costChange.old_value);
      const newVal = parseFloat(costChange.new_value);
      if (isNaN(oldVal) || isNaN(newVal)) return;
      if (!itemCostChanges[record.item_id]) {
        itemCostChanges[record.item_id] = {
          item_id: record.item_id,
          item_name: record.item_name,
          firstCost: oldVal,
          latestCost: newVal,
          changeCount: 1,
          lastChanged: record.created_date
        };
      } else {
        itemCostChanges[record.item_id].latestCost = newVal;
        itemCostChanges[record.item_id].changeCount += 1;
        itemCostChanges[record.item_id].lastChanged = record.created_date;
      }
    });

    return Object.values(itemCostChanges)
      .map(entry => ({
        ...entry,
        change: entry.latestCost - entry.firstCost,
        changePct: entry.firstCost > 0 ? ((entry.latestCost - entry.firstCost) / entry.firstCost) * 100 : 0
      }))
      .filter(entry => entry.change !== 0)
      .sort((a, b) => b.changePct - a.changePct);
  }, [changeHistory]);

  const locationData = useMemo(() => {
    const locations = {};
    items.forEach(item => {
      const loc = item.location || "Unassigned";
      if (!locations[loc]) {
        locations[loc] = { name: loc, items: 0, value: 0 };
      }
      locations[loc].items += 1;
      locations[loc].value += (item.quantity || 0) * (item.unit_cost || 0);
    });
    return Object.values(locations).sort((a, b) => b.value - a.value);
  }, [items]);
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <Skeleton className="h-12 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array(4).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-80 rounded-xl" />
            <Skeleton className="h-80 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Reports</h1>
          <p className="text-slate-500 mt-1">Inventory analytics and insights</p>
        </div>
        
        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="p-6 bg-white border-0 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Total Inventory Value</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  ${stats.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-indigo-50">
                <DollarSign className="h-5 w-5 text-indigo-600" />
              </div>
            </div>
          </Card>
          
          <Card className="p-6 bg-white border-0 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Potential Revenue</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  ${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </Card>
          
          <Card className="p-6 bg-white border-0 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Profit Margin</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {stats.profitMargin}%
                </p>
                <p className="text-sm text-emerald-600 font-medium mt-1">
                  ${stats.totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} profit
                </p>
              </div>
              <div className={`p-3 rounded-xl ${stats.totalProfit >= 0 ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                {stats.totalProfit >= 0 ? (
                  <ArrowUp className="h-5 w-5 text-emerald-600" />
                ) : (
                  <ArrowDown className="h-5 w-5 text-rose-600" />
                )}
              </div>
            </div>
          </Card>
          
          <Card className="p-6 bg-white border-0 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Stock Alerts</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {stats.lowStockItems.length + stats.outOfStockItems.length}
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  {stats.lowStockItems.length} low, {stats.outOfStockItems.length} out
                </p>
              </div>
              <div className="p-3 rounded-xl bg-amber-50">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </Card>
        </div>
        
        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Category Distribution */}
          <Card className="bg-white border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Value by Category</CardTitle>
            </CardHeader>
            <CardContent>
              {categoryData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => `$${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-slate-500">
                  No category data available
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Location Distribution */}
          <Card className="bg-white border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Value by Location</CardTitle>
            </CardHeader>
            <CardContent>
              {locationData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={locationData.slice(0, 6)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                      <XAxis type="number" tickFormatter={(value) => `$${value.toLocaleString()}`} />
                      <YAxis type="category" dataKey="name" width={100} />
                      <Tooltip 
                        formatter={(value) => `$${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                      />
                      <Bar dataKey="value" fill="#4F46E5" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-slate-500">
                  No location data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Price Creep */}
        <Card className="bg-white border-0 shadow-sm mb-8">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-rose-500" />
              Price Creep — Cost Changes Over Time
            </CardTitle>
            <p className="text-sm text-slate-500">Items whose unit cost has changed based on edit history</p>
          </CardHeader>
          <CardContent>
            {priceCreepData.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <TrendingDown className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                <p>No cost changes recorded yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {priceCreepData.map(entry => {
                  const isIncrease = entry.change > 0;
                  return (
                    <div key={entry.item_id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`p-2 rounded-lg ${isIncrease ? 'bg-rose-100' : 'bg-emerald-100'}`}>
                          {isIncrease
                            ? <ArrowUp className="h-4 w-4 text-rose-600" />
                            : <ArrowDown className="h-4 w-4 text-emerald-600" />
                          }
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 truncate">{entry.item_name}</p>
                          <p className="text-xs text-slate-500">
                            ${entry.firstCost.toFixed(2)} → ${entry.latestCost.toFixed(2)} · {entry.changeCount} change{entry.changeCount > 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="text-right ml-4 flex-shrink-0">
                        <Badge className={isIncrease
                          ? "bg-rose-100 text-rose-700 border-0"
                          : "bg-emerald-100 text-emerald-700 border-0"
                        }>
                          {isIncrease ? "+" : ""}{entry.changePct.toFixed(1)}%
                        </Badge>
                        <p className={`text-sm font-semibold mt-1 ${isIncrease ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {isIncrease ? "+" : ""}${entry.change.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Items & Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Items by Value */}
          <Card className="bg-white border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Top Items by Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topItems.length > 0 ? topItems.map((item, index) => (
                  <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-600">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{item.name}</p>
                        <p className="text-xs text-slate-500">{item.quantity} units × ${(item.unit_cost || 0).toFixed(2)}</p>
                      </div>
                    </div>
                    <p className="font-semibold text-slate-900">
                      ${item.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                )) : (
                  <div className="text-center py-8 text-slate-500">No items to display</div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Low Stock Alerts */}
          <Card className="bg-white border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Stock Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {stats.outOfStockItems.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-rose-600">Out of Stock</p>
                    {stats.outOfStockItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-rose-50">
                        <div>
                          <p className="font-medium text-slate-900">{item.name}</p>
                          {item.sku && <p className="text-xs text-slate-500">SKU: {item.sku}</p>}
                        </div>
                        <Badge variant="destructive">Out of Stock</Badge>
                      </div>
                    ))}
                  </div>
                )}
                
                {stats.lowStockItems.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-amber-600">Low Stock</p>
                    {stats.lowStockItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-amber-50">
                        <div>
                          <p className="font-medium text-slate-900">{item.name}</p>
                          <p className="text-xs text-slate-500">
                            {item.quantity} left (min: {item.min_quantity})
                          </p>
                        </div>
                        <Badge className="bg-amber-100 text-amber-800 border-0">Low Stock</Badge>
                      </div>
                    ))}
                  </div>
                )}
                
                {stats.lowStockItems.length === 0 && stats.outOfStockItems.length === 0 && (
                  <div className="text-center py-8 text-slate-500">
                    <Package className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                    <p>All items are well stocked!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}