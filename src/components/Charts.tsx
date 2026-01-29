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
} from 'recharts';
import { ChartData, ClientDistribution } from '@/types';

const COLORS = ['hsl(221, 83%, 53%)', 'hsl(160, 84%, 39%)', 'hsl(38, 92%, 50%)', 'hsl(280, 65%, 60%)', 'hsl(340, 75%, 55%)'];

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
}

function ChartCard({ title, children }: ChartCardProps) {
  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="text-base font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

interface ReceivedVsPendingChartProps {
  data: ChartData[];
}

export function ReceivedVsPendingChart({ data }: ReceivedVsPendingChartProps) {
  return (
    <ChartCard title="Recebido vs A Receber">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="name" className="text-xs" />
          <YAxis className="text-xs" tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`} />
          <Tooltip
            formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, '']}
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
          />
          <Legend />
          <Bar dataKey="received" name="Recebido" fill="hsl(160, 84%, 39%)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="pending" name="A Receber" fill="hsl(38, 92%, 50%)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

interface MonthlyEvolutionChartProps {
  data: ChartData[];
}

export function MonthlyEvolutionChart({ data }: MonthlyEvolutionChartProps) {
  const totalData = data.map((item) => ({
    ...item,
    total: item.received + item.pending,
  }));

  return (
    <ChartCard title="Evolução Mensal">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={totalData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="name" className="text-xs" />
          <YAxis className="text-xs" tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`} />
          <Tooltip
            formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, '']}
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="received"
            name="Recebido"
            stroke="hsl(160, 84%, 39%)"
            strokeWidth={2}
            dot={{ fill: 'hsl(160, 84%, 39%)' }}
          />
          <Line
            type="monotone"
            dataKey="total"
            name="Total"
            stroke="hsl(221, 83%, 53%)"
            strokeWidth={2}
            dot={{ fill: 'hsl(221, 83%, 53%)' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

interface ClientDistributionChartProps {
  data: ClientDistribution[];
}

export function ClientDistributionChart({ data }: ClientDistributionChartProps) {
  return (
    <ChartCard title="Distribuição por Cliente">
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
            labelLine={false}
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, '']}
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
