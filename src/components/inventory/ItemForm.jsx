import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Upload,
  X,
  Loader2,
  DollarSign,
  Package,
  MapPin,
  Hash,
  ArrowLeftRight,
  ChevronDown,
  ChevronUp,
  History,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import ItemChangeHistory from "./ItemChangeHistory";

export default function ItemForm({
  open,
  onClose,
  item,
  categories = [],
  onSave,
}) {
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
purchase_cost: 0,
uom_quantity: 1,
uom: "oz",
location: "",
    notes: "",
    image_url: "",
    tags: [],
  });

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [showConverter, setShowConverter] = useState(false);
  const [convCategory, setConvCategory] = useState("Weight");
  const [convFrom, setConvFrom] = useState("kg");
  const [convTo, setConvTo] = useState("lbs");
  const [convInput, setConvInput] = useState("");

  const CONV_GROUPS = {
    Weight: {
      kg: 1,
      g: 0.001,
      lbs: 0.453592,
      oz: 0.0283495,
    },
    Volume: {
      liters: 1,
      ml: 0.001,
      gallons: 3.78541,
      cups: 0.236588,
      "fl oz": 0.0295735,
    },
    Length: {
      meters: 1,
      feet: 0.3048,
      inches: 0.0254,
      cm: 0.01,
      mm: 0.001,
    },
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

    if (isNaN(val)) {
      return "";
    }

    const units = CONV_GROUPS[convCategory];
    const result = (val * units[convFrom]) / units[convTo];

    return result % 1 === 0
      ? result.toString()
      : result.toFixed(6).replace(/\.?0+$/, "");
  })();

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
purchase_cost: item.purchase_cost || 0,
uom_quantity: item.uom_quantity || 1,
uom: item.uom || "oz",
location: item.location || "",
        notes: item.notes || "",
        image_url: item.image_url || "",
        tags: item.tags || [],
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
        unit: "pieces",
        min_cases: 0,
        max_cases: 0,
unit_cost: 0,
sale_price: 0,
purchase_cost: 0,
uom_quantity: 1,
uom: "oz",
location: "",
        notes: "",
        image_url: "",
        tags: [],
      });
    }

    setSaving(false);
  }, [item, open]);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      setUploading(true);

      const { file_url } =
        await base44.integrations.Core.UploadFile({ file });

      setFormData((prev) => ({
        ...prev,
        image_url: file_url,
      }));
    } catch (error) {
      console.error("Error uploading image:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      return;
    }

    setSaving(true);

    try {
      const dataToSave = {
        ...formData,
        name: formData.name.trim(),

        // Supabase category_id is UUID.
        // Never send an empty string to a UUID column.
        category_id: formData.category_id || null,
      };

      await onSave(dataToSave);
      onClose();
    } catch (error) {
      console.error("Error saving item:", error);
    } finally {
      setSaving(false);
    }
  };

  const totalUnits =
    (formData.case_quantity || 0) *
    (formData.units_per_case || 1);
const recipeUnitMap = {
  kg: ["Weight", "kg"],
  g: ["Weight", "g"],
  lbs: ["Weight", "lbs"],
  oz: ["Weight", "oz"],
  liters: ["Volume", "liters"],
  ml: ["Volume", "ml"],
  gallons: ["Volume", "gallons"],
  cups: ["Volume", "cups"],
};

const recipeTargetMap = {
  kg: ["Weight", "kg"],
  g: ["Weight", "g"],
  lb: ["Weight", "lbs"],
  oz: ["Weight", "oz"],
  l: ["Volume", "liters"],
  ml: ["Volume", "ml"],
  gal: ["Volume", "gallons"],
  cup: ["Volume", "cups"],
  "fl oz": ["Volume", "fl oz"],
};

