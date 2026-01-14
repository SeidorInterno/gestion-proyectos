"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";

interface ResourceData {
  name: string;
  utilizacion: number;
}

interface ResourceUtilizationChartProps {
  data: ResourceData[];
}

const getBarColor = (value: number) => {
  if (value > 100) return "#ef4444"; // Red - over-allocated
  if (value >= 80) return "#22c55e"; // Green - well utilized
  if (value >= 50) return "#3b82f6"; // Blue - moderately utilized
  return "#94a3b8"; // Gray - under-utilized
};

export function ResourceUtilizationChart({ data }: ResourceUtilizationChartProps) {
  // Sort by utilization descending
  const sortedData = [...data].sort((a, b) => b.utilizacion - a.utilizacion);

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={sortedData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
          <XAxis
            type="number"
            domain={[0, Math.max(120, ...sortedData.map((d) => d.utilizacion))]}
            tickFormatter={(value) => `${value}%`}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={80}
            tick={{ fontSize: 12 }}
          />
          <Tooltip
            formatter={(value: number) => [`${value}%`, "Utilizacion"]}
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            }}
          />
          <ReferenceLine
            x={100}
            stroke="#ef4444"
            strokeDasharray="3 3"
            label={{
              value: "100%",
              position: "top",
              fill: "#ef4444",
              fontSize: 12,
            }}
          />
          <Bar dataKey="utilizacion" radius={[0, 4, 4, 0]}>
            {sortedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.utilizacion)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="flex justify-center gap-6 mt-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-red-500" />
          <span className="text-muted-foreground">Sobre-asignado (&gt;100%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-500" />
          <span className="text-muted-foreground">Optimo (80-100%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-blue-500" />
          <span className="text-muted-foreground">Moderado (50-80%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-slate-400" />
          <span className="text-muted-foreground">Disponible (&lt;50%)</span>
        </div>
      </div>
    </div>
  );
}
