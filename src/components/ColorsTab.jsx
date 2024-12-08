import { useState } from "react";
import { Card, CardBody, Button, Input } from "@nextui-org/react";
import { Search, Trash2 } from "lucide-react";
import useArkStore from "@/store/arkStore";
import DataEntryForm from "./DataEntryForm";
import CollapsibleCard from "./CollapsibleCard";

const ColorSwatch = ({ hexCode }) => (
  <div
    className="w-8 h-8 rounded border border-gray-300"
    style={{ backgroundColor: hexCode }}
  />
);

const ColorsTab = () => {
  const { arkData, addEntry, removeEntry } = useArkStore();
  const [search, setSearch] = useState("");

  const colors = Object.entries(arkData.colors || {}).filter(
    ([key, color]) =>
      key.toLowerCase().includes(search.toLowerCase()) ||
      color.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = (key, data) => {
    // Validate hex code format
    const hexCode = data.hex_code.startsWith("#")
      ? data.hex_code
      : `#${data.hex_code}`;
    const colorId = parseInt(data.color_id);

    addEntry("colors", key, {
      type_name: "color",
      name: data.name,
      color_id: colorId,
      hex_code: hexCode,
    });
  };

  const handleDelete = (key) => {
    removeEntry("colors", key);
  };

  return (
    <div className="flex flex-col gap-4">
      <CollapsibleCard title="Add New Color">
        <DataEntryForm
          category="Color"
          fields={["name", "color_id", "hex_code"]}
          onSubmit={handleSubmit}
        />
      </CollapsibleCard>

      <Card>
        <CardBody>
          <div className="flex flex-col gap-4">
            <Input
              startContent={<Search className="w-4 h-4" />}
              placeholder="Search colors..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {colors.map(([key, color]) => (
                <Card key={key} className="w-full">
                  <CardBody>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <ColorSwatch hexCode={color.hex_code} />
                        <div className="flex flex-col">
                          <span className="font-bold">{color.name}</span>
                          <span className="text-sm text-gray-500">
                            ID: {color.color_id}
                          </span>
                          <span className="text-sm text-gray-500">
                            {color.hex_code}
                          </span>
                        </div>
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

export default ColorsTab;