const recipeCostCalculation = (() => {
  const purchaseCost = Number(formData.purchase_cost || 0);
  const packageQuantity = Number(formData.units_per_case || 0);

  if (!purchaseCost || !packageQuantity) {
    return null;
  }

  const from = recipeUnitMap[formData.unit];
  const to = recipeTargetMap[formData.uom];

  if (!from || !to || from[0] !== to[0]) {
    return null;
  }

  const group = CONV_GROUPS[from[0]];

  const convertedQuantity =
    (packageQuantity * group[from[1]]) / group[to[1]];

  if (!convertedQuantity) {
    return null;
  }

  return {
    quantity: convertedQuantity,
    cost: purchaseCost / convertedQuantity,
  };
})();
  const totalValue =
    totalUnits * (formData.unit_cost || 0);

  const potentialRevenue =
    totalUnits * (formData.sale_price || 0);

  const potentialProfit =
    potentialRevenue - totalValue;

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
            <TabsTrigger value="details" className="flex-1">
              Details
            </TabsTrigger>

            {item && (
              <TabsTrigger value="history" className="flex-1">
                <History className="h-3.5 w-3.5 mr-1" />
                History
              </TabsTrigger>
            )}
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
                      <img
                        src={formData.image_url}
                        alt="Preview"
                        className="h-full w-full object-cover"
                      />
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
                      onClick={() =>
                        document
                          .getElementById("image-upload")
                          ?.click()
                      }
                      disabled={uploading}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {uploading
                        ? "Uploading..."
                        : "Upload Image"}
                    </Button>

                    {formData.image_url && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            image_url: "",
                          }))
                        }
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
                  <Label htmlFor="name">
                    Item Name *
                  </Label>

                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    placeholder="Enter item name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sku">
                    SKU / Barcode
                  </Label>

                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />

                    <Input
                      id="sku"
                      value={formData.sku}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          sku: e.target.value,
                        }))
                      }
                      placeholder="SKU-001"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">
                    Category
                  </Label>

                  <Select
                    value={
                      formData.category_id || "no-category"
                    }
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        category_id:
                          value === "no-category"
                            ? ""
                            : value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="no-category">
                        No Category
                      </SelectItem>

                      {categories.map((cat) => (
                        <SelectItem
                          key={cat.id}
                          value={cat.id}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="h-3 w-3 rounded-full"
                              style={{
                                backgroundColor:
                                  cat.color ||
                                  "#94a3b8",
                              }}
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
                <Label htmlFor="description">
                  Description
                </Label>

                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Enter item description"
                  rows={3}
                />
              </div>

              {/* Stock Count */}
              <div className="p-4 rounded-xl bg-slate-50 space-y-3">
                <h3 className="font-semibold text-slate-700 text-sm flex items-center gap-2">
                  <Package className="h-4 w-4 text-slate-500" />
                  Stock Count
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="case_quantity">
                      Count
                    </Label>

                    <Input
                      id="case_quantity"
                      type="number"
                      min="0"
                      step="1"
                      value={formData.case_quantity}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          case_quantity:
                            parseFloat(
                              e.target.value
                            ) || 0,
                        }))
                      }
                      placeholder="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="case_unit">
                      Type
                    </Label>

                    <Select
                      value={formData.case_unit}
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          case_unit: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>

                      <SelectContent>
                        <SelectItem value="cases">
                          Cases
                        </SelectItem>
                        <SelectItem value="bags">
                          Bags
                        </SelectItem>
                        <SelectItem value="boxes">
                          Boxes
                        </SelectItem>
                        <SelectItem value="cartons">
                          Cartons
                        </SelectItem>
                        <SelectItem value="pallets">
                          Pallets
                        </SelectItem>
                        <SelectItem value="crates">
                          Crates
                        </SelectItem>
                        <SelectItem value="packs">
                          Packs
                        </SelectItem>
                        <SelectItem value="bundles">
                          Bundles
                        </SelectItem>
                        <SelectItem value="drums">
                          Drums
                        </SelectItem>
                        <SelectItem value="totes">
                          Totes
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="units_per_case">
                      Units per{" "}
                      {formData.case_unit || "case"}
                    </Label>

                    <div className="flex gap-2">
                      <Input
                        id="units_per_case"
                        type="number"
                        min="1"
                        step="0.01"
                        value={formData.units_per_case}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            units_per_case:
                              parseFloat(
                                e.target.value
                              ) || 1,
                          }))
                        }
                        placeholder="1"
                        className="flex-1"
                      />

                      <Select
                        value={formData.unit}
                        onValueChange={(value) =>
                          setFormData((prev) => ({
                            ...prev,
                            unit: value,
                          }))
                        }
                      >
                        <SelectTrigger className="w-28">
                          <SelectValue placeholder="Unit" />
                        </SelectTrigger>

                        <SelectContent>
                          <SelectItem value="pieces">
                            Pieces
                          </SelectItem>
                          <SelectItem value="each">
                            Each
                          </SelectItem>
                          <SelectItem value="kg">
                            kg
                          </SelectItem>
                          <SelectItem value="g">
                            g
                          </SelectItem>
                          <SelectItem value="lbs">
                            lbs
                          </SelectItem>

                          <SelectItem value="oz">
                            oz
                          </SelectItem>
                          <SelectItem value="liters">
                            Liters
                          </SelectItem>
                          <SelectItem value="ml">
                            ml
                          </SelectItem>
                          <SelectItem value="gallons">
                            Gallons
                          </SelectItem>
                          <SelectItem value="cups">
                            Cups
                          </SelectItem>
                          <SelectItem value="meters">
                            Meters
                          </SelectItem>
                          <SelectItem value="feet">
                            Feet
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
<div className="mt-3 rounded-lg bg-slate-100 px-4 py-3 text-sm">
  <span className="font-medium text-slate-700">Stock Breakdown: </span>
  <span className="text-slate-900">
    {formData.case_quantity || 0} {formData.case_unit || "cases"} ={" "}
    {totalUnits} {formData.unit || "units"}
  </span>
