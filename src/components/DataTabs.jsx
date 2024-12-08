import React from "react";
import { Tabs, Tab, Chip } from "@nextui-org/react";
import CreaturesTab from "@/components/CreaturesTab";
import ItemsTab from "@/components/ItemsTab";
import EngramsTab from "@/components/EngramsTab";
import BeaconsTab from "@/components/BeaconsTab";
import ColorsTab from "@/components/ColorsTab";

const DataTabs = ({ arkData, selected, onSelectionChange }) => {
  const getCount = (category) => {
    return Object.keys(arkData[category] || {}).length;
  };

  return (
    <Tabs
      selectedKey={selected}
      onSelectionChange={onSelectionChange}
      aria-label="Data Categories"
      className="w-full"
      fullWidth={true}
    >
      <Tab
        key="creatures"
        title={
          <div className="flex items-center gap-2">
            <span>Creatures</span>
            <Chip size="sm" variant="flat">
              {getCount("creatures")}
            </Chip>
          </div>
        }
      >
        <CreaturesTab />
      </Tab>
      <Tab
        key="items"
        title={
          <div className="flex items-center gap-2">
            <span>Items</span>
            <Chip size="sm" variant="flat">
              {getCount("items")}
            </Chip>
          </div>
        }
      >
        <ItemsTab />
      </Tab>
      <Tab
        key="engrams"
        title={
          <div className="flex items-center gap-2">
            <span>Engrams</span>
            <Chip size="sm" variant="flat">
              {getCount("engrams")}
            </Chip>
          </div>
        }
      >
        <EngramsTab />
      </Tab>
      <Tab
        key="beacons"
        title={
          <div className="flex items-center gap-2">
            <span>Beacons</span>
            <Chip size="sm" variant="flat">
              {getCount("beacons")}
            </Chip>
          </div>
        }
      >
        <BeaconsTab />
      </Tab>
      <Tab
        key="colors"
        title={
          <div className="flex items-center gap-2">
            <span>Colors</span>
            <Chip size="sm" variant="flat">
              {getCount("colors")}
            </Chip>
          </div>
        }
      >
        <ColorsTab />
      </Tab>
    </Tabs>
  );
};

export default DataTabs;
