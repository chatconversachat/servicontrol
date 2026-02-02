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
    TrendingDown,
    TrendingUp,
    Users,
    Wallet,
    Hammer,
    Receipt,
    ArrowRight,
    Calculator,
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
    Legend
} from 'recharts';

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

    const totalPaidToContractor = service.contractorPayments?.reduce((sum, p) => sum + p.value, 0) || 0;

    // Agrupar custos por categoria para o gráfico
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

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-5xl bg-slate-50 border-none shadow-2xl p-0 overflow-hidden flex flex-col max-h-[95vh]">
                {/* Header Profissional */}
                <div className="bg-primary p-6 text-white shrink-0 shadow-lg">
                    <DialogHeader>
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-primary-foreground/70 text-xs font-mono mb-1">{service.code}</p>
                                <DialogTitle className="text-2xl font-black truncate max-w-[500px] leading-tight text-white mb-2">
                                    {service.client}
                                </DialogTitle>
                                {service.address && (
                                    <p className="text-sm text-white/80 font-medium mb-2 flex items-center gap-1">
                                        <span className="opacity-60">Endereço:</span> {service.address}
                                    </p>
                                )}
                                <div className="flex items-center gap-2">
                                    <StatusBadge status={service.status} />
                                    <span className="text-xs text-white/60">• Criado em {formatDate(service.createdAt)}</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-bold text-white/60 uppercase tracking-tighter">Resultado Líquido</p>
                                <p className="text-3xl font-black text-white">{formatCurrency(profit)}</p>
                            </div>
                        </div>
                    </DialogHeader>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto">
                    {/* EQUAÇÃO FINANCEIRA */}
                    <div className="bg-white p-6 rounded-3xl border shadow-sm space-y-4">
                        <h3 className="text-xs font-black flex items-center gap-2 uppercase tracking-widest text-slate-800">
                            <Calculator className="h-4 w-4 text-primary" /> Equação Financeira da Obra
                        </h3>

                        <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-2">
                            <div className="flex-1 w-full p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center">
                                <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Valor Fechado</p>
                                <p className="text-xl font-black text-slate-900">{formatCurrency(budgetValue)}</p>
                            </div>
                            <Minus className="h-5 w-5 text-slate-300 shrink-0" />
                            <div className="flex-1 w-full p-4 bg-red-50 rounded-2xl border border-dashed border-red-100 text-center">
                                <p className="text-[10px] text-red-400 uppercase font-bold mb-1">Total Custos Abatidos</p>
                                <p className="text-xl font-black text-red-600">{formatCurrency(totalCosts)}</p>
                            </div>
                            <Equal className="h-5 w-5 text-slate-300 shrink-0" />
                            <div className="flex-1 w-full p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-center ring-2 ring-emerald-500/20">
                                <p className="text-[10px] text-emerald-500 uppercase font-bold mb-1">Saldo Líquido</p>
                                <p className="text-xl font-black text-emerald-600">{formatCurrency(profit)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* GRÁFICO DE CUSTOS POR CATEGORIA */}
                        <div className="bg-white p-6 rounded-3xl border shadow-sm space-y-4 col-span-1 lg:col-span-1">
                            <h3 className="text-xs font-black flex items-center gap-2 uppercase tracking-widest text-slate-800">
                                <PieChartIcon className="h-4 w-4 text-amber-500" /> Distribuição de Custos
                            </h3>
                            {categoryData.length > 0 ? (
                                <>
                                    <div className="h-[220px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={categoryData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={45}
                                                    outerRadius={65}
                                                    paddingAngle={4}
                                                    dataKey="value"
                                                >
                                                    {categoryData.map((_, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="space-y-1">
                                        {categoryData.map((cat, idx) => (
                                            <div key={idx} className="flex justify-between items-center text-[10px]">
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                                                    <span className="font-bold text-slate-600 truncate max-w-[100px]">{cat.name}</span>
                                                </div>
                                                <span className="font-black text-slate-900">{cat.percent.toFixed(1)}%</span>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <p className="text-xs text-muted-foreground italic py-12 text-center">Sem dados de custos categorizados.</p>
                            )}
                        </div>

                        {/* DETALHAMENTO DE CUSTOS (LISTA) */}
                        <div className="bg-white p-6 rounded-3xl border shadow-sm space-y-4 col-span-1 lg:col-span-1">
                            <h3 className="text-xs font-black flex items-center gap-2 uppercase tracking-widest text-slate-800">
                                <Receipt className="h-4 w-4 text-red-500" /> Lista de Despesas
                            </h3>
                            <div className="space-y-1.5 max-h-[350px] overflow-y-auto pr-1">
                                {service.expenses && service.expenses.length > 0 ? (
                                    service.expenses.map((e, i) => (
                                        <div key={i} className="flex flex-col p-2 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-100 group">
                                            <div className="flex justify-between items-center mb-0.5">
                                                <span className="font-bold text-slate-400 text-[9px]">{e.date}</span>
                                                <span className="font-black text-slate-900 text-xs">{formatCurrency(e.value)}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-slate-700 truncate font-medium text-[11px]">{e.description}</span>
                                                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 font-bold uppercase">{e.category}</span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-xs text-muted-foreground italic py-8 text-center">Nenhum custo listado.</p>
                                )}
                            </div>
                        </div>

                        {/* DISTRIBUIÇÃO DE SÓCIOS */}
                        <div className="bg-slate-900 rounded-3xl p-7 text-white flex flex-col col-span-1 lg:col-span-1">
                            <h3 className="text-[10px] font-black flex items-center gap-2 uppercase tracking-[0.2em] text-primary/60 mb-6">
                                <Users className="h-4 w-4" /> Distribuição (Sócios)
                            </h3>

                            <div className="space-y-3 flex-1">
                                {distributions.map(dist => (
                                    <div key={dist.name} className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/5">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center font-black text-primary text-xs">
                                                {dist.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-white">{dist.name}</p>
                                                <p className="text-[9px] font-bold text-white/40 uppercase">{dist.percent}%</p>
                                            </div>
                                        </div>
                                        <p className="text-sm font-black text-white">{formatCurrency(dist.value)}</p>
                                    </div>
                                ))}

                                <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20 flex items-center justify-between mt-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-lg bg-blue-500 flex items-center justify-center">
                                            <Wallet className="h-4 w-4 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-white">Giro</p>
                                            <p className="text-[9px] font-bold text-blue-400 uppercase">14%</p>
                                        </div>
                                    </div>
                                    <p className="text-sm font-black text-blue-400">{formatCurrency(workingCapital)}</p>
                                </div>
                            </div>

                            <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center text-emerald-400">
                                <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Saldo Final</span>
                                <div className="flex items-center gap-2">
                                    <ArrowRight className="h-4 w-4" />
                                    <span className="text-xl font-black">{formatCurrency(profit)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
