// src/components/HistoryToolbar.jsx
import { Button, ButtonGroup, Tooltip } from "@nextui-org/react";
import { Undo2, Redo2, Save, Clock } from "lucide-react";
import useArkStore from "@/store/arkStore";

const HistoryToolbar = () => {
  const {
    canUndo,
    canRedo,
    undo,
    redo,
    saveData,
    lastAction,
    unsavedChanges,
    lastSaved,
  } = useArkStore();

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "Never";
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  return (
    <div className="flex justify-between items-center p-2">
      <div className="flex items-center gap-4">
        <ButtonGroup>
          <Tooltip
            content={canUndo() ? `Undo: ${lastAction}` : "Nothing to undo"}
          >
            <Button
              isIconOnly
              variant="flat"
              isDisabled={!canUndo()}
              onClick={undo}
            >
              <Undo2 className="w-4 h-4" />
            </Button>
          </Tooltip>
          <Tooltip content={canRedo() ? "Redo" : "Nothing to redo"}>
            <Button
              isIconOnly
              variant="flat"
              isDisabled={!canRedo()}
              onClick={redo}
            >
              <Redo2 className="w-4 h-4" />
            </Button>
          </Tooltip>
        </ButtonGroup>

        {lastAction && (
          <span className="text-sm text-gray-500">
            Last action: {lastAction}
          </span>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Clock className="w-4 h-4" />
          Last saved: {formatTimestamp(lastSaved)}
        </div>

        <Button
          color="primary"
          startContent={<Save className="w-4 h-4" />}
          isDisabled={!unsavedChanges}
          onClick={saveData}
        >
          Save
        </Button>
      </div>
    </div>
  );
};

export default HistoryToolbar;
