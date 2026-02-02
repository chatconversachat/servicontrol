import React from 'react';
import { useFilters } from '@/contexts/FilterContext';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from '@/lib/utils';

const months = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];

export const SmartFilters: React.FC = () => {
    const {
        selectedYear,
        setSelectedYear,
        selectedMonth,
        setSelectedMonth,
        availableYears
    } = useFilters();

    return (
        <div className="flex flex-col gap-4 bg-card p-4 rounded-xl border shadow-sm mb-6">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Ano:</span>
                    <Select
                        value={selectedYear.toString()}
                        onValueChange={(val) => setSelectedYear(parseInt(val))}
                    >
                        <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="Ano" />
                        </SelectTrigger>
                        <SelectContent>
                            {availableYears.sort((a, b) => b - a).map(year => (
                                <SelectItem key={year} value={year.toString()}>
                                    {year}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="hidden md:flex items-center gap-1 bg-muted p-1 rounded-lg">
                    <Button
                        variant={selectedMonth === 'all' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setSelectedMonth('all')}
                        className="px-4"
                    >
                        Todos
                    </Button>
                    {months.map((month, index) => (
                        <Button
                            key={month}
                            variant={selectedMonth === index ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setSelectedMonth(index)}
                            className={cn(
                                "px-3 min-w-[50px]",
                                selectedMonth === index ? "shadow-sm" : ""
                            )}
                        >
                            {month}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Mobile Month Tabs */}
            <div className="flex md:hidden overflow-x-auto gap-2 pb-2 scrollbar-none">
                <Button
                    variant={selectedMonth === 'all' ? 'default' : 'secondary'}
                    size="sm"
                    onClick={() => setSelectedMonth('all')}
                    className="whitespace-nowrap"
                >
                    Todos
                </Button>
                {months.map((month, index) => (
                    <Button
                        key={month}
                        variant={selectedMonth === index ? 'default' : 'secondary'}
                        size="sm"
                        onClick={() => setSelectedMonth(index)}
                        className="whitespace-nowrap"
                    >
                        {month}
                    </Button>
                ))}
            </div>
        </div>
    );
};
