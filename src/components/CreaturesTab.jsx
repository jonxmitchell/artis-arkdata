import React, { useState, useMemo, useCallback } from "react";
import { Card, CardBody, Button, Input } from "@nextui-org/react";
import { Search, Trash2 } from "lucide-react";
import useArkStore from "@/store/arkStore";
import DataEntryForm from "./DataEntryForm";
import VirtualizedDataTable from "./VirtualizedDataTable";
import CollapsibleCard from "./CollapsibleCard";

const CreaturesTab = () => {
  const { arkData, addEntry, removeEntry } = useArkStore();
  const [search, setSearch] = useState("");

  const handleSubmit = useCallback(
    (key, data) => {
      addEntry("creatures", key, {
        ...data,
        type_name: "creature",
      });
    },
    [addEntry]
  );

  const handleDelete = useCallback(
    (key) => {
      removeEntry("creatures", key);
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
          </div>
        ),
      },
      {
        uid: "entity_id",
        name: "Entity ID",
        renderCell: (item) => (
          <div className="max-w-md break-all">
            <span className="text-sm">{item.entity_id}</span>
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
    return Object.entries(arkData.creatures || {})
      .filter(
        ([key, creature]) =>
          key.toLowerCase().includes(search.toLowerCase()) ||
          creature.name.toLowerCase().includes(search.toLowerCase())
      )
      .map(([key, creature]) => ({
        key,
        ...creature,
      }));
  }, [arkData.creatures, search]);

  return (
    <div className="flex flex-col gap-4">
      <CollapsibleCard title="Add New Creature">
        <DataEntryForm
          category="Creature"
          fields={["name", "mod_name", "entity_id", "blueprint"]}
          onSubmit={handleSubmit}
        />
      </CollapsibleCard>

      <Card>
        <CardBody>
          <div className="flex flex-col gap-4">
            <Input
              startContent={<Search className="w-4 h-4" />}
              placeholder="Search creatures..."
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

export default React.memo(CreaturesTab);
