import { useState, useMemo } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  Tabs,
  Tab,
  Chip,
  Input,
  Button,
} from "@nextui-org/react";
import { Search, Plus, Minus, RefreshCw, Check, X } from "lucide-react";
import { compareData, getChangeStats } from "@/utils/compareData";
import useArkStore from "@/store/arkStore";

const ChangeDisplay = ({ category, type, id, item, changes }) => {
  const { pendingChanges, handleChangeAccept, handleChangeReject } =
    useArkStore();
  const [expanded, setExpanded] = useState(false);

  const isAccepted = pendingChanges[category].accept.has(id);
  const isRejected = pendingChanges[category].reject.has(id);

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

  const getStatusBadge = () => {
    if (type === "added") {
      if (isAccepted) {
        return (
          <Chip color="success" size="sm">
            Will Be Added
          </Chip>
        );
      }
      if (isRejected) {
        return (
          <Chip color="danger" size="sm">
            Will Not Add
          </Chip>
        );
      }
      return (
        <Chip variant="flat" size="sm">
          Skip Adding
        </Chip>
      );
    }

    if (type === "removed") {
      if (isAccepted) {
        return (
          <Chip color="danger" size="sm">
            Will Be Deleted
          </Chip>
        );
      }
      if (isRejected) {
        return (
          <Chip color="success" size="sm">
            Will Keep
          </Chip>
        );
      }
      return (
        <Chip variant="flat" size="sm">
          Will Keep
        </Chip>
      );
    }

    if (type === "modified") {
      if (isAccepted) {
        return (
          <Chip color="success" size="sm">
            Will Update
          </Chip>
        );
      }
      if (isRejected) {
        return (
          <Chip color="warning" size="sm">
            Keep Original
          </Chip>
        );
      }
      return (
        <Chip variant="flat" size="sm">
          Will Update
        </Chip>
      );
    }
  };

  const getBackgroundColor = () => {
    if (isAccepted) return "bg-success-50";
    if (isRejected) return "bg-danger-50";
    switch (type) {
      case "added":
        return "bg-success-100/50";
      case "removed":
        return "bg-danger-100/50";
      case "modified":
        return "bg-warning-100/50";
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
              {getStatusBadge()}
            </div>
            <div className="flex gap-2">
              <Button
                isIconOnly
                size="sm"
                color="success"
                variant={isAccepted ? "solid" : "flat"}
                onClick={() => handleChangeAccept(category, type, id)}
              >
                <Check className="w-4 h-4" />
              </Button>
              <Button
                isIconOnly
                size="sm"
                color="danger"
                variant={isRejected ? "solid" : "flat"}
                onClick={() => handleChangeReject(category, type, id)}
              >
                <X className="w-4 h-4" />
              </Button>
              {changes && (
                <Button
                  size="sm"
                  variant="light"
                  onClick={() => setExpanded(!expanded)}
                >
                  {expanded ? "Hide Details" : "Show Details"}
                </Button>
              )}
            </div>
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

export default function DataComparison({ oldData, newData }) {
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
      icons: compareData(oldData?.icons || {}, newData?.icons || {}),
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
      icons: getChangeStats(comparison.icons),
    }),
    [comparison]
  );

  const renderCategoryContent = (category) => {
    const categoryChanges = comparison[category];

    const addedItems = Object.entries(categoryChanges.added).filter(
      ([key, item]) => {
        const searchMatch =
          searchQuery.toLowerCase() === "" ||
          item.name.toLowerCase().includes(searchQuery.toLowerCase());
        return searchMatch && activeFilters.added;
      }
    );

    const modifiedItems = Object.entries(categoryChanges.modified).filter(
      ([key, item]) => {
        const searchMatch =
          searchQuery.toLowerCase() === "" ||
          item.new.name.toLowerCase().includes(searchQuery.toLowerCase());
        return searchMatch && activeFilters.modified;
      }
    );

    const removedItems = Object.entries(categoryChanges.removed).filter(
      ([key, item]) => {
        const searchMatch =
          searchQuery.toLowerCase() === "" ||
          item.name.toLowerCase().includes(searchQuery.toLowerCase());
        return searchMatch && activeFilters.removed;
      }
    );

    return (
      <div className="flex flex-col gap-2">
        {addedItems.map(([key, item]) => (
          <ChangeDisplay
            key={`added-${key}`}
            category={category}
            type="added"
            id={key}
            item={item}
          />
        ))}
        {modifiedItems.map(([key, item]) => (
          <ChangeDisplay
            key={`modified-${key}`}
            category={category}
            type="modified"
            id={key}
            item={item.new}
            changes={item.changes}
          />
        ))}
        {removedItems.map(([key, item]) => (
          <ChangeDisplay
            key={`removed-${key}`}
            category={category}
            type="removed"
            id={key}
            item={item}
          />
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
              className="w-full sm:max-w-[44%]"
              placeholder="Search changes..."
              startContent={<Search className="w-4 h-4" />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Chip
              color="success"
              variant={activeFilters.added ? "solid" : "flat"}
              className="cursor-pointer"
              onClick={() =>
                setActiveFilters((prev) => ({ ...prev, added: !prev.added }))
              }
            >
              Added: {stats[selectedCategory].added}
            </Chip>
            <Chip
              color="danger"
              variant={activeFilters.removed ? "solid" : "flat"}
              className="cursor-pointer"
              onClick={() =>
                setActiveFilters((prev) => ({
                  ...prev,
                  removed: !prev.removed,
                }))
              }
            >
              Removed: {stats[selectedCategory].removed}
            </Chip>
            <Chip
              color="warning"
              variant={activeFilters.modified ? "solid" : "flat"}
              className="cursor-pointer"
              onClick={() =>
                setActiveFilters((prev) => ({
                  ...prev,
                  modified: !prev.modified,
                }))
              }
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
            icons: "Icons",
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
}
