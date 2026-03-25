import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  AreaChart,
  Area,
} from 'recharts';

const COLORS = [
  'hsl(221, 83%, 53%)',
  'hsl(160, 84%, 39%)',
  'hsl(38, 92%, 50%)',
  'hsl(280, 65%, 60%)',
  'hsl(340, 75%, 55%)',
  'hsl(200, 70%, 50%)',
  'hsl(120, 60%, 45%)',
  'hsl(15, 80%, 55%)',
];

const tooltipStyle = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
};

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="text-base font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

const currencyFormatter = (value: number) => {
  if (value >= 1000) return `R$${(value / 1000).toFixed(0)}k`;
  return `R$${value.toFixed(0)}`;
};

const tooltipFormatter = (value: number) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, ''];

interface MonthlyDataPoint {
  name: string;
  received: number;
  pending: number;
  costs?: number;
  count?: number;
}

export function ReceivedVsPendingChart({ data }: { data: MonthlyDataPoint[] }) {
  return (
    <ChartCard title="Recebido vs A Receber por Mês">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="name" className="text-xs" tick={{ fontSize: 11 }} />
          <YAxis className="text-xs" tickFormatter={currencyFormatter} />
          <Tooltip formatter={tooltipFormatter} contentStyle={tooltipStyle} />
          <Legend />
          <Bar dataKey="received" name="Pago" fill="hsl(160, 84%, 39%)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="pending" name="A Receber" fill="hsl(38, 92%, 50%)" radius={[4, 4, 0, 0]} />
          {data.some(d => (d.costs ?? 0) > 0) && (
            <Bar dataKey="costs" name="Custos" fill="hsl(0, 72%, 51%)" radius={[4, 4, 0, 0]} />
          )}
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function MonthlyEvolutionChart({ data }: { data: MonthlyDataPoint[] }) {
  const totalData = data.map((item) => ({
    ...item,
    total: item.received + item.pending,
    lucro: (item.received + item.pending) - (item.costs || 0),
  }));

  return (
    <ChartCard title="Evolução Mensal">
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={totalData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorLucro" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="name" className="text-xs" tick={{ fontSize: 11 }} />
          <YAxis className="text-xs" tickFormatter={currencyFormatter} />
          <Tooltip formatter={tooltipFormatter} contentStyle={tooltipStyle} />
          <Legend />
          <Area
            type="monotone"
            dataKey="total"
            name="Faturamento"
            stroke="hsl(221, 83%, 53%)"
            fill="url(#colorTotal)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="lucro"
            name="Saldo Líquido"
            stroke="hsl(160, 84%, 39%)"
            fill="url(#colorLucro)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function ClientDistributionChart({ data }: { data: { name: string; value: number }[] }) {
  return (
    <ChartCard title="Distribuição por Cliente/Imobiliária">
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={95}
            paddingAngle={2}
            dataKey="value"
            label={({ name, percent }) => `${name.substring(0, 15)}${name.length > 15 ? '..' : ''} (${(percent * 100).toFixed(0)}%)`}
            labelLine={false}
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, '']}
            contentStyle={tooltipStyle}
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function CostsBreakdownChart({ data }: { data: { name: string; value: number }[] }) {
  return (
    <ChartCard title="Custos por Categoria">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis type="number" tickFormatter={currencyFormatter} className="text-xs" />
          <YAxis type="category" dataKey="name" width={90} className="text-xs" tick={{ fontSize: 11 }} />
          <Tooltip formatter={tooltipFormatter} contentStyle={tooltipStyle} />
          <Bar dataKey="value" name="Custo" fill="hsl(0, 72%, 51%)" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
