import { useState, useMemo } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  Tabs,
  Tab,
  Chip,
  Input,
} from "@nextui-org/react";
import {
  Plus,
  Minus,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  Search,
} from "lucide-react";
import { compareData, getChangeStats } from "@/utils/compareData";

const ChangeDisplay = ({ type, item, changes }) => {
  const [expanded, setExpanded] = useState(false);

  const getIcon = () => {
    switch (type) {
      case "added":
        return <Plus className="w-4 h-4 text-success" />;
      case "removed":
        return <Minus className="w-4 h-4 text-danger" />;
      case "modified":
        return <RefreshCw className="w-4 h-4 text-warning" />;
      default:
        return null;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case "added":
        return "bg-success-50";
      case "removed":
        return "bg-danger-50";
      case "modified":
        return "bg-warning-50";
      default:
        return "";
    }
  };

  return (
    <Card className={`w-full ${getBackgroundColor()}`}>
      <CardBody>
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              {getIcon()}
              <span className="font-bold">{item.name}</span>
            </div>
            {changes && (
              <button
                className="p-1 hover:bg-default-100 rounded-full"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
          {expanded && changes && (
            <div className="ml-6 flex flex-col gap-1">
              {Object.entries(changes).map(([field, change]) => (
                <div key={field} className="text-sm">
                  <span className="font-medium">{field}: </span>
                  {change.type === "modified" ? (
                    <>
                      <span className="line-through text-danger">
                        {change.oldValue}
                      </span>{" "}
                      → <span className="text-success">{change.newValue}</span>
                    </>
                  ) : change.type === "added" ? (
                    <span className="text-success">Added: {change.value}</span>
                  ) : (
                    <span className="text-danger">Removed: {change.value}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
};

const DataComparison = ({ oldData, newData }) => {
  const [selectedCategory, setSelectedCategory] = useState("creatures");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState({
    added: true,
    removed: true,
    modified: true,
  });

  const comparison = useMemo(
    () => ({
      creatures: compareData(
        oldData?.creatures || {},
        newData?.creatures || {}
      ),
      items: compareData(oldData?.items || {}, newData?.items || {}),
      engrams: compareData(oldData?.engrams || {}, newData?.engrams || {}),
      beacons: compareData(oldData?.beacons || {}, newData?.beacons || {}),
      colors: compareData(oldData?.colors || {}, newData?.colors || {}),
    }),
    [oldData, newData]
  );

  const stats = useMemo(
    () => ({
      creatures: getChangeStats(comparison.creatures),
      items: getChangeStats(comparison.items),
      engrams: getChangeStats(comparison.engrams),
      beacons: getChangeStats(comparison.beacons),
      colors: getChangeStats(comparison.colors),
    }),
    [comparison]
  );

  const toggleFilter = (filterType) => {
    setActiveFilters((prev) => ({
      ...prev,
      [filterType]: !prev[filterType],
    }));
  };

  const filterAndSearchChanges = (changes, type) => {
    return Object.entries(changes).filter(([key, item]) => {
      const searchMatch =
        searchQuery.toLowerCase() === "" ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.blueprint &&
          item.blueprint.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.class_name &&
          item.class_name.toLowerCase().includes(searchQuery.toLowerCase()));

      return searchMatch && activeFilters[type];
    });
  };

  const renderCategoryContent = (category) => {
    const categoryChanges = comparison[category];

    const addedItems = filterAndSearchChanges(categoryChanges.added, "added");
    const modifiedItems = filterAndSearchChanges(
      categoryChanges.modified,
      "modified"
    );
    const removedItems = filterAndSearchChanges(
      categoryChanges.removed,
      "removed"
    );

    const noResults =
      addedItems.length === 0 &&
      modifiedItems.length === 0 &&
      removedItems.length === 0;
    const noActiveFilters = !Object.values(activeFilters).some((v) => v);

    if (noResults || noActiveFilters) {
      return (
        <div className="text-center p-4 text-gray-500">
          {noActiveFilters
            ? "No filters selected"
            : searchQuery
            ? "No results match your search"
            : "No changes found"}
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-2">
        {addedItems.map(([key, item]) => (
          <ChangeDisplay key={`added-${key}`} type="added" item={item} />
        ))}
        {modifiedItems.map(([key, item]) => (
          <ChangeDisplay
            key={`modified-${key}`}
            type="modified"
            item={item.new}
            changes={item.changes}
          />
        ))}
        {removedItems.map(([key, item]) => (
          <ChangeDisplay key={`removed-${key}`} type="removed" item={item} />
        ))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 w-full">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">Data Comparison</h3>
            <Input
              classNames={{
                base: "w-full sm:max-w-[44%]",
                input: "text-small",
              }}
              placeholder="Search by name, blueprint, or class name..."
              startContent={<Search className="w-4 h-4 text-default-400" />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Chip
              color="success"
              variant={activeFilters.added ? "solid" : "flat"}
              className="cursor-pointer"
              onClick={() => toggleFilter("added")}
            >
              Added: {stats[selectedCategory].added}
            </Chip>
            <Chip
              color="danger"
              variant={activeFilters.removed ? "solid" : "flat"}
              className="cursor-pointer"
              onClick={() => toggleFilter("removed")}
            >
              Removed: {stats[selectedCategory].removed}
            </Chip>
            <Chip
              color="warning"
              variant={activeFilters.modified ? "solid" : "flat"}
              className="cursor-pointer"
              onClick={() => toggleFilter("modified")}
            >
              Modified: {stats[selectedCategory].modified}
            </Chip>
          </div>
        </div>
      </CardHeader>
      <CardBody>
        <Tabs
          selectedKey={selectedCategory}
          onSelectionChange={setSelectedCategory}
        >
          {Object.entries({
            creatures: "Creatures",
            items: "Items",
            engrams: "Engrams",
            beacons: "Beacons",
            colors: "Colors",
          }).map(([key, label]) => (
            <Tab
              key={key}
              title={
                <div className="flex items-center gap-2">
                  <span>{label}</span>
                  <Chip size="sm" variant="flat">
                    {stats[key].total}
                  </Chip>
                </div>
              }
            >
              {renderCategoryContent(key)}
            </Tab>
          ))}
        </Tabs>
      </CardBody>
    </Card>
  );
};

export default DataComparison;
