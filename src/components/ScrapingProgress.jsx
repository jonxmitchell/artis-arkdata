// src/components/ScrapingProgress.jsx
import { Progress, Card, CardBody } from "@nextui-org/react";

const ScrapingProgress = ({ stage, progress, message }) => {
  const stageColors = {
    creatures: "primary",
    items: "secondary",
    engrams: "success",
    complete: "success",
  };

  return (
    <Card>
      <CardBody>
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <span className="capitalize">{stage}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress
            value={progress}
            color={stageColors[stage] || "default"}
            className="w-full"
          />
          <span className="text-sm text-gray-500">{message}</span>
        </div>
      </CardBody>
    </Card>
  );
};

export default ScrapingProgress;
