import React, { useState, useMemo, useCallback } from "react";
import { Card, CardBody, Button, Input } from "@nextui-org/react";
import { Search, Trash2 } from "lucide-react";
import useArkStore from "@/store/arkStore";
import DataEntryForm from "./DataEntryForm";
import VirtualizedDataTable from "./VirtualizedDataTable";

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

  const handleSubmit = useCallback(
    (key, data) => {
      addEntry("items", key, {
        ...data,
        mod_name: "Ark",
      });
    },
    [addEntry]
  );

  const handleDelete = useCallback(
    (key) => {
      removeEntry("items", key);
    },
    [removeEntry]
  );

  const columns = useMemo(
    () => [
      {
        uid: "name",
        name: "Name",
        renderCell: (item) => (
          <div className="flex flex-col">
            <span className="font-bold">{item.name}</span>
            <span className="text-sm text-gray-500">Mod: {item.mod_name}</span>
            <span className="text-sm text-gray-500">
              Type: {item.type_name}
            </span>
          </div>
        ),
      },
      {
        uid: "class_name",
        name: "Class Name",
        renderCell: (item) => (
          <div className="max-w-md break-all">
            <span className="text-sm">{item.class_name}</span>
          </div>
        ),
      },
      {
        uid: "blueprint",
        name: "Blueprint",
        renderCell: (item) => (
          <div className="max-w-md break-all">
            <span className="text-sm text-gray-500">{item.blueprint}</span>
          </div>
        ),
      },
      {
        uid: "actions",
        name: "Actions",
        renderCell: (item) => (
          <Button
            isIconOnly
            color="danger"
            variant="ghost"
            onClick={() => handleDelete(item.key)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        ),
      },
    ],
    [handleDelete]
  );

  const filteredData = useMemo(() => {
    return Object.entries(arkData.items || {})
      .filter(
        ([key, item]) =>
          key.toLowerCase().includes(search.toLowerCase()) ||
          item.name.toLowerCase().includes(search.toLowerCase())
      )
      .map(([key, item]) => ({
        key,
        ...item,
      }));
  }, [arkData.items, search]);

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
            <Input
              startContent={<Search className="w-4 h-4" />}
              placeholder="Search items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <VirtualizedDataTable
              data={filteredData}
              columns={columns}
              className="w-full"
            />
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default React.memo(ItemsTab);
