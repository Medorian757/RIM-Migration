import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeftRight } from "lucide-react";

const UNIT_GROUPS = {
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
  Area: {
    "m²": 1,
    "ft²": 0.092903,
    "in²": 0.00064516,
    "cm²": 0.0001,
  },
};

export default function ConversionCalculator({ open, onClose }) {
  const [category, setCategory] = useState("Weight");
  const [fromUnit, setFromUnit] = useState("kg");
  const [toUnit, setToUnit] = useState("lbs");
  const [inputValue, setInputValue] = useState("");

  const units = UNIT_GROUPS[category];

  const handleCategoryChange = (cat) => {
    setCategory(cat);
    const keys = Object.keys(UNIT_GROUPS[cat]);
    setFromUnit(keys[0]);
    setToUnit(keys[1]);
    setInputValue("");
  };

  const handleSwap = () => {
    setFromUnit(toUnit);
    setToUnit(fromUnit);
  };

  const convert = () => {
    const val = parseFloat(inputValue);
    if (isNaN(val)) return "";
    const inBase = val * (units[fromUnit] || 1);
    const result = inBase / (units[toUnit] || 1);
    return result % 1 === 0 ? result.toString() : result.toFixed(6).replace(/\.?0+$/, "");
  };

  const result = convert();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5 text-indigo-600" />
            Conversion Calculator
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Category */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700">Category</p>
            <div className="flex flex-wrap gap-2">
              {Object.keys(UNIT_GROUPS).map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleCategoryChange(cat)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    category === cat
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* From */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700">From</p>
            <div className="flex gap-2">
              <Input
                type="number"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Enter value"
                className="flex-1"
              />
              <Select value={fromUnit} onValueChange={setFromUnit}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(units).map((u) => (
                    <SelectItem key={u} value={u}>{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Swap button */}
          <div className="flex justify-center">
            <button
              onClick={handleSwap}
              className="p-2 rounded-full bg-slate-100 hover:bg-indigo-100 text-slate-500 hover:text-indigo-600 transition-colors"
              title="Swap units"
            >
              <ArrowLeftRight className="h-4 w-4" />
            </button>
          </div>

          {/* To */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700">To</p>
            <div className="flex gap-2">
              <div className="flex-1 flex items-center px-3 rounded-md border bg-slate-50 text-slate-900 font-semibold text-base min-h-9">
                {result !== "" ? result : <span className="text-slate-400 font-normal text-sm">Result</span>}
              </div>
              <Select value={toUnit} onValueChange={setToUnit}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(units).map((u) => (
                    <SelectItem key={u} value={u}>{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {result !== "" && (
            <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 text-center">
              <p className="text-sm text-slate-600">
                <span className="font-semibold text-slate-900">{inputValue} {fromUnit}</span>
                {" = "}
                <span className="font-semibold text-indigo-700">{result} {toUnit}</span>
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}