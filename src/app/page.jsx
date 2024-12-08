"use client";

import { useState, useEffect } from "react";
import { Card, CardBody, Spinner } from "@nextui-org/react";
import useArkStore from "@/store/arkStore";
import Header from "@/components/Header";
import ScrapingProgress from "@/components/ScrapingProgress";
import DataTabs from "@/components/DataTabs";

export default function Home() {
  const { loadData, loading, scraping, scrapingProgress, arkData } =
    useArkStore();
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

      {scraping && (
        <Card>
          <CardBody>
            <ScrapingProgress {...scrapingProgress} />
          </CardBody>
        </Card>
      )}

      <Card>
        <CardBody>
          <DataTabs
            arkData={arkData}
            selected={selected}
            onSelectionChange={setSelected}
          />
        </CardBody>
      </Card>
    </div>
  );
}
