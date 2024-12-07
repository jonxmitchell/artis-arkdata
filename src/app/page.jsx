"use client";

// src/app/page.jsx
import { useState, useEffect } from "react";
import { Tabs, Tab, Card, CardBody, Spinner } from "@nextui-org/react";
import useArkStore from "@/store/arkStore";
import CreaturesTab from "@/components/CreaturesTab";
import ItemsTab from "@/components/ItemsTab";
import EngramsTab from "@/components/EngramsTab";
import BeaconsTab from "@/components/BeaconsTab";
import ColorsTab from "@/components/ColorsTab";
import Header from "@/components/Header";
import HistoryToolbar from "@/components/HistoryToolbar";
import ScrapingProgress from "@/components/ScrapingProgress";

export default function Home() {
  const { loadData, loading, scraping, scrapingProgress } = useArkStore();
  const [selected, setSelected] = useState("creatures");

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" label="Loading data..." />
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full min-h-screen p-4 gap-4">
      <Header />
      <HistoryToolbar />

      {scraping && (
        <Card>
          <CardBody>
            <ScrapingProgress {...scrapingProgress} />
          </CardBody>
        </Card>
      )}

      <Card>
        <CardBody>
          <Tabs
            selectedKey={selected}
            onSelectionChange={setSelected}
            aria-label="Data Categories"
            className="w-full"
          >
            <Tab key="creatures" title="Creatures">
              <CreaturesTab />
            </Tab>
            <Tab key="items" title="Items">
              <ItemsTab />
            </Tab>
            <Tab key="engrams" title="Engrams">
              <EngramsTab />
            </Tab>
            <Tab key="beacons" title="Beacons">
              <BeaconsTab />
            </Tab>
            <Tab key="colors" title="Colors">
              <ColorsTab />
            </Tab>
          </Tabs>
        </CardBody>
      </Card>
    </div>
  );
}
