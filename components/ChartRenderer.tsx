'use client'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { useState } from 'react'

const COLORS = ['#00e5ff','#7c3aed','#f59e0b','#10b981','#ef4444','#ec4899','#3b82f6','#14b8a6']

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'#0f172a', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'8px 12px', fontFamily:"'Space Mono',monospace", fontSize:11 }}>
      <p style={{ color:'#94a3b8', marginBottom:4 }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color || '#00e5ff' }}>{p.name}: <strong>{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</strong></p>
      ))}
    </div>
  )
}

export default function ChartRenderer({ data, recommended }: { data: any[], recommended: string }) {
  const [type, setType] = useState(recommended || 'bar')
  if (!data?.length) return null

  const keys = Object.keys(data[0])
  const labelKey = keys[0]
  const valueKey = keys[1] || 'value'

  const axisStyle = { fill:'#64748b', fontSize:10, fontFamily:"'Space Mono',monospace" }

  return (
    <div>
      <div style={{ display:'flex', gap:8, marginBottom:16 }}>
        {['bar','line','pie'].map(t => (
          <button key={t} onClick={() => setType(t)} style={{
            background: type===t ? 'rgba(0,229,255,0.1)' : 'rgba(255,255,255,0.04)',
            border: type===t ? '1px solid rgba(0,229,255,0.3)' : '1px solid rgba(255,255,255,0.08)',
            color: type===t ? '#00e5ff' : '#64748b',
            fontSize:11, padding:'5px 12px', borderRadius:8, cursor:'pointer',
            fontFamily:"'Space Mono',monospace"
          }}>
            {t === 'bar' ? '▦ Bar' : t === 'line' ? '📈 Line' : '⬤ Pie'}
          </button>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={260}>
        {type === 'bar' ? (
          <BarChart data={data} margin={{ top:5, right:10, bottom:5, left:0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey={labelKey} tick={axisStyle} axisLine={false} tickLine={false} />
            <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey={valueKey} fill="#00e5ff" radius={[4,4,0,0]} />
          </BarChart>
        ) : type === 'line' ? (
          <LineChart data={data} margin={{ top:5, right:10, bottom:5, left:0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey={labelKey} tick={axisStyle} axisLine={false} tickLine={false} />
            <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey={valueKey} stroke="#00e5ff" strokeWidth={2} dot={{ r:3, fill:'#00e5ff' }} />
          </LineChart>
        ) : (
          <PieChart>
            <Pie data={data} dataKey={valueKey} nameKey={labelKey} cx="50%" cy="50%" outerRadius={100}
              label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}
              labelLine={{ stroke:'rgba(255,255,255,0.2)' }}>
              {data.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend formatter={(v) => <span style={{ color:'#94a3b8', fontSize:11, fontFamily:"'Space Mono',monospace" }}>{v}</span>} />
          </PieChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}
