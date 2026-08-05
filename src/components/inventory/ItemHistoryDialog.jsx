import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { History } from "lucide-react";
import ItemChangeHistory from "./ItemChangeHistory";

export default function ItemHistoryDialog({ item, open, onClose }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-indigo-500" />
            Change History — {item?.name}
          </DialogTitle>
        </DialogHeader>
        {item && <ItemChangeHistory itemId={item.id} />}
      </DialogContent>
    </Dialog>
  );
}