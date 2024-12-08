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
  useDisclosure,
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
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { invoke } from "@tauri-apps/api/tauri";
import { writeTextFile, readTextFile } from "@tauri-apps/api/fs";
import { save, open } from "@tauri-apps/api/dialog";
import useArkStore from "@/store/arkStore";
import DataComparison from "./DataComparison";

// Toast Component
const Toast = ({ isOpen, onClose, message, type = "success" }) => {
  if (!isOpen) return null;

  const backgroundColor =
    type === "success" ? "bg-success-500" : "bg-danger-500";
  const Icon = type === "success" ? CheckCircle2 : XCircle;

  setTimeout(onClose, 3000); // Auto close after 3 seconds

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-fade-in">
      <div
        className={`${backgroundColor} text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2`}
      >
        <Icon className="w-5 h-5" />
        <span>{message}</span>
      </div>
    </div>
  );
};

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

  const [toast, setToast] = useState({
    isOpen: false,
    message: "",
    type: "success",
  });

  const showToast = (message, type = "success") => {
    setToast({ isOpen: true, message, type });
  };

  const closeToast = () => {
    setToast((prev) => ({ ...prev, isOpen: false }));
  };

  const handleUpdate = async () => {
    try {
      const scrapedData = await startScraping();
      if (scrapedData) {
        startComparison(scrapedData);
      }
    } catch (error) {
      console.error("Scraping failed:", error);
      showToast("Failed to update data", "error");
    }
  };

  const handleExport = async () => {
    try {
      const filePath = await save({
        filters: [
          {
            name: "JSON",
            extensions: ["json"],
          },
        ],
      });

      if (filePath) {
        const jsonString = JSON.stringify(arkData, null, 2);
        await writeTextFile(filePath, jsonString);
        showToast("Data exported successfully");
      }
    } catch (error) {
      console.error("Export failed:", error);
      showToast("Failed to export data", "error");
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
      showToast("Failed to import data", "error");
    }
  };

  const handleBackup = async () => {
    try {
      const backupFileName = await invoke("create_backup", { data: arkData });
      showToast(`Backup created: ${backupFileName}`);
    } catch (error) {
      console.error("Backup failed:", error);
      showToast("Failed to create backup", "error");
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
          {/* Existing card content */}
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
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Last saved: {formatTimestamp(lastSaved)}
              </div>
            </div>

            {error && <div className="text-danger text-sm">Error: {error}</div>}
          </div>
        </CardBody>
      </Card>

      {/* Modals */}
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

      {/* Toast Notification */}
      <Toast
        isOpen={toast.isOpen}
        onClose={closeToast}
        message={toast.message}
        type={toast.type}
      />
    </>
  );
};

export default Header;
