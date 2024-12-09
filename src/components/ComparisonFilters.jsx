import { useState } from "react";
import {
  Chip,
  Button,
  ButtonGroup,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@nextui-org/react";
import { Filter, Check } from "lucide-react";

const ComparisonFilters = ({ category, onFilterChange }) => {
  const [selectedFields, setSelectedFields] = useState(new Set(["all"]));
  const [selectedChangeTypes, setSelectedChangeTypes] = useState(
    new Set(["added", "removed", "modified"])
  );

  const fieldOptions = {
    creatures: ["name", "entity_id", "blueprint", "mod_name"],
    items: ["name", "class_name", "blueprint", "type_name", "mod_name"],
    engrams: ["name", "blueprint", "mod_name"],
    beacons: ["name", "class_name", "mod_name"],
    colors: ["name", "color_id", "hex_code"],
    icons: ["name", "path"],
  };

  const handleFieldSelection = (keys) => {
    const newSelection = new Set(keys);
    setSelectedFields(newSelection);

    onFilterChange({
      fields: newSelection.has("all")
        ? fieldOptions[category]
        : Array.from(newSelection),
      changeTypes: Array.from(selectedChangeTypes),
    });
  };

  const handleChangeTypeSelection = (type) => {
    const newTypes = new Set(selectedChangeTypes);
    if (newTypes.has(type)) {
      newTypes.delete(type);
    } else {
      newTypes.add(type);
    }
    setSelectedChangeTypes(newTypes);

    onFilterChange({
      fields: selectedFields.has("all")
        ? fieldOptions[category]
        : Array.from(selectedFields),
      changeTypes: Array.from(newTypes),
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <Dropdown>
        <DropdownTrigger>
          <Button variant="flat" startContent={<Filter className="w-4 h-4" />}>
            Filter Fields
          </Button>
        </DropdownTrigger>
        <DropdownMenu
          selectionMode="multiple"
          selectedKeys={selectedFields}
          onSelectionChange={handleFieldSelection}
        >
          <DropdownItem key="all">All Fields</DropdownItem>
          {fieldOptions[category].map((field) => (
            <DropdownItem key={field}>
              {field.charAt(0).toUpperCase() + field.slice(1).replace("_", " ")}
            </DropdownItem>
          ))}
        </DropdownMenu>
      </Dropdown>

      <ButtonGroup>
        <Button
          size="sm"
          variant={selectedChangeTypes.has("added") ? "solid" : "flat"}
          color="success"
          onClick={() => handleChangeTypeSelection("added")}
        >
          Added
        </Button>
        <Button
          size="sm"
          variant={selectedChangeTypes.has("removed") ? "solid" : "flat"}
          color="danger"
          onClick={() => handleChangeTypeSelection("removed")}
        >
          Removed
        </Button>
        <Button
          size="sm"
          variant={selectedChangeTypes.has("modified") ? "solid" : "flat"}
          color="warning"
          onClick={() => handleChangeTypeSelection("modified")}
        >
          Modified
        </Button>
      </ButtonGroup>

      <div className="flex gap-2 items-center">
        <span className="text-sm text-gray-500">Active Filters:</span>
        {Array.from(selectedFields).map((field) => (
          <Chip key={field} size="sm" variant="flat">
            {field === "all" ? "All Fields" : field}
          </Chip>
        ))}
      </div>
    </div>
  );
};

export default ComparisonFilters;
