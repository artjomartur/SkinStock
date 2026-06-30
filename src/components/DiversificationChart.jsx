import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div style={{
        background: 'rgba(20, 20, 20, 0.85)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '8px 12px',
        borderRadius: '8px',
        color: '#fff',
        backdropFilter: 'blur(10px)',
        fontSize: '13px',
        zIndex: 100
      }}>
        <p style={{ margin: 0, fontWeight: 'bold' }}>{data.name}</p>
        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
          €{data.value.toLocaleString(undefined, { maximumFractionDigits: 2 })} ({data.pct.toFixed(1)}%)
        </p>
      </div>
    );
  }
  return null;
};

export default function DiversificationChart({ data }) {
  // data is an array: [{ name: 'Knives', val: 123, color: '#...', pct: 45.5 }, ...]
  const chartData = data.filter(d => d.val > 0).map(d => ({
    name: d.name,
    value: d.val,
    pct: d.pct,
    color: d.color
  }));

  if (chartData.length === 0) return null;

  return (
    <div style={{ width: '100%', height: 220, position: 'relative' }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={65}
            outerRadius={85}
            paddingAngle={6}
            dataKey="value"
            animationDuration={1500}
            animationEasing="ease-out"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none' }}>
        <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff' }}>100%</span>
      </div>
    </div>
  );
}
