"use client";

import { bulkDeleteTransactions } from '@/actions/accounts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { getCategoryColor, getCategoryName, normalizeCategoryId } from '@/data/categories';
import useFetch from '@/hooks/use-fetch';
import { TooltipProvider } from '@radix-ui/react-tooltip';
import { format } from 'date-fns';
import { ChevronUp, ChevronDown, Clock, MoreHorizontal, RefreshCw, Search, Trash, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { BarLoader } from 'react-spinners';
import { toast } from 'sonner';



const RECURRING_INTERVALS = {
    DAILY: "Daily",
    WEEKLY: "Weekly",
    MONTHLY: "Monthly",
    YEARLY: "Yearly",
};


export const TransactionTable = ({ transactions }) => {


    const router = useRouter();
    const [selectedIds, setSelectedIds] = useState([]);
    const [sortConfig, setSortConfig] = useState({
        field: "date",
        direction: "desc",
    });


    const [searchTerm, setSearchTerm] = useState("");
    const [typeFilter, setTypeFilter] = useState("");
    const [recurringFilter, setRecurringFilter] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const deferredSearchTerm = useDeferredValue(searchTerm);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    // const [currentPage, setCurrentPage] = useState(1);

    const {
        loading: deleteLoading,
        fn: deleteFn,
        data: deleted,
    } = useFetch(bulkDeleteTransactions)




    const availableCategories = useMemo(() => {
        const categories = new Map();
        transactions.forEach((transaction) => {
            const categoryId = normalizeCategoryId(transaction.category);
            if (!categories.has(categoryId)) {
                categories.set(categoryId, getCategoryName(categoryId));
            }
        });

        return Array.from(categories.entries())
            .map(([id, name]) => ({ id, name }))
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [transactions]);

    const filteredAndSortedTransactions = useMemo(() => {
        let result = [...transactions];
        //Apply search Filters
        if (deferredSearchTerm) {
            const searchLower = deferredSearchTerm.toLowerCase();
            result = result.filter((transaction) => transaction.description?.toLowerCase().includes(searchLower));
        }


        if (recurringFilter) {
            result = result.filter((transaction) => {
                if (recurringFilter === "recurring") return transaction.isRecurring;
                return !transaction.isRecurring;
            });
        }

        //Apply type filter
        if (typeFilter) {
            result = result.filter((transaction) => transaction.type === typeFilter);
        }

        if (categoryFilter !== "all") {
            result = result.filter(
                (transaction) => normalizeCategoryId(transaction.category) === categoryFilter
            );
        }

        //Apply sorting
        result.sort((a, b) => {
            let comparison = 0

            switch (sortConfig.field) {
                case "date":
                    comparison = new Date(a.date) - new Date(b.date)
                    break;

                case "amount":
                    comparison = a.amount - b.amount;
                    break;

                case "category":
                    comparison = getCategoryName(a.category).localeCompare(getCategoryName(b.category));
                    break;

                default:
                    comparison = 0;
            }

            return sortConfig.direction === "asc" ? comparison : -comparison;
        });

        return result;
    }, [
        transactions, deferredSearchTerm, typeFilter, recurringFilter, categoryFilter, sortConfig,
    ]);

    const totalPages = Math.max(1, Math.ceil(filteredAndSortedTransactions.length / rowsPerPage));

    const paginatedTransactions = useMemo(() => {
        const startIndex = (currentPage - 1) * rowsPerPage;
        return filteredAndSortedTransactions.slice(startIndex, startIndex + rowsPerPage);
    }, [filteredAndSortedTransactions, currentPage, rowsPerPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [deferredSearchTerm, typeFilter, recurringFilter, categoryFilter, sortConfig, rowsPerPage]);

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);


    const handleSort = (field) => {
        setSortConfig((current) => ({
            field,
            direction:
                current.field == field && current.direction === "asc" ? "desc" : "asc",
        }));
    };

    const handleSelect = (id) => {
        setSelectedIds((current) => current.includes(id) ? current.filter((item) => item != id) :
            [...current, id]);
    };


    const handleSelectAll = () => {
        const currentPageIds = paginatedTransactions.map((t) => t.id);
        const allCurrentPageSelected = currentPageIds.every((id) => selectedIds.includes(id));

        setSelectedIds((current) =>
            allCurrentPageSelected
                ? current.filter((id) => !currentPageIds.includes(id))
                : [...new Set([...current, ...currentPageIds])]
        );
    };

    const handleBulkDelete = async () => {
        if (
            !window.confirm(
                `Are you sure you want to delete ${selectedIds.length} transactions?`
            )
        ) {
            return;
        }
        deleteFn(selectedIds);
    };


    useEffect(() => {
        if (deleted && !deleteLoading) {
            toast.error("Transactions deleted successfully")
        }
    }, [deleted, deleteLoading]);


    const handleClearFilters = () => {
        setSearchTerm("");
        setTypeFilter("");
        setRecurringFilter("");
        setCategoryFilter("all");
        setSelectedIds([]);
    };



    return (
        <div className='space-y-4'>
            {deleteLoading && (
                <BarLoader className="mt-4" width={"100%"} color="#9333ea" />
            )}
            {/* Filters */}
            <div className='rounded-2xl border border-border/60 bg-white/80 p-4 shadow-sm dark:bg-slate-900/70'>
            <div className='flex flex-col gap-4 sm:flex-row'>
                <div className='relative flex-1'>
                    <Search className='absolute left-2 top-2.5 h-4 w-4 text-muted-foreground' />
                    <Input
                        placeholder="Search transactions..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8" />

                </div>

                <div className='flex gap-2'>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger>
                            <SelectValue placeholder="All Types" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="INCOME">Income</SelectItem>
                            <SelectItem value="EXPENSE">Expense</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={recurringFilter} onValueChange={(value) => setRecurringFilter(value)}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="All Transactions" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="recurring">Recurring Only</SelectItem>
                            <SelectItem value="non-recurring">Non-Recurring Only</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            {availableCategories.map((category) => (
                                <SelectItem key={category.id} value={category.id}>
                                    {category.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {selectedIds.length > 0 && (
                        <div className='flex items-center gap-2'>
                            <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                                <Trash className="h-4 w-4 mr-2" />
                                Delete Selected ({selectedIds.length})
                            </Button>

                        </div>)}


                    {(searchTerm || typeFilter || recurringFilter || categoryFilter !== "all") && (
                        <Button variant="outline
                                " size="icon" onClick={handleClearFilters}
                            title="Clear Filters">
                            <X className="h-4 w-5" />
                        </Button>
                    )}


                </div>


            </div>
            </div>


            {/* Transactions */}
            <div className='overflow-hidden rounded-2xl border border-border/60 bg-white/85 shadow-sm dark:bg-slate-900/70'>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">
                                <Checkbox
                                    onCheckedChange={
                                        handleSelectAll
                                    }
                                    checked={
                                        paginatedTransactions.length > 0 &&
                                        paginatedTransactions.every((t) => selectedIds.includes(t.id))
                                    }
                                />
                            </TableHead>
                            <TableHead className="cursor-pointer"
                                onClick={() => handleSort("date")}
                            >
                                <div className='flex items-center'>Date{" "} {sortConfig.field === "date" && (sortConfig.direction === "asc" ? (<ChevronUp className="ml-1 h-4 w-4" />) : (<ChevronDown className='ml-1 h-4 w-4' />))}
                                </div>
                            </TableHead>

                            <TableHead>
                                Description
                            </TableHead>

                            <TableHead className="cursor-pointer"
                                onClick={() => handleSort("category")}>
                                <div className='flex items-center'>Category
                                    {sortConfig.field === "category" && (sortConfig.direction === "asc" ? (<ChevronUp className="ml-1 h-4 w-4" />) : (<ChevronDown className='ml-1 h-4 w-4' />))}
                                </div></TableHead>


                            <TableHead className="cursor-pointer"
                                onClick={() => handleSort("amount")}>
                                <div className='flex items-center justify-end'>Amount

                                    {sortConfig.field === "amount" && (sortConfig.direction === "asc" ? (<ChevronUp className="ml-1 h-4 w-4" />) : (<ChevronDown className='ml-1 h-4 w-4' />))}
                                </div>
                            </TableHead>

                            <TableHead>Recurring</TableHead>
                            <TableHead className="w-[50px]" />


                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredAndSortedTransactions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center text-muted-foreground">
                                    No transactions found
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedTransactions.map((transaction) => (
                                    <TableRow key={transaction.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40">
                                    <TableCell>
                                        <Checkbox onCheckedChange={() => handleSelect(transaction.id)}
                                            checked={selectedIds.includes(transaction.id)}
                                        />
                                    </TableCell>
                                    <TableCell>{format(new Date(transaction.date), "PP")}</TableCell>
                                    <TableCell>{transaction.description}</TableCell>
                                    <TableCell className="capitalize">
                                        <span style={{
                                            background: getCategoryColor(transaction.category),
                                        }}
                                            className="px-2 py-1 rounded text-white text-sm">
                                            {getCategoryName(transaction.category)}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right" style={{
                                        color: transaction.type === "EXPENSE" ? "red" : "green",
                                    }}>
                                        {transaction.type === 'EXPENSE' ? "-" : "+"}
                                        ₹{transaction.amount.toFixed(2)}</TableCell>

                                    <TableCell>
                                        {transaction.isRecurring ? (
                                            <TooltipProvider >
                                                <Tooltip>
                                                    <TooltipTrigger><Badge variant="outline" className="gap-1 bg-purple-100 text-purple-700 hover:bg-purple-200">
                                                        <RefreshCw className="h-3 w-3" />
                                                        {RECURRING_INTERVALS[transaction.recurringInterval]}
                                                    </Badge></TooltipTrigger>
                                                    <TooltipContent>
                                                        <div className='text-sm'>
                                                            <div className='font-medium'>
                                                                Next Date:
                                                            </div>
                                                            <div>
                                                                {format(new Date(transaction.nextRecurringDate), "PP")}
                                                            </div>
                                                        </div>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        ) : (
                                            <Badge variant="outline" className="gap-1 bg-slate-50 dark:bg-slate-900">
                                                <Clock className="h-3 w-3" />
                                                One-time</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className='h-4 w-4' /></Button></DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                {!transaction.id.startsWith("upi-") && (
                                                    <DropdownMenuItem
                                                        onClick={() =>
                                                            router.push(`/transaction/create?edit=${transaction.id}`)
                                                        }
                                                    >
                                                        Edit
                                                    </DropdownMenuItem>
                                                )}

                                                <DropdownMenuSeparator />
                                                {!transaction.id.startsWith("upi-") && (
                                                    <DropdownMenuItem
                                                        className="text-destructive"
                                                        onClick={() => deleteFn([transaction.id])}
                                                    >
                                                        Delete
                                                    </DropdownMenuItem>
                                                )}
                                                {transaction.id.startsWith("upi-") && (
                                                    <Badge variant="secondary">Imported</Badge>
                                                )}


                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-white/80 p-4 shadow-sm dark:bg-slate-900/70 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Rows per page</span>
                    <Select
                        value={rowsPerPage.toString()}
                        onValueChange={(value) => setRowsPerPage(Number(value))}
                    >
                        <SelectTrigger className="h-8 w-[90px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="5">5</SelectItem>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="25">25</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center gap-3">
                    <p className="text-sm text-muted-foreground">
                        Page {currentPage} of {totalPages}
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                            disabled={currentPage === totalPages}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>

    )
}

export default TransactionTable;
