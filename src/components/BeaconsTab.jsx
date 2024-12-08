import React, { useState, useMemo, useCallback } from "react";
import { Card, CardBody, Button, Input } from "@nextui-org/react";
import { Search, Trash2 } from "lucide-react";
import useArkStore from "@/store/arkStore";
import DataEntryForm from "./DataEntryForm";
import VirtualizedDataTable from "./VirtualizedDataTable";

const BeaconsTab = () => {
  const { arkData, addEntry, removeEntry } = useArkStore();
  const [search, setSearch] = useState("");

  const handleSubmit = useCallback(
    (key, data) => {
      addEntry("beacons", key, {
        type_name: "beacon",
        name: data.name,
        mod_name: "Ark",
        class_name: data.class_name,
      });
    },
    [addEntry]
  );

  const handleDelete = useCallback(
    (key) => {
      removeEntry("beacons", key);
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
        uid: "class_name",
        name: "Class Name",
        renderCell: (item) => (
          <div className="max-w-md break-all">
            <span className="text-sm">{item.class_name}</span>
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
    return Object.entries(arkData.beacons || {})
      .filter(
        ([key, beacon]) =>
          key.toLowerCase().includes(search.toLowerCase()) ||
          beacon.name.toLowerCase().includes(search.toLowerCase())
      )
      .map(([key, beacon]) => ({
        key,
        ...beacon,
      }));
  }, [arkData.beacons, search]);

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardBody>
          <DataEntryForm
            category="Beacon"
            fields={["name", "class_name"]}
            onSubmit={handleSubmit}
          />
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <div className="flex flex-col gap-4">
            <Input
              startContent={<Search className="w-4 h-4" />}
              placeholder="Search beacons..."
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

export default React.memo(BeaconsTab);
