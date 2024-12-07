// src/components/BeaconsTab.jsx
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

const LOCATIONS = [
  "The Island",
  "Scorched Earth",
  "Aberration",
  "Extinction",
  "Genesis",
  "Genesis 2",
  "The Center",
  "Ragnarok",
  "Valguero",
  "Crystal Isles",
  "Lost Island",
  "Fjordur",
];

const BeaconsTab = () => {
  const { arkData, addEntry, removeEntry } = useArkStore();
  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");

  const beacons = Object.entries(arkData.beacons || {}).filter(
    ([key, beacon]) => {
      const matchesSearch =
        key.toLowerCase().includes(search.toLowerCase()) ||
        beacon.name.toLowerCase().includes(search.toLowerCase());
      const matchesLocation =
        locationFilter === "all" || beacon.name.includes(`[${locationFilter}]`);
      return matchesSearch && matchesLocation;
    }
  );

  // Group beacons by location
  const groupedBeacons = beacons.reduce((acc, [key, beacon]) => {
    const location = beacon.name.match(/\[(.*?)\]/)?.[1] || "Other";
    if (!acc[location]) {
      acc[location] = [];
    }
    acc[location].push([key, beacon]);
    return acc;
  }, {});

  const handleSubmit = (key, data) => {
    const location = data.location || "The Island";
    const name = `[${location}] ${data.name}`;
    addEntry("beacons", key, {
      type_name: "beacon",
      name,
      mod_name: "Ark",
      class_name: data.class_name,
    });
  };

  const handleDelete = (key) => {
    removeEntry("beacons", key);
  };

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardBody>
          <div className="flex flex-col gap-4">
            <Select
              label="Location"
              placeholder="Select location"
              defaultSelectedKeys={["The Island"]}
            >
              {LOCATIONS.map((loc) => (
                <SelectItem key={loc} value={loc}>
                  {loc}
                </SelectItem>
              ))}
            </Select>
            <DataEntryForm
              category="Beacon"
              fields={["name", "class_name"]}
              onSubmit={handleSubmit}
            />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <div className="flex flex-col gap-4">
            <div className="flex gap-4">
              <Input
                startContent={<Search className="w-4 h-4" />}
                placeholder="Search beacons..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1"
              />
              <Select
                placeholder="Filter by location"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="w-48"
              >
                <SelectItem key="all" value="all">
                  All Locations
                </SelectItem>
                {LOCATIONS.map((loc) => (
                  <SelectItem key={loc} value={loc}>
                    {loc}
                  </SelectItem>
                ))}
              </Select>
            </div>

            {Object.entries(groupedBeacons).map(
              ([location, locationBeacons]) => (
                <div key={location} className="flex flex-col gap-2">
                  <h3 className="text-lg font-semibold mt-2">{location}</h3>
                  {locationBeacons.map(([key, beacon]) => (
                    <Card key={key} className="w-full">
                      <CardBody>
                        <div className="flex justify-between items-center">
                          <div className="flex flex-col">
                            <span className="font-bold">{beacon.name}</span>
                            <span className="text-sm text-gray-500">
                              Class: {beacon.class_name}
                            </span>
                            <span className="text-sm text-gray-500">
                              Mod: {beacon.mod_name}
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
              )
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default BeaconsTab;
