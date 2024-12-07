import {
  Button,
  ButtonGroup,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@nextui-org/react";
import { Download, Check, X, CheckCheck, FileDown } from "lucide-react";
import { exportData } from "@/utils/compareData";

const ComparisonActions = ({
  category,
  changes,
  onAccept,
  onReject,
  stats,
}) => {
  const handleExport = async () => {
    const exportContent = {
      category,
      changes,
      stats,
      timestamp: new Date().toISOString(),
      summary: {
        total: stats.added + stats.removed + stats.modified,
        ...stats,
      },
    };

    // Create and download file
    const blob = new Blob([JSON.stringify(exportContent, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `changes-${category}-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    let csvContent = "Type,Name,Field,Old Value,New Value\n";

    // Add added items
    Object.entries(changes.added).forEach(([key, item]) => {
      csvContent += `Added,${item.name},-,-,-\n`;
    });

    // Add modified items
    Object.entries(changes.modified).forEach(([key, item]) => {
      Object.entries(item.changes).forEach(([field, change]) => {
        csvContent += `Modified,${item.new.name},${field},${change.oldValue},${change.newValue}\n`;
      });
    });

    // Add removed items
    Object.entries(changes.removed).forEach(([key, item]) => {
      csvContent += `Removed,${item.name},-,-,-\n`;
    });

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `changes-${category}-${new Date().toISOString()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex justify-between items-center mb-4">
      <ButtonGroup>
        <Button
          color="success"
          startContent={<CheckCheck className="w-4 h-4" />}
          onClick={() => onAccept("all")}
        >
          Accept All
        </Button>
        <Dropdown>
          <DropdownTrigger>
            <Button color="success" variant="flat">
              <Check className="w-4 h-4" />
            </Button>
          </DropdownTrigger>
          <DropdownMenu>
            <DropdownItem onClick={() => onAccept("added")}>
              Accept Added ({stats.added})
            </DropdownItem>
            <DropdownItem onClick={() => onAccept("modified")}>
              Accept Modified ({stats.modified})
            </DropdownItem>
            <DropdownItem onClick={() => onAccept("removed")}>
              Accept Removed ({stats.removed})
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </ButtonGroup>

      <ButtonGroup>
        <Button
          color="danger"
          startContent={<X className="w-4 h-4" />}
          onClick={() => onReject("all")}
        >
          Reject All
        </Button>
        <Dropdown>
          <DropdownTrigger>
            <Button color="danger" variant="flat">
              <X className="w-4 h-4" />
            </Button>
          </DropdownTrigger>
          <DropdownMenu>
            <DropdownItem onClick={() => onReject("added")}>
              Reject Added ({stats.added})
            </DropdownItem>
            <DropdownItem onClick={() => onReject("modified")}>
              Reject Modified ({stats.modified})
            </DropdownItem>
            <DropdownItem onClick={() => onReject("removed")}>
              Reject Removed ({stats.removed})
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </ButtonGroup>

      <ButtonGroup>
        <Button
          variant="flat"
          startContent={<FileDown className="w-4 h-4" />}
          onClick={handleExport}
        >
          Export JSON
        </Button>
        <Button
          variant="flat"
          startContent={<FileDown className="w-4 h-4" />}
          onClick={handleExportCSV}
        >
          Export CSV
        </Button>
      </ButtonGroup>
    </div>
  );
};

export default ComparisonActions;
