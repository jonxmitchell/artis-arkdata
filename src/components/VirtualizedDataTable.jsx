import React, { useMemo } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Card,
  ScrollShadow,
} from "@nextui-org/react";
import AutoSizer from "react-virtualized-auto-sizer";
import { FixedSizeList as List } from "react-window";

const VirtualizedDataTable = ({
  data,
  columns,
  rowHeight = 100,
  actions,
  className,
}) => {
  const [virtualScrollEnabled, setVirtualScrollEnabled] = React.useState(false);

  React.useEffect(() => {
    setVirtualScrollEnabled(data.length > 100);
  }, [data.length]);

  const Row = React.memo(({ index, style }) => {
    const item = data[index];

    return (
      <TableRow key={index} style={style}>
        {columns.map((column) => (
          <TableCell key={column.uid}>
            {column.renderCell ? column.renderCell(item) : item[column.uid]}
          </TableCell>
        ))}
        {actions && <TableCell>{actions(item)}</TableCell>}
      </TableRow>
    );
  });

  return (
    <Card className={className}>
      <ScrollShadow className="h-[65vh]" visibility="bottom" hideScrollBar>
        <Table
          aria-label="Data table"
          isHeaderSticky={true}
          removeWrapper
          classNames={{
            wrapper: "min-h-[400px]",
          }}
        >
          <TableHeader columns={columns}>
            {(column) => (
              <TableColumn key={column.uid}>{column.name}</TableColumn>
            )}
          </TableHeader>
          <TableBody items={data}>
            {(item) => (
              <TableRow key={item.key}>
                {(columnKey) => (
                  <TableCell>
                    {columns
                      .find((col) => col.uid === columnKey)
                      ?.renderCell?.(item) || item[columnKey]}
                  </TableCell>
                )}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </ScrollShadow>
    </Card>
  );
};

export default React.memo(VirtualizedDataTable);
