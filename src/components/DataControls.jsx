// src/components/DataControls.jsx
import { useState } from "react";
import {
  Button,
  ButtonGroup,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@nextui-org/react";
import { Download, Upload, Save, AlertTriangle } from "lucide-react";
import useArkStore from "@/store/arkStore";
import { exportData, importData, createBackup } from "@/utils/dataUtils";

const DataControls = () => {
  const { arkData, setArkData, saveData } = useArkStore();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingData, setPendingData] = useState(null);
  const [error, setError] = useState(null);

  const handleExport = async () => {
    try {
      setError(null);
      await exportData(arkData);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleImport = async () => {
    try {
      setError(null);
      const data = await importData();
      if (data) {
        setPendingData(data);
        setIsConfirmOpen(true);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleBackup = async () => {
    try {
      setError(null);
      await createBackup(arkData);
    } catch (err) {
      setError(err.message);
    }
  };

  const confirmImport = async () => {
    try {
      await setArkData(pendingData);
      await saveData();
      setIsConfirmOpen(false);
      setPendingData(null);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <ButtonGroup variant="flat">
        <Button
          startContent={<Upload className="w-4 h-4" />}
          onClick={handleImport}
        >
          Import
        </Button>
        <Button
          startContent={<Download className="w-4 h-4" />}
          onClick={handleExport}
        >
          Export
        </Button>
        <Button
          startContent={<Save className="w-4 h-4" />}
          onClick={handleBackup}
        >
          Backup
        </Button>
      </ButtonGroup>

      {error && (
        <div className="text-danger text-sm flex items-center gap-1">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      )}

      <Modal isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)}>
        <ModalContent>
          <ModalHeader>Confirm Import</ModalHeader>
          <ModalBody>
            This will replace your current data. Are you sure you want to
            proceed?
            <div className="text-sm text-gray-500">
              Entries to be imported:
              <ul className="list-disc list-inside">
                <li>
                  Creatures: {Object.keys(pendingData?.creatures || {}).length}
                </li>
                <li>Items: {Object.keys(pendingData?.items || {}).length}</li>
                <li>
                  Engrams: {Object.keys(pendingData?.engrams || {}).length}
                </li>
                <li>
                  Beacons: {Object.keys(pendingData?.beacons || {}).length}
                </li>
                <li>Colors: {Object.keys(pendingData?.colors || {}).length}</li>
              </ul>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              color="danger"
              variant="light"
              onPress={() => setIsConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button color="primary" onPress={confirmImport}>
              Confirm Import
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default DataControls;
