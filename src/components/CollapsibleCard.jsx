import React, { useState } from "react";
import { Card, CardBody, Button } from "@nextui-org/react";
import { ChevronDown, ChevronUp } from "lucide-react";

const CollapsibleCard = ({
  children,
  title = "Add New Entry",
  className = "",
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className={className}>
      <CardBody>
        <div className="flex flex-col gap-4">
          <Button
            variant="light"
            className="w-full flex justify-between"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <span>{title}</span>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>

          <div
            className={`transition-all duration-200 overflow-hidden ${
              isExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            {children}
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

export default CollapsibleCard;
