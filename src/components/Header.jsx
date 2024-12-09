import { useState, useEffect } from "react";
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
  Tag,
} from "lucide-react";
import { createBackup, exportData, importData } from "@/utils/dataUtils";
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
    incrementMajorVersion,
    incrementMinorVersion,
    incrementPatchVersion,
  } = useArkStore();

  const [showVersionModal, setShowVersionModal] = useState(false);
  const [formattedLastSaved, setFormattedLastSaved] = useState("Never");
  const [formattedLastUpdated, setFormattedLastUpdated] = useState("Never");

  // Handle timestamp formatting on the client side only
  useEffect(() => {
    if (lastSaved) {
      const date = new Date(lastSaved);
      setFormattedLastSaved(date.toLocaleString());
    }

    if (arkData.last_updated) {
      const date = new Date(arkData.last_updated * 1000); // Convert Unix timestamp to milliseconds
      setFormattedLastUpdated(date.toLocaleString());
    }
  }, [lastSaved, arkData.last_updated]);

  const handleUpdate = async () => {
    try {
      // First try to create backup
      console.log("Creating backup before update...");
      const backupResult = await createBackup(arkData);
      console.log("Backup created:", backupResult);

      // Start scraping
      console.log("Starting scraping process...");
      const scrapedData = await startScraping();
      if (scrapedData) {
        // Ensure version and last_updated are properly set before comparison
        scrapedData.version = arkData.version;
        scrapedData.last_updated = Math.floor(Date.now() / 1000);
        startComparison(scrapedData);
      }
    } catch (error) {
      console.error("Update process failed:", error);
      // Show error to user (you can use your preferred notification method)
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
      const importedData = await importData();
      if (importedData) {
        // Ensure version and last_updated are properly set before comparison
        importedData.version = arkData.version;
        importedData.last_updated = Math.floor(Date.now() / 1000);
        startComparison(importedData);
      }
    } catch (error) {
      console.error("Import failed:", error);
    }
  };

  const handleBackup = async () => {
    try {
      await createBackup(arkData);
    } catch (error) {
      console.error("Backup failed:", error);
    }
  };

  return (
    <>
      <Card>
        <CardBody>
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Database className="w-6 h-6" />
                <div className="flex flex-col">
                  <h1 className="text-xl font-bold">ARK Data Manager</h1>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">
                      Version {arkData.version}
                    </span>
                    <Button
                      size="sm"
                      variant="light"
                      startContent={<Tag className="w-4 h-4" />}
                      onClick={() => setShowVersionModal(true)}
                    >
                      Update Version
                    </Button>
                  </div>
                </div>
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
                      onClick={handleBackup}
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
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Last saved: {formattedLastSaved}
                </div>
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Last updated: {formattedLastUpdated}
                </div>
              </div>
            </div>

            {error && <div className="text-danger text-sm">Error: {error}</div>}
          </div>
        </CardBody>
      </Card>

      {/* Version Update Modal */}
      <Modal
        isOpen={showVersionModal}
        onClose={() => setShowVersionModal(false)}
      >
        <ModalContent>
          <ModalHeader>Update Version</ModalHeader>
          <ModalBody>
            <div className="flex flex-col gap-4">
              <Button
                color="primary"
                onClick={() => {
                  incrementMajorVersion();
                  setShowVersionModal(false);
                }}
              >
                Increment Major Version (Breaking Changes)
              </Button>
              <Button
                color="primary"
                variant="bordered"
                onClick={() => {
                  incrementMinorVersion();
                  setShowVersionModal(false);
                }}
              >
                Increment Minor Version (New Features)
              </Button>
              <Button
                color="primary"
                variant="light"
                onClick={() => {
                  incrementPatchVersion();
                  setShowVersionModal(false);
                }}
              >
                Increment Patch Version (Bug Fixes)
              </Button>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onClick={() => setShowVersionModal(false)}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Data Comparison Modal */}
      <Modal
        isOpen={showComparison}
        onClose={cancelComparison}
        size="4xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader>Review Changes</ModalHeader>
          <ModalBody>
            <DataComparison oldData={arkData} newData={compareData} />
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={cancelComparison}>
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
