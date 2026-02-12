import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { motion, AnimatePresence } from "framer-motion";
import { fadeIn } from "../../lib/animations";
import { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface Column<T> {
    header: string;
    accessorKey: keyof T | string;
    cell?: (item: T) => ReactNode;
    sortable?: boolean;
}

interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    loading?: boolean;
    onRowClick?: (item: T) => void;
    emptyMessage?: string;
    rowKey?: (item: T) => string | number;
}

export default function DataTable<T>({
    columns,
    data = [],
    loading = false,
    onRowClick,
    emptyMessage = "No data available",
    rowKey,
}: DataTableProps<T>) {
    const dataArray = Array.isArray(data) ? data : [];

    if (loading) {
        return (
            <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
            </div>
        );
    }

    const getItemKey = (item: T, index: number) => {
        if (rowKey) return rowKey(item);
        const anyItem = item as any;
        return anyItem.id || anyItem._id || index;
    };

    return (
        <div className="rounded-xl border border-border overflow-hidden bg-card">
            <Table>
                <TableHeader className="bg-muted/50">
                    <TableRow className="hover:bg-transparent border-border">
                        {columns.map((column, idx) => (
                            <TableHead key={idx} className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider py-4">
                                {column.header}
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <AnimatePresence mode="wait">
                        {dataArray.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-40 text-center text-muted-foreground italic">
                                    {emptyMessage}
                                </TableCell>
                            </TableRow>
                        ) : (
                            dataArray.map((item, rowIdx) => (
                                <motion.tr
                                    key={getItemKey(item, rowIdx)}
                                    variants={fadeIn}
                                    initial="initial"
                                    animate="animate"
                                    transition={{ delay: rowIdx * 0.05 }}
                                    className={`group transition-colors hover:bg-accent cursor-pointer border-b border-border last:border-0`}
                                    onClick={() => onRowClick?.(item)}
                                >
                                    {columns.map((column, colIdx) => (
                                        <TableCell key={colIdx} className="py-4 text-sm text-foreground">
                                            {column.cell ? column.cell(item) : (<span className="font-medium">{(item[column.accessorKey as keyof T] as ReactNode)}</span>)}
                                        </TableCell>
                                    ))}
                                </motion.tr>
                            ))
                        )}
                    </AnimatePresence>
                </TableBody>
            </Table>
        </div>
    );
}
