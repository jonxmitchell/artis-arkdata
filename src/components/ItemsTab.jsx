// src/components/ItemsTab.jsx
import { useState } from "react";
import {
  Card,
  CardBody,
  Button,
  Input,
  Select,
  SelectItem,
} from "@nextui-org/react";
import { Search, Trash2 } from "lucide-react";
import useArkStore from "@/store/arkStore";
import DataEntryForm from "./DataEntryForm";

const ITEM_TYPES = [
  "Resources",
  "Weapons",
  "Tools",
  "Armor",
  "Consumables",
  "Structures",
  "Ammunition",
  "Saddles",
  "Artifacts",
  "Other",
];

const ItemsTab = () => {
  const { arkData, addEntry, removeEntry } = useArkStore();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const items = Object.entries(arkData.items || {}).filter(([key, item]) => {
    const matchesSearch =
      key.toLowerCase().includes(search.toLowerCase()) ||
      item.name.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "all" || item.type_name === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleSubmit = (key, data) => {
    addEntry("items", key, {
      ...data,
      mod_name: "Ark",
    });
  };

  const handleDelete = (key) => {
    removeEntry("items", key);
  };

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardBody>
          <DataEntryForm
            category="Item"
            fields={["name", "class_name", "blueprint"]}
            types={ITEM_TYPES}
            onSubmit={handleSubmit}
          />
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <div className="flex flex-col gap-4">
            <div className="flex gap-4">
              <Input
                startContent={<Search className="w-4 h-4" />}
                placeholder="Search items..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1"
              />
              <Select
                placeholder="Filter by type"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-48"
              >
                <SelectItem key="all" value="all">
                  All Types
                </SelectItem>
                {ITEM_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              {items.map(([key, item]) => (
                <Card key={key} className="w-full">
                  <CardBody>
                    <div className="flex justify-between items-center">
                      <div className="flex flex-col">
                        <span className="font-bold">{item.name}</span>
                        <span className="text-sm text-gray-500">
                          Type: {item.type_name}
                        </span>
                        <span className="text-sm text-gray-500">
                          Class: {item.class_name}
                        </span>
                        <span className="text-sm text-gray-500 break-all">
                          {item.blueprint}
                        </span>
                        <span className="text-sm text-gray-500">
                          Mod: {item.mod_name}
                        </span>
                      </div>
                      <Button
                        isIconOnly
                        color="danger"
                        variant="ghost"
                        onClick={() => handleDelete(key)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default ItemsTab;