</div>
                  </div>
                </div>
              </div>

              {/* Min / Max / Location */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min_cases">
                    Min.{" "}
                    {formData.case_unit || "Cases"}{" "}
                    (Alert)
                  </Label>

                  <Input
                    id="min_cases"
                    type="number"
                    min="0"
                    step="1"
                    value={formData.min_cases}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        min_cases:
                          parseFloat(
                            e.target.value
                          ) || 0,
                      }))
                    }
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_cases">
                    Max.{" "}
                    {formData.case_unit || "Cases"}{" "}
                    (Capacity)
                  </Label>

                  <Input
                    id="max_cases"
                    type="number"
                    min="0"
                    step="1"
                    value={formData.max_cases}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        max_cases:
                          parseFloat(
                            e.target.value
                          ) || 0,
                      }))
                    }
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">
                    Location
                  </Label>

                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />

                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          location: e.target.value,
                        }))
                      }
                      placeholder="Warehouse A"
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

{/* UOM Recipe Costing */}
<div className="p-4 rounded-xl border border-slate-200 space-y-4">
  <div>
    <h3 className="font-semibold text-slate-900">
      Recipe Costing
    </h3>
    <p className="text-sm text-slate-500">
      Break purchase cost down to a recipe unit of measure.
    </p>
  </div>

  <div className="grid grid-cols-3 gap-4">
    <div className="space-y-2">
      <Label htmlFor="purchase_cost">
        Purchase Cost
      </Label>
      <Input
        id="purchase_cost"
        type="number"
        min="0"
        step="0.01"
        value={formData.purchase_cost}
        onChange={(e) =>
          setFormData((prev) => ({
            ...prev,
            purchase_cost: parseFloat(e.target.value) || 0,
          }))
        }
        placeholder="0.00"
      />
    </div>


    <div className="space-y-2">
      <Label htmlFor="uom">
        Recipe UOM
      </Label>
      <select
        id="uom"
        value={formData.uom}
        onChange={(e) =>
          setFormData((prev) => ({
            ...prev,
            uom: e.target.value,
          }))
        }
        className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
      >
        <option value="oz">oz</option>
        <option value="lb">lb</option>
        <option value="g">g</option>
        <option value="kg">kg</option>
        <option value="ml">ml</option>
        <option value="l">L</option>
