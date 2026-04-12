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
        <div className="flex flex-col gap-3 bg-card p-3 md:p-4 rounded-xl border shadow-sm mb-4 md:mb-6">
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <span className="text-xs md:text-sm font-medium text-muted-foreground">Ano:</span>
                    <Select
                        value={selectedYear.toString()}
                        onValueChange={(val) => setSelectedYear(parseInt(val))}
                    >
                        <SelectTrigger className="w-[100px] md:w-[120px] h-8 md:h-9 text-xs md:text-sm">
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

                <div className="hidden lg:flex items-center gap-1 bg-muted p-1 rounded-lg">
                    <Button
                        variant={selectedMonth === 'all' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setSelectedMonth('all')}
                        className="px-3 h-7 text-xs"
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
                                "px-2 min-w-[40px] h-7 text-xs",
                                selectedMonth === index ? "shadow-sm" : ""
                            )}
                        >
                            {month}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Mobile/Tablet Month Scroll */}
            <div className="flex lg:hidden overflow-x-auto gap-1.5 pb-1 -mx-1 px-1 scrollbar-none">
                <Button
                    variant={selectedMonth === 'all' ? 'default' : 'secondary'}
                    size="sm"
                    onClick={() => setSelectedMonth('all')}
                    className="whitespace-nowrap h-7 text-xs px-3 flex-shrink-0"
                >
                    Todos
                </Button>
                {months.map((month, index) => (
                    <Button
                        key={month}
                        variant={selectedMonth === index ? 'default' : 'secondary'}
                        size="sm"
                        onClick={() => setSelectedMonth(index)}
                        className="whitespace-nowrap h-7 text-xs px-3 flex-shrink-0"
                    >
                        {month}
                    </Button>
                ))}
            </div>
        </div>
    );
};
