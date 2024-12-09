// src/components/IconsTab.jsx
import React, { useState, useMemo, useCallback } from "react";
import { Card, CardBody, Button, Input } from "@nextui-org/react";
import { Search, Trash2 } from "lucide-react";
import useArkStore from "@/store/arkStore";
import DataEntryForm from "./DataEntryForm";
import VirtualizedDataTable from "./VirtualizedDataTable";
import CollapsibleCard from "./CollapsibleCard";

const IconsTab = () => {
  const { arkData, addEntry, removeEntry } = useArkStore();
  const [search, setSearch] = useState("");

  const handleSubmit = useCallback(
    (key, data) => {
      addEntry("icons", key, {
        type_name: "icon",
        name: data.name,
        path: data.path,
      });
    },
    [addEntry]
  );

  const handleDelete = useCallback(
    (key) => {
      removeEntry("icons", key);
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
          </div>
        ),
      },
      {
        uid: "path",
        name: "Path",
        renderCell: (item) => (
          <div className="max-w-md break-all">
            <span className="text-sm text-gray-500">{item.path}</span>
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
    return Object.entries(arkData.icons || {})
      .filter(
        ([key, icon]) =>
          key.toLowerCase().includes(search.toLowerCase()) ||
          icon.name.toLowerCase().includes(search.toLowerCase()) ||
          icon.path.toLowerCase().includes(search.toLowerCase())
      )
      .map(([key, icon]) => ({
        key,
        ...icon,
      }));
  }, [arkData.icons, search]);

  return (
    <div className="flex flex-col gap-4">
      <CollapsibleCard title="Add New Icon">
        <DataEntryForm
          category="Icon"
          fields={["name", "path"]}
          onSubmit={handleSubmit}
        />
      </CollapsibleCard>

      <Card>
        <CardBody>
          <div className="flex flex-col gap-4">
            <Input
              startContent={<Search className="w-4 h-4" />}
              placeholder="Search icons..."
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

export default React.memo(IconsTab);
