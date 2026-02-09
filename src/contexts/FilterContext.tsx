import React, { createContext, useContext, useState, useEffect } from 'react';

interface FilterContextType {
    selectedYear: number;
    setSelectedYear: (year: number) => void;
    selectedMonth: number | 'all'; // 0-11 for months, or 'all'
    setSelectedMonth: (month: number | 'all') => void;
    availableYears: number[];
    setAvailableYears: (years: number[]) => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const FilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState<number | 'all'>(new Date().getMonth());
    const [availableYears, setAvailableYears] = useState<number[]>([new Date().getFullYear()]);

    return (
        <FilterContext.Provider value={{
            selectedYear,
            setSelectedYear,
            selectedMonth,
            setSelectedMonth,
            availableYears,
            setAvailableYears
        }}>
            {children}
        </FilterContext.Provider>
    );
};

export const useFilters = () => {
    const context = useContext(FilterContext);
    if (context === undefined) {
        throw new Error('useFilters must be used within a FilterProvider');
    }
    return context;
};
