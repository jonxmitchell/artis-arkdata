// src/components/EngramsTab.jsx
import { useState } from "react";
import { Card, CardBody, Button, Input } from "@nextui-org/react";
import { Search, Trash2 } from "lucide-react";
import useArkStore from "@/store/arkStore";
import DataEntryForm from "./DataEntryForm";

const EngramsTab = () => {
  const { arkData, addEntry, removeEntry } = useArkStore();
  const [search, setSearch] = useState("");

  const engrams = Object.entries(arkData.engrams || {}).filter(
    ([key, engram]) =>
      key.toLowerCase().includes(search.toLowerCase()) ||
      engram.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = (key, data) => {
    addEntry("engrams", key, {
      ...data,
      type_name: "engram",
      mod_name: "Ark",
    });
  };

  const handleDelete = (key) => {
    removeEntry("engrams", key);
  };

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardBody>
          <DataEntryForm
            category="Engram"
            fields={["name", "blueprint"]}
            onSubmit={handleSubmit}
          />
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <div className="flex flex-col gap-4">
            <Input
              startContent={<Search className="w-4 h-4" />}
              placeholder="Search engrams..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <div className="flex flex-col gap-2">
              {engrams.map(([key, engram]) => (
                <Card key={key} className="w-full">
                  <CardBody>
                    <div className="flex justify-between items-center">
                      <div className="flex flex-col">
                        <span className="font-bold">{engram.name}</span>
                        <span className="text-sm text-gray-500 break-all">
                          {engram.blueprint}
                        </span>
                        <span className="text-sm text-gray-500">
                          Mod: {engram.mod_name}
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

export default EngramsTab;
