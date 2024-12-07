// src/components/BulkOperationsBar.jsx
import { useEffect } from "react";
import { Button, ButtonGroup, Checkbox } from "@nextui-org/react";
import { Trash2, Download, X } from "lucide-react";
import useBulkOperationsStore from "@/store/bulkOperationsStore";
import { exportData } from "@/utils/dataUtils";

const BulkOperationsBar = ({ category, items }) => {
  const {
    selectedItems,
    setCategory,
    toggleSelection,
    selectAll,
    clearSelection,
    bulkDelete,
    bulkExport,
  } = useBulkOperationsStore();

  useEffect(() => {
    setCategory(category);
    return () => clearSelection();
  }, [category]);

  const handleSelectAll = (isSelected) => {
    if (isSelected) {
      selectAll(Object.keys(items));
    } else {
      clearSelection();
    }
  };

  const handleBulkExport = async () => {
    const selectedData = await bulkExport();
    await exportData(selectedData);
  };

  return selectedItems.size > 0 ? (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-content1 rounded-lg shadow-lg p-4 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Checkbox
            isSelected={selectedItems.size === Object.keys(items).length}
            isIndeterminate={
              selectedItems.size > 0 &&
              selectedItems.size < Object.keys(items).length
            }
            onValueChange={handleSelectAll}
          >
            {selectedItems.size} selected
          </Checkbox>
        </div>

        <ButtonGroup>
          <Button
            color="danger"
            variant="flat"
            startContent={<Trash2 className="w-4 h-4" />}
            onClick={bulkDelete}
          >
            Delete
          </Button>
          <Button
            color="primary"
            variant="flat"
            startContent={<Download className="w-4 h-4" />}
            onClick={handleBulkExport}
          >
            Export Selected
          </Button>
          <Button variant="light" isIconOnly onClick={clearSelection}>
            <X className="w-4 h-4" />
          </Button>
        </ButtonGroup>
      </div>
    </div>
  ) : null;
};

export default BulkOperationsBar;
