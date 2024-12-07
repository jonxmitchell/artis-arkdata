// src/components/Header.jsx
import { Button, Card, CardBody } from "@nextui-org/react";
import { Database, RefreshCw } from "lucide-react";
import useArkStore from "@/store/arkStore";
import DataControls from "./DataControls";

const Header = () => {
  const { startScraping, scraping, error } = useArkStore();

  return (
    <Card>
      <CardBody>
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Database className="w-6 h-6" />
              <h1 className="text-xl font-bold">ARK Data Manager</h1>
            </div>

            <div className="flex items-center gap-4">
              <DataControls />
              <Button
                color="primary"
                startContent={
                  <RefreshCw
                    className={`w-4 h-4 ${scraping ? "animate-spin" : ""}`}
                  />
                }
                onClick={startScraping}
                isDisabled={scraping}
              >
                {scraping ? "Scraping..." : "Update Data"}
              </Button>
            </div>
          </div>

          {error && (
            <div className="mt-2 text-danger text-sm">Error: {error}</div>
          )}
        </div>
      </CardBody>
    </Card>
  );
};

export default Header;
