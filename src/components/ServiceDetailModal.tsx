import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Service } from '@/types';
import { formatCurrency, formatDate } from '@/lib/data';
import { StatusBadge } from '@/components/StatusBadge';
import {
    Users,
    Wallet,
    Receipt,
    ArrowRight,
    Minus,
    Equal,
    PieChart as PieChartIcon
} from 'lucide-react';
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import { cn } from '@/lib/utils';

interface ServiceDetailModalProps {
    service: Service | null;
    isOpen: boolean;
    onClose: () => void;
}

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899'];

export const ServiceDetailModal: React.FC<ServiceDetailModalProps> = ({
    service,
    isOpen,
    onClose,
}) => {
    if (!service) return null;

    const budgetValue = service.value || 0;
    const totalCosts = service.costs || 0;
    const profit = budgetValue - totalCosts;

    const distributions = [
        { name: 'Fabrício', percent: 20, value: profit > 0 ? profit * 0.20 : 0 },
        { name: 'Éder', percent: 28, value: profit > 0 ? profit * 0.28 : 0 },
        { name: 'Rogerio', percent: 28, value: profit > 0 ? profit * 0.28 : 0 },
        { name: 'Gabi', percent: 10, value: profit > 0 ? profit * 0.10 : 0 },
    ];
    const workingCapital = profit > 0 ? profit * 0.14 : 0;

    const getCategoryData = () => {
        if (!service.expenses) return [];
        const categories: Record<string, number> = {};
        service.expenses.forEach(exp => {
            const cat = exp.category || 'Extras';
            categories[cat] = (categories[cat] || 0) + exp.value;
        });
        return Object.entries(categories).map(([name, value]) => ({
            name,
            value,
            percent: totalCosts > 0 ? (value / totalCosts) * 100 : 0
        })).sort((a, b) => b.value - a.value);
    };

    const categoryData = getCategoryData();
    const hasExpenses = service.expenses && service.expenses.length > 0;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-6xl bg-background border shadow-2xl p-0 overflow-y-auto max-h-[95vh]">
                {/* Compact Header */}
                <div className="bg-primary px-4 py-3 text-primary-foreground">
                    <DialogHeader>
                        <div className="flex justify-between items-center">
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <span className="text-primary-foreground/60 text-[10px] font-mono">{service.code}</span>
                                    <StatusBadge status={service.status} className="scale-90" />
                                    <span className="text-[9px] text-primary-foreground/50">Criado {formatDate(service.createdAt)}</span>
                                </div>
                                <DialogTitle className="text-lg font-bold truncate text-primary-foreground leading-tight">
                                    {service.client}
                                </DialogTitle>
                                {service.address && (
                                    <p className="text-[10px] text-primary-foreground/60 truncate mt-0.5">{service.address}</p>
                                )}
                            </div>
                            <div className="text-right pl-4">
                                <p className="text-[8px] font-bold text-primary-foreground/50 uppercase tracking-wider">Resultado</p>
                                <p className={cn("text-2xl font-black", profit >= 0 ? "text-primary-foreground" : "text-red-300")}>
                                    {formatCurrency(profit)}
                                </p>
                            </div>
                        </div>
                    </DialogHeader>
                </div>

                {/* Body - No scroll, everything fits */}
                <div className="p-3 space-y-3">
                    {/* Financial Equation - Compact inline */}
                    <div className="flex items-center gap-2 bg-muted/30 rounded-xl p-2.5 border">
                        <div className="flex-1 text-center p-2 bg-card rounded-lg border">
                            <p className="text-[8px] text-muted-foreground uppercase font-bold">Valor Fechado</p>
                            <p className="text-sm font-black">{formatCurrency(budgetValue)}</p>
                        </div>
                        <Minus className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <div className="flex-1 text-center p-2 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-100 dark:border-red-900/30">
                            <p className="text-[8px] text-red-500 uppercase font-bold">Custos</p>
                            <p className="text-sm font-black text-red-600">{formatCurrency(totalCosts)}</p>
                        </div>
                        <Equal className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <div className="flex-1 text-center p-2 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-900/30 ring-1 ring-emerald-500/20">
                            <p className="text-[8px] text-emerald-500 uppercase font-bold">Saldo</p>
                            <p className="text-sm font-black text-emerald-600">{formatCurrency(profit)}</p>
                        </div>
                    </div>

                    {/* Main Grid: 3 columns */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {/* Col 1: Cost Chart + Category list */}
                        <div className="bg-card rounded-xl border p-3 space-y-2">
                            <h3 className="text-[9px] font-bold flex items-center gap-1.5 uppercase tracking-wider text-muted-foreground">
                                <PieChartIcon className="h-3 w-3 text-amber-500" /> Custos por Categoria
                            </h3>
                            {categoryData.length > 0 ? (
                                <>
                                    <div className="h-[120px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={30} outerRadius={50} paddingAngle={3} dataKey="value">
                                                    {categoryData.map((_, i) => (
                                                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="space-y-0.5">
                                        {categoryData.map((cat, i) => (
                                            <div key={i} className="flex justify-between items-center text-[9px] py-0.5">
                                                <div className="flex items-center gap-1">
                                                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                                    <span className="text-muted-foreground truncate max-w-[80px]">{cat.name}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="font-bold">{formatCurrency(cat.value)}</span>
                                                    <span className="text-muted-foreground">{cat.percent.toFixed(0)}%</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <p className="text-[10px] text-muted-foreground italic text-center py-6">Sem dados</p>
                            )}
                        </div>

                        {/* Col 2: Expenses List */}
                        <div className="bg-card rounded-xl border p-3 space-y-2">
                            <h3 className="text-[9px] font-bold flex items-center gap-1.5 uppercase tracking-wider text-muted-foreground">
                                <Receipt className="h-3 w-3 text-red-500" /> Despesas ({service.expenses?.length || 0})
                            </h3>
                            {hasExpenses ? (
                                <div className="space-y-0.5 max-h-[220px] overflow-y-auto pr-0.5">
                                    {service.expenses!.map((e, i) => (
                                        <div key={i} className="flex justify-between items-center py-1 px-1.5 hover:bg-muted/50 rounded text-[10px] border-b border-muted last:border-0">
                                            <div className="min-w-0 flex-1">
                                                <p className="font-medium truncate">{e.description}</p>
                                                <div className="flex items-center gap-1">
                                                    <span className="text-[8px] text-muted-foreground">{e.date}</span>
                                                    {e.category && (
                                                        <span className="text-[7px] px-1 py-px rounded bg-muted text-muted-foreground uppercase">{e.category}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <span className="font-bold text-red-600 ml-2 shrink-0">{formatCurrency(e.value)}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-[10px] text-muted-foreground italic text-center py-6">Nenhuma despesa</p>
                            )}
                        </div>

                        {/* Col 3: Partner Distribution */}
                        <div className="bg-slate-900 dark:bg-slate-950 rounded-xl p-3 text-white space-y-2">
                            <h3 className="text-[9px] font-bold flex items-center gap-1.5 uppercase tracking-wider text-primary/50">
                                <Users className="h-3 w-3" /> Distribuição
                            </h3>
                            <div className="space-y-1.5">
                                {distributions.map(dist => (
                                    <div key={dist.name} className="flex items-center justify-between p-2 bg-white/5 rounded-lg border border-white/5">
                                        <div className="flex items-center gap-2">
                                            <div className="h-6 w-6 rounded bg-primary/20 flex items-center justify-center font-bold text-primary text-[10px]">
                                                {dist.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold">{dist.name}</p>
                                                <p className="text-[8px] text-white/40">{dist.percent}%</p>
                                            </div>
                                        </div>
                                        <p className="text-xs font-bold">{formatCurrency(dist.value)}</p>
                                    </div>
                                ))}
                                <div className="flex items-center justify-between p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                                    <div className="flex items-center gap-2">
                                        <div className="h-6 w-6 rounded bg-blue-500 flex items-center justify-center">
                                            <Wallet className="h-3 w-3 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold">Giro</p>
                                            <p className="text-[8px] text-blue-400">14%</p>
                                        </div>
                                    </div>
                                    <p className="text-xs font-bold text-blue-400">{formatCurrency(workingCapital)}</p>
                                </div>
                            </div>
                            <div className="pt-2 border-t border-white/10 flex justify-between items-center text-emerald-400">
                                <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest">Saldo Final</span>
                                <div className="flex items-center gap-1">
                                    <ArrowRight className="h-3 w-3" />
                                    <span className="text-base font-black">{formatCurrency(profit)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
