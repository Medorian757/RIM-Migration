import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, X, Loader2, DollarSign, Package, MapPin, Hash, ArrowLeftRight, ChevronDown, ChevronUp, History } from "lucide-react";
import { base44 } from "@/api/base44Client";
import ItemChangeHistory from "./ItemChangeHistory";

export default function ItemForm({ open, onClose, item, categories, onSave }) {
  const [activeTab, setActiveTab] = useState("details");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    sku: "",
    category_id: "",
    case_quantity: 0,
    case_unit: "cases",
    units_per_case: 1,
    unit: "pieces",
    min_cases: 0,
      max_cases: 0,
      unit_cost: 0,
    sale_price: 0,
    location: "",
    notes: "",
    image_url: "",
    tags: []
  });
  const [uploading, setUploading] = useState(false);
  const [showConverter, setShowConverter] = useState(false);
  const [convCategory, setConvCategory] = useState("Weight");
  const [convFrom, setConvFrom] = useState("kg");
  const [convTo, setConvTo] = useState("lbs");
  const [convInput, setConvInput] = useState("");

  const CONV_GROUPS = {
    Weight: { kg: 1, g: 0.001, lbs: 0.453592, oz: 0.0283495 },
    Volume: { liters: 1, ml: 0.001, gallons: 3.78541, cups: 0.236588, "fl oz": 0.0295735 },
    Length: { meters: 1, feet: 0.3048, inches: 0.0254, cm: 0.01, mm: 0.001 },
  };

  const handleConvCategory = (cat) => {
    setConvCategory(cat);
    const keys = Object.keys(CONV_GROUPS[cat]);
    setConvFrom(keys[0]);
    setConvTo(keys[1]);
    setConvInput("");
  };

  const convResult = (() => {
    const val = parseFloat(convInput);
    if (isNaN(val)) return "";
    const units = CONV_GROUPS[convCategory];
    const r = (val * units[convFrom]) / units[convTo];
    return r % 1 === 0 ? r.toString() : r.toFixed(6).replace(/\.?0+$/, "");
  })();
  const [saving, setSaving] = useState(false);
  
  useEffect(() => {
    setActiveTab("details");
    if (item) {
      setFormData({
        name: item.name || "",
        description: item.description || "",
        sku: item.sku || "",
        category_id: item.category_id || "",
        case_quantity: item.case_quantity || 0,
        case_unit: item.case_unit || "cases",
        units_per_case: item.units_per_case || 1,
        unit: item.unit || "pieces",
        min_cases: item.min_cases || 0,
        max_cases: item.max_cases || 0,
        unit_cost: item.unit_cost || 0,
        sale_price: item.sale_price || 0,
        location: item.location || "",
        notes: item.notes || "",
        image_url: item.image_url || "",
        tags: item.tags || []
      });
    } else {
      setFormData({
        name: "",
        description: "",
        sku: "",
        category_id: "",
        case_quantity: 0,
        case_unit: "cases",
        units_per_case: 1,
        min_cases: 0,
        unit_cost: 0,
        sale_price: 0,
        location: "",
        notes: "",
        image_url: "",
        tags: []
      });
    }
  }, [item, open]);
  
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setFormData(prev => ({ ...prev, image_url: file_url }));
    setUploading(false);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave(formData);
    setSaving(false);
    onClose();
  };
  
  const totalUnits = (formData.case_quantity || 0) * (formData.units_per_case || 1);
  const totalValue = totalUnits * (formData.unit_cost || 0);
  const potentialRevenue = totalUnits * (formData.sale_price || 0);
  const potentialProfit = potentialRevenue - totalValue;
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {item ? "Edit Item" : "Add New Item"}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full">
            <TabsTrigger value="details" className="flex-1">Details</TabsTrigger>
            {item && <TabsTrigger value="history" className="flex-1"><History className="h-3.5 w-3.5 mr-1" />History</TabsTrigger>}
          </TabsList>

          {item && (
            <TabsContent value="history" className="mt-4">
              <ItemChangeHistory itemId={item.id} />
            </TabsContent>
          )}

          <TabsContent value="details">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Item Image</Label>
            <div className="flex items-start gap-4">
              <div className="h-32 w-32 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden border-2 border-dashed border-slate-200">
                {formData.image_url ? (
                  <img src={formData.image_url} alt="Preview" className="h-full w-full object-cover" />
                ) : uploading ? (
                  <Loader2 className="h-6 w-6 text-slate-400 animate-spin" />
                ) : (
                  <Package className="h-8 w-8 text-slate-300" />
                )}
              </div>
              <div className="flex-1 space-y-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("image-upload").click()}
                  disabled={uploading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploading ? "Uploading..." : "Upload Image"}
                </Button>
                {formData.image_url && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setFormData(prev => ({ ...prev, image_url: "" }))}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                )}
              </div>
            </div>
          </div>
          
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="name">Item Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter item name"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="sku">SKU / Barcode</Label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                  placeholder="SKU-001"
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>No Category</SelectItem>
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
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter item description"
              rows={3}
            />
          </div>
          
          {/* Cases / Bags — Main Count */}
          <div className="p-4 rounded-xl bg-slate-50 space-y-3">
            <h3 className="font-semibold text-slate-700 text-sm flex items-center gap-2">
              <Package className="h-4 w-4 text-slate-500" />
              Stock Count
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="case_quantity">Count</Label>
                <Input
                  id="case_quantity"
                  type="number"
                  min="0"
                  step="1"
                  value={formData.case_quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, case_quantity: parseFloat(e.target.value) || 0 }))}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="case_unit">Type</Label>
                <Select
                  value={formData.case_unit}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, case_unit: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cases">Cases</SelectItem>
                    <SelectItem value="bags">Bags</SelectItem>
                    <SelectItem value="boxes">Boxes</SelectItem>
                    <SelectItem value="cartons">Cartons</SelectItem>
                    <SelectItem value="pallets">Pallets</SelectItem>
                    <SelectItem value="crates">Crates</SelectItem>
                    <SelectItem value="packs">Packs</SelectItem>
                    <SelectItem value="bundles">Bundles</SelectItem>
                    <SelectItem value="drums">Drums</SelectItem>
                    <SelectItem value="totes">Totes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="units_per_case">Units per {formData.case_unit || 'case'}</Label>
                <div className="flex gap-2">
                  <Input
                    id="units_per_case"
                    type="number"
                    min="1"
                    step="0.01"
                    value={formData.units_per_case}
                    onChange={(e) => setFormData(prev => ({ ...prev, units_per_case: parseFloat(e.target.value) || 1 }))}
                    placeholder="1"
                    className="flex-1"
                  />
                  <Select
                    value={formData.unit}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, unit: value }))}
                  >
                    <SelectTrigger className="w-28">
                      <SelectValue placeholder="Unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pieces">Pieces</SelectItem>
                      <SelectItem value="each">Each</SelectItem>
                      <SelectItem value="kg">kg</SelectItem>
                      <SelectItem value="g">g</SelectItem>
                      <SelectItem value="lbs">lbs</SelectItem>
                      <SelectItem value="oz">oz</SelectItem>
                      <SelectItem value="liters">Liters</SelectItem>
                      <SelectItem value="ml">ml</SelectItem>
                      <SelectItem value="gallons">Gallons</SelectItem>
                      <SelectItem value="cups">Cups</SelectItem>
                      <SelectItem value="meters">Meters</SelectItem>
                      <SelectItem value="feet">Feet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
          
          {/* Min Cases & Location */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="min_cases">Min. {formData.case_unit || 'Cases'} (Alert)</Label>
              <Input
                id="min_cases"
                type="number"
                min="0"
                step="1"
                value={formData.min_cases}
                onChange={(e) => setFormData(prev => ({ ...prev, min_cases: parseFloat(e.target.value) || 0 }))}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_cases">Max. {formData.case_unit || 'Cases'} (Capacity)</Label>
              <Input
                id="max_cases"
                type="number"
                min="0"
                step="1"
                value={formData.max_cases}
                onChange={(e) => setFormData(prev => ({ ...prev, max_cases: parseFloat(e.target.value) || 0 }))}
                placeholder="0"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Warehouse A"
                  className="pl-10"
                />
              </div>
            </div>
          </div>
          
          {/* Pricing */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 space-y-4">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-indigo-600" />
              Pricing
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unit_cost">Cost per {formData.unit || 'unit'}</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                  <Input
                    id="unit_cost"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.unit_cost}
                    onChange={(e) => setFormData(prev => ({ ...prev, unit_cost: parseFloat(e.target.value) || 0 }))}
                    className="pl-7"
                    placeholder="0.00"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sale_price">Price per {formData.unit || 'unit'}</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                  <Input
                    id="sale_price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.sale_price}
                    onChange={(e) => setFormData(prev => ({ ...prev, sale_price: parseFloat(e.target.value) || 0 }))}
                    className="pl-7"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 pt-3 border-t border-indigo-100">
              <div className="text-center">
                <p className="text-sm text-slate-600">Total Cost</p>
                <p className="text-lg font-bold text-slate-900">${totalValue.toFixed(2)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-slate-600">Potential Revenue</p>
                <p className="text-lg font-bold text-indigo-600">${potentialRevenue.toFixed(2)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-slate-600">Potential Profit</p>
                <p className={`text-lg font-bold ${potentialProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  ${potentialProfit.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
          
          {/* Conversion Calculator */}
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowConverter(!showConverter)}
              className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-sm font-medium text-slate-700"
            >
              <span className="flex items-center gap-2">
                <ArrowLeftRight className="h-4 w-4 text-indigo-500" />
                Unit Converter
              </span>
              {showConverter ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
            </button>
            {showConverter && (
              <div className="p-4 space-y-4 bg-white">
                {/* Category tabs */}
                <div className="flex gap-2">
                  {Object.keys(CONV_GROUPS).map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => handleConvCategory(cat)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                        convCategory === cat ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                {/* From */}
                <div className="flex gap-2 items-center">
                  <Input
                    type="number"
                    value={convInput}
                    onChange={(e) => setConvInput(e.target.value)}
                    placeholder="Value"
                    className="flex-1"
                  />
                  <Select value={convFrom} onValueChange={setConvFrom}>
                    <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.keys(CONV_GROUPS[convCategory]).map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <button type="button" onClick={() => { setConvFrom(convTo); setConvTo(convFrom); }} className="p-1.5 rounded-lg bg-slate-100 hover:bg-indigo-100 text-slate-500 hover:text-indigo-600 transition-colors">
                    <ArrowLeftRight className="h-4 w-4" />
                  </button>
                  <Select value={convTo} onValueChange={setConvTo}>
                    <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.keys(CONV_GROUPS[convCategory]).map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {/* Result */}
                {convResult !== "" && (
                  <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-100 text-center text-sm">
                    <span className="font-semibold text-slate-900">{convInput} {convFrom}</span>
                    {" = "}
                    <span className="font-semibold text-indigo-700">{convResult} {convTo}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Add any additional notes..."
              rows={2}
            />
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !formData.name} className="bg-indigo-600 hover:bg-indigo-700">
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                item ? "Update Item" : "Add Item"
              )}
            </Button>
          </DialogFooter>
        </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}