<option value="gal">gal</option>
<option value="fl oz">fl oz</option>
        <option value="tsp">tsp</option>
        <option value="tbsp">tbsp</option>
        <option value="cup">cup</option>
        <option value="each">each</option>
      </select>
    </div>
  </div>
<div className="rounded-lg bg-slate-50 p-3">
  <p className="text-sm text-slate-600">
    Cost per recipe UOM
  </p>

  {recipeCostCalculation ? (
    <>
      <p className="text-lg font-bold text-slate-900">
        ${recipeCostCalculation.cost.toFixed(4)}
        {" per "}
        {formData.uom || "unit"}
      </p>

      <p className="mt-1 text-xs text-slate-500">
        {formData.units_per_case || 0}{" "}
        {formData.unit || "units"} ={" "}
        {recipeCostCalculation.quantity.toFixed(2)}{" "}
        {formData.uom || "units"}
      </p>
    </>
  ) : (
    <p className="text-sm text-slate-500">
      Select compatible stock and recipe units to calculate cost.
    </p>
  )}
</div>
</div>
              {/* Conversion Calculator */}
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <button
                  type="button"
                  onClick={() =>
                    setShowConverter(
                      !showConverter
                    )
                  }
                  className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-sm font-medium text-slate-700"
                >
                  <span className="flex items-center gap-2">
                    <ArrowLeftRight className="h-4 w-4 text-indigo-500" />
                    Unit Converter
                  </span>

                  {showConverter ? (
                    <ChevronUp className="h-4 w-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  )}
                </button>

                {showConverter && (
                  <div className="p-4 space-y-4 bg-white">
                    <div className="flex gap-2">
                      {Object.keys(
                        CONV_GROUPS
                      ).map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() =>
                            handleConvCategory(
                              cat
                            )
                          }
                          className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                            convCategory ===
                            cat
                              ? "bg-indigo-600 text-white"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>

                    <div className="flex gap-2 items-center">
                      <Input
                        type="number"
                        value={convInput}
                        onChange={(e) =>
                          setConvInput(
                            e.target.value
                          )
                        }
                        placeholder="Value"
                        className="flex-1"
                      />

                      <Select
                        value={convFrom}
                        onValueChange={
                          setConvFrom
                        }
                      >
                        <SelectTrigger className="w-28">
                          <SelectValue />
                        </SelectTrigger>

                        <SelectContent>
                          {Object.keys(
                            CONV_GROUPS[
                              convCategory
                            ]
                          ).map((unit) => (
                            <SelectItem
                              key={unit}
                              value={unit}
                            >
                              {unit}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <button
                        type="button"
                        onClick={() => {
                          const oldFrom =
                            convFrom;

                          setConvFrom(convTo);
                          setConvTo(oldFrom);
                        }}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-indigo-100 text-slate-500 hover:text-indigo-600 transition-colors"
                      >
                        <ArrowLeftRight className="h-4 w-4" />
                      </button>

                      <Select
                        value={convTo}
                        onValueChange={setConvTo}
                      >
                        <SelectTrigger className="w-28">
                          <SelectValue />
                        </SelectTrigger>

                        <SelectContent>
                          {Object.keys(
                            CONV_GROUPS[
                              convCategory
                            ]
                          ).map((unit) => (
                            <SelectItem
                              key={unit}
                              value={unit}
                            >
                              {unit}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {convResult !== "" && (
                      <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-100 text-center text-sm">
                        <span className="font-semibold text-slate-900">
                          {convInput}{" "}
                          {convFrom}
                        </span>

                        {" = "}

                        <span className="font-semibold text-indigo-700">
                          {convResult}{" "}
                          {convTo}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">
                  Notes
                </Label>

                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  placeholder="Add any additional notes..."
                  rows={2}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  disabled={
                    saving ||
                    !formData.name.trim()
                  }
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : item ? (
                    "Update Item"
                  ) : (
                    "Add Item"
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
