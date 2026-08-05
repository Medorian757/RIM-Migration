import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { History, Plus, Edit2 } from "lucide-react";
import { format } from "date-fns";

const FIELD_LABELS = {
  name: "Name",
  description: "Description",
  sku: "SKU",
  category_id: "Category",
  case_quantity: "Count",
  case_unit: "Container Type",
  units_per_case: "Units per Case",
  unit: "Unit",
  min_cases: "Min Cases",
  unit_cost: "Unit Cost",
  sale_price: "Sale Price",
  location: "Location",
  notes: "Notes",
  image_url: "Image",
  tags: "Tags"
};

export default function ItemChangeHistory({ itemId }) {
  const { data: history = [], isLoading } = useQuery({
    queryKey: ["change-history", itemId],
    queryFn: () => base44.entities.ChangeHistory.filter({ item_id: itemId }, "-created_date", 50),
    enabled: !!itemId
  });

  if (isLoading) {
    return <div className="py-4 text-center text-sm text-slate-400">Loading history...</div>;
  }

  if (history.length === 0) {
    return (
      <div className="py-6 text-center text-sm text-slate-400">
        <History className="h-8 w-8 mx-auto mb-2 text-slate-300" />
        No change history yet
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
      {history.map((entry) => (
        <div key={entry.id} className="flex gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <div className={`h-7 w-7 rounded-full flex items-center justify-center ${
              entry.action === "created" ? "bg-emerald-100" : "bg-blue-100"
            }`}>
              {entry.action === "created"
                ? <Plus className="h-3.5 w-3.5 text-emerald-600" />
                : <Edit2 className="h-3.5 w-3.5 text-blue-600" />
              }
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-slate-700 capitalize">{entry.action}</span>
              <span className="text-xs text-slate-400 flex-shrink-0">
                {format(new Date(entry.created_date), "MMM d, yyyy h:mm a")}
              </span>
            </div>
            {entry.changed_by && (
              <p className="text-xs text-slate-400 mb-1">by {entry.changed_by}</p>
            )}
            {entry.changes && entry.changes.length > 0 && (
              <div className="mt-1 space-y-1">
                {entry.changes.map((change, i) => (
                  <div key={i} className="text-xs bg-slate-50 rounded-lg px-2 py-1.5">
                    <span className="font-medium text-slate-600">{FIELD_LABELS[change.field] || change.field}:</span>{" "}
                    {change.old_value !== undefined && change.old_value !== "" && (
                      <span className="text-rose-500 line-through mr-1">{change.old_value}</span>
                    )}
                    <span className="text-emerald-600">{change.new_value || "(empty)"}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}