// src/components/CreaturesTab.jsx
import { useState } from "react";
import { Card, CardBody, Button, Input } from "@nextui-org/react";
import { Search, Trash2 } from "lucide-react";
import useArkStore from "@/store/arkStore";
import DataEntryForm from "./DataEntryForm";

const CreaturesTab = () => {
  const { arkData, addEntry, removeEntry } = useArkStore();
  const [search, setSearch] = useState("");

  const creatures = Object.entries(arkData.creatures || {}).filter(
    ([key, creature]) =>
      key.toLowerCase().includes(search.toLowerCase()) ||
      creature.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = (key, data) => {
    addEntry("creatures", key, {
      ...data,
      type_name: "creature",
    });
  };

  const handleDelete = (key) => {
    removeEntry("creatures", key);
  };

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardBody>
          <DataEntryForm
            category="Creature"
            fields={["name", "mod_name", "entity_id", "blueprint"]}
            onSubmit={handleSubmit}
          />
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <div className="flex flex-col gap-4">
            <Input
              startContent={<Search className="w-4 h-4" />}
              placeholder="Search creatures..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <div className="flex flex-col gap-2">
              {creatures.map(([key, creature]) => (
                <Card key={key} className="w-full">
                  <CardBody>
                    <div className="flex justify-between items-center">
                      <div className="flex flex-col">
                        <span className="font-bold">{creature.name}</span>
                        <span className="text-sm text-gray-500">
                          {creature.blueprint}
                        </span>
                        <span className="text-sm text-gray-500">
                          Entity ID: {creature.entity_id}
                        </span>
                        <span className="text-sm text-gray-500">
                          Mod: {creature.mod_name}
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

export default CreaturesTab;
