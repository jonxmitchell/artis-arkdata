import { useState } from "react";
import {
  Button,
  ButtonGroup,
  Card,
  CardBody,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Tooltip,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@nextui-org/react";
import {
  Database,
  RefreshCw,
  Undo2,
  Redo2,
  Save,
  Clock,
  Download,
  Upload,
  Archive,
} from "lucide-react";
import { createBackup, exportData } from "@/utils/dataUtils";
import useArkStore from "@/store/arkStore";
import DataComparison from "./DataComparison";

const Header = () => {
  const {
    startScraping,
    scraping,
    error,
    arkData,
    compareData,
    showComparison,
    startComparison,
    cancelComparison,
    applyComparison,
    scrapingProgress,
    canUndo,
    canRedo,
    undo,
    redo,
    saveData,
    lastAction,
    unsavedChanges,
    lastSaved,
    handleChangeAccept,
    handleChangeReject,
  } = useArkStore();

  const handleUpdate = async () => {
    try {
      // Create backup before starting the scraping process
      await createBackup(arkData);

      const scrapedData = await startScraping();
      if (scrapedData) {
        startComparison(scrapedData);
      }
    } catch (error) {
      console.error("Update process failed:", error);
    }
  };

  const handleExport = async () => {
    try {
      await exportData(arkData);
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  const handleImport = async () => {
    try {
      const filePath = await open({
        filters: [
          {
            name: "JSON",
            extensions: ["json"],
          },
        ],
      });

      if (filePath) {
        const content = await readTextFile(filePath);
        const importedData = JSON.parse(content);
        startComparison(importedData);
      }
    } catch (error) {
      console.error("Import failed:", error);
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "Never";
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  return (
    <>
      <Card>
        <CardBody>
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Database className="w-6 h-6" />
                <h1 className="text-xl font-bold">ARK Data Manager</h1>
              </div>

              <div className="flex items-center gap-4">
                {/* History Controls */}
                <ButtonGroup>
                  <Tooltip
                    content={
                      canUndo() ? `Undo: ${lastAction}` : "Nothing to undo"
                    }
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

                {/* Data Management */}
                <Dropdown>
                  <DropdownTrigger>
                    <Button
                      variant="flat"
                      startContent={<Download className="w-4 h-4" />}
                    >
                      Manage Data
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu>
                    <DropdownItem
                      key="import"
                      startContent={<Upload className="w-4 h-4" />}
                      onClick={handleImport}
                    >
                      Import Data
                    </DropdownItem>
                    <DropdownItem
                      key="export"
                      startContent={<Download className="w-4 h-4" />}
                      onClick={handleExport}
                    >
                      Export Data
                    </DropdownItem>
                    <DropdownItem
                      key="backup"
                      startContent={<Archive className="w-4 h-4" />}
                      onClick={() => createBackup(arkData)}
                    >
                      Create Backup
                    </DropdownItem>
                  </DropdownMenu>
                </Dropdown>

                {/* Update Button */}
                <Button
                  color="primary"
                  startContent={
                    <RefreshCw
                      className={`w-4 h-4 ${scraping ? "animate-spin" : ""}`}
                    />
                  }
                  onClick={handleUpdate}
                  isDisabled={scraping}
                >
                  {scraping
                    ? `${scrapingProgress.stage || "Updating"} (${Math.round(
                        scrapingProgress.progress
                      )}%)`
                    : "Update Data"}
                </Button>

                {/* Save Button */}
                <Button
                  color="primary"
                  variant="flat"
                  startContent={<Save className="w-4 h-4" />}
                  isDisabled={!unsavedChanges}
                  onClick={saveData}
                >
                  Save
                </Button>
              </div>
            </div>

            {/* Status Information */}
            <div className="flex justify-between items-center text-sm text-gray-500">
              <div className="flex items-center gap-2">
                {lastAction && `Last action: ${lastAction}`}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Last saved: {formatTimestamp(lastSaved)}
              </div>
            </div>

            {error && <div className="text-danger text-sm">Error: {error}</div>}
          </div>
        </CardBody>
      </Card>

      <Modal
        isOpen={showComparison}
        onClose={cancelComparison}
        size="4xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader>Review Changes</ModalHeader>
          <ModalBody>
            <DataComparison
              oldData={arkData}
              newData={compareData}
              onAcceptChange={handleChangeAccept}
              onRejectChange={handleChangeReject}
            />
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="flat" onPress={cancelComparison}>
              Cancel
            </Button>
            <Button color="primary" onPress={applyComparison}>
              Apply Changes
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default Header;
