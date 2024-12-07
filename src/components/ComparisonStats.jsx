import { Card, CardBody } from "@nextui-org/react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const ComparisonStats = ({ stats }) => {
  const chartData = Object.entries(stats).map(([category, data]) => ({
    name: category.charAt(0).toUpperCase() + category.slice(1),
    Added: data.added,
    Removed: data.removed,
    Modified: data.modified,
  }));

  const getPercentageData = Object.entries(stats).map(([category, data]) => {
    const total = data.added + data.removed + data.modified;
    return {
      name: category.charAt(0).toUpperCase() + category.slice(1),
      Added: ((data.added / total) * 100).toFixed(1),
      Removed: ((data.removed / total) * 100).toFixed(1),
      Modified: ((data.modified / total) * 100).toFixed(1),
    };
  });

  return (
    <Card className="mb-4">
      <CardBody>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-64">
            <h4 className="text-center mb-2">Changes by Category</h4>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Added" fill="#22c55e" />
                <Bar dataKey="Removed" fill="#ef4444" />
                <Bar dataKey="Modified" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="h-64">
            <h4 className="text-center mb-2">Change Distribution (%)</h4>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={getPercentageData}>
                <XAxis dataKey="name" />
                <YAxis unit="%" />
                <Tooltip formatter={(value) => `${value}%`} />
                <Legend />
                <Bar dataKey="Added" fill="#22c55e" stackId="a" />
                <Bar dataKey="Removed" fill="#ef4444" stackId="a" />
                <Bar dataKey="Modified" fill="#f59e0b" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

export default ComparisonStats;
