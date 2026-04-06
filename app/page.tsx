'use client'
import { useState, useRef, useCallback, useEffect } from 'react'
import Papa from 'papaparse'
import ChartRenderer from '@/components/ChartRenderer'
import { exportCSV } from "@/lib/export"
import { saveDashboardToDB, getDashboardsFromDB, deleteDashboardFromDB } from "@/lib/storage"
import { signInAnonymously, getCurrentUser, signOutUser } from "@/lib/auth"

interface CsvData { headers: string[]; rows: Record<string, string>[] }

interface Result {
  id: string
  query: string
  insight?: string
  chartData?: any[]
  tableData?: any[]
  chartRecommendation?: string
  error?: string
}

interface SavedDashboard {
  id: string
  title: string
  query: string
  insight?: string
  chart_data?: any[]
  table_data?: any[]
  chart_recommendation?: string
  created_at?: string
}

const SUGGESTIONS = [
  'Summarize this dataset', 'Show top 5 rows by value',
  'What are the trends?', 'Find the highest values',
  'Count by category', 'Calculate averages',
]

export default function Home() {
  const [csv, setCsv] = useState<CsvData | null>(null)
  const [filename, setFilename] = useState('')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Result[]>([])
  const [savedDashboards, setSavedDashboards] = useState<SavedDashboard[]>([])
  const [loading, setLoading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [authReady, setAuthReady] = useState(false)
  const [saveLoadingId, setSaveLoadingId] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const loadSavedDashboards = useCallback(async () => {
    try {
      const data = await getDashboardsFromDB()
      setSavedDashboards(data)
    } catch (error) {
      console.error("Failed to load dashboards:", error)
    }
  }, [])

  useEffect(() => {
    const initAuth = async () => {
      try {
        let user = await getCurrentUser()
        if (!user) {
          await signInAnonymously()
          user = await getCurrentUser()
        }
        setAuthReady(true)
        await loadSavedDashboards()
      } catch (error) {
        console.error("Auth init failed:", error)
      }
    }

    initAuth()
  }, [loadSavedDashboards])

  const handleFile = useCallback((file: File | null | undefined) => {
    if (!file || !file.name.endsWith('.csv')) return
    setFilename(file.name)
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => setCsv({ headers: res.meta.fields ?? [], rows: res.data as any }),
    })
  }, [])

  const runQuery = async (q: string) => {
    if (!q.trim() || !csv) return
    setLoading(true)
    setQuery('')

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q,
          headers: csv.headers,
          sampleRows: csv.rows,
          totalRows: csv.rows.length
        }),
      })

      const data = await res.json()
      setResults(prev => [{ id: Date.now().toString(), query: q, ...data }, ...prev])
    } catch {
      setResults(prev => [{ id: Date.now().toString(), query: q, error: 'Analysis failed. Please try again.' }, ...prev])
    }

    setLoading(false)
  }

  const handleSaveDashboard = async (result: Result) => {
    try {
      setSaveLoadingId(result.id)

      await saveDashboardToDB({
        title: result.query,
        query: result.query,
        insight: result.insight,
        chartData: result.chartData,
        tableData: result.tableData,
        chartRecommendation: result.chartRecommendation,
      })

      await loadSavedDashboards()
      alert("Dashboard saved successfully")
    } catch (error: any) {
      console.error(error)
      alert(error?.message || "Failed to save dashboard")
    } finally {
      setSaveLoadingId(null)
    }
  }

  const handleDeleteDashboard = async (id: string) => {
    try {
      await deleteDashboardFromDB(id)
      await loadSavedDashboards()
    } catch (error: any) {
      console.error(error)
      alert(error?.message || "Failed to delete dashboard")
    }
  }

  return (
    <div style={{ minHeight:'100vh', background:'#070b14', color:'#e2e8f0', fontFamily:"'Syne',sans-serif", padding:24, position:'relative' }}>
      <div style={{ position:'fixed', top:-200, left:-200, width:600, height:600, background:'radial-gradient(circle,rgba(0,229,255,0.06) 0%,transparent 70%)', pointerEvents:'none' }} />
      <div style={{ position:'fixed', bottom:-200, right:-200, width:500, height:500, background:'radial-gradient(circle,rgba(124,58,237,0.07) 0%,transparent 70%)', pointerEvents:'none' }} />

      <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:32, borderBottom:'1px solid rgba(0,229,255,0.15)', paddingBottom:20 }}>
        <div style={{ width:42, height:42, background:'linear-gradient(135deg,#00e5ff,#7c3aed)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, boxShadow:'0 0 20px rgba(0,229,255,0.3)' }}>📊</div>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, background:'linear-gradient(90deg,#00e5ff,#a78bfa)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', letterSpacing:-0.5 }}>AI Data Analyst</h1>
          <p style={{ fontSize:12, color:'#64748b', fontFamily:"'Space Mono',monospace", marginTop:2 }}>
            Natural language → instant insights
          </p>
        </div>
        <span style={{ marginLeft:'auto', background:'rgba(0,229,255,0.08)', border:'1px solid rgba(0,229,255,0.2)', color:'#00e5ff', fontSize:10, padding:'4px 10px', borderRadius:20, fontFamily:"'Space Mono',monospace", textTransform:'uppercase', letterSpacing:1 }}>
          Powered by Abdullah
        </span>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'340px 1fr', gap:20, alignItems:'start' }}>
        <div>
          <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:16, padding:20, marginBottom:20 }}>
            <p style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:1.5, color:'#64748b', marginBottom:16, fontFamily:"'Space Mono',monospace" }}>01 — Upload Data</p>
            {!csv ? (
              <div
                onDragOver={e => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]) }}
                onClick={() => fileRef.current?.click()}
                style={{ border:`2px dashed ${dragging ? 'rgba(0,229,255,0.5)' : 'rgba(0,229,255,0.2)'}`, borderRadius:12, padding:'32px 20px', textAlign:'center', cursor:'pointer', background: dragging ? 'rgba(0,229,255,0.05)' : 'rgba(0,229,255,0.02)', transition:'all 0.2s' }}>
                <div style={{ fontSize:32, marginBottom:10 }}>📂</div>
                <p style={{ fontSize:13, color:'#94a3b8' }}>Drop your CSV file here</p>
                <p style={{ fontSize:11, color:'#475569', marginTop:4, fontFamily:"'Space Mono',monospace" }}>or click to browse</p>
                <button style={{ marginTop:12, background:'rgba(0,229,255,0.1)', border:'1px solid rgba(0,229,255,0.3)', color:'#00e5ff', padding:'8px 18px', borderRadius:8, fontSize:12, cursor:'pointer', fontFamily:"'Syne',sans-serif" }}>
                  Choose CSV File
                </button>
                <input ref={fileRef} type="file" accept=".csv" style={{ display:'none' }} onChange={e => handleFile(e.target.files?.[0])} />
              </div>
            ) : (
              <>
                <div style={{ background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.2)', borderRadius:10, padding:'12px 14px', display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
                  <span style={{ fontSize:20 }}>✅</span>
                  <div style={{ flex:1 }}>
                    <p style={{ fontSize:13, fontWeight:600, color:'#10b981' }}>{filename}</p>
                    <p style={{ fontSize:11, color:'#64748b', fontFamily:"'Space Mono',monospace" }}>{csv.rows.length} rows · {csv.headers.length} cols</p>
                  </div>
                  <button onClick={() => { setCsv(null); setFilename(''); setResults([]) }} style={{ background:'none', border:'none', color:'#64748b', cursor:'pointer', fontSize:16 }}>✕</button>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
                  {[['Rows', csv.rows.length.toLocaleString()], ['Columns', csv.headers.length]].map(([l, v]) => (
                    <div key={l} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:10, padding:12 }}>
                      <p style={{ fontSize:10, color:'#64748b', textTransform:'uppercase', letterSpacing:1, fontFamily:"'Space Mono',monospace" }}>{l}</p>
                      <p style={{ fontSize:22, fontWeight:800, color:'#e2e8f0', marginTop:2 }}>{v}</p>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:1.5, color:'#64748b', marginBottom:8, fontFamily:"'Space Mono',monospace" }}>Columns</p>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {csv.headers.map(h => (
                    <span key={h} style={{ background:'rgba(124,58,237,0.12)', border:'1px solid rgba(124,58,237,0.25)', color:'#a78bfa', fontSize:10, padding:'3px 9px', borderRadius:20, fontFamily:"'Space Mono',monospace" }}>{h}</span>
                  ))}
                </div>
              </>
            )}
          </div>

          {csv && (
            <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:16, padding:20, marginBottom:20 }}>
              <p style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:1.5, color:'#64748b', marginBottom:12, fontFamily:"'Space Mono',monospace" }}>Preview</p>
              <div style={{ overflowX:'auto', maxHeight:200, overflowY:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                  <thead>
                    <tr>{csv.headers.slice(0,4).map(h => <th key={h} style={{ textAlign:'left', padding:'6px 10px', background:'rgba(255,255,255,0.04)', color:'#64748b', fontFamily:"'Space Mono',monospace", fontSize:10, textTransform:'uppercase', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {csv.rows.slice(0,6).map((row, i) => (
                      <tr key={i}>{csv.headers.slice(0,4).map(h => <td key={h} style={{ padding:'7px 10px', color:'#cbd5e1', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>{row[h]}</td>)}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {csv.headers.length > 4 && <p style={{ color:'#475569', fontSize:11, marginTop:8, fontFamily:"'Space Mono',monospace" }}>+{csv.headers.length-4} more columns hidden</p>}
            </div>
          )}

          <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:16, padding:20 }}>
            <p style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:1.5, color:'#64748b', marginBottom:12, fontFamily:"'Space Mono',monospace" }}>Saved Dashboards</p>

            {!authReady && (
              <p style={{ fontSize:12, color:'#64748b' }}>Connecting...</p>
            )}

            {authReady && savedDashboards.length === 0 && (
              <p style={{ fontSize:12, color:'#64748b' }}>No saved dashboards yet</p>
            )}

            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
{savedDashboards.map((item) => (
  <div
    key={item.id}
    onClick={() => {
      setResults([{
        id: Date.now().toString(),
        query: item.query,
        insight: item.insight,
        chartData: item.chart_data,
        tableData: item.table_data,
        chartRecommendation: item.chart_recommendation
      }])
    }}
    style={{
      background:'rgba(255,255,255,0.03)',
      border:'1px solid rgba(255,255,255,0.06)',
      borderRadius:10,
      padding:12,
      cursor:'pointer',
      transition:'0.2s'
    }}
  >
    <p style={{ fontSize:13, color:'#e2e8f0', marginBottom:6 }}>
      {item.title}
    </p>

    <p style={{
      fontSize:11,
      color:'#64748b',
      fontFamily:"'Space Mono',monospace",
      marginBottom:8
    }}>
      {item.created_at
        ? new Date(item.created_at).toLocaleString()
        : ""}
    </p>

    <button
      onClick={(e) => {
        e.stopPropagation()
        handleDeleteDashboard(item.id)
      }}
      style={{
        background:'rgba(239,68,68,0.08)',
        border:'1px solid rgba(239,68,68,0.2)',
        color:'#f87171',
        padding:'6px 10px',
        borderRadius:8,
        fontSize:11,
        cursor:'pointer'
      }}
    >
      Delete
    </button>
  </div>
))}
            </div>

            <button
              onClick={async () => {
                await signOutUser()
                window.location.reload()
              }}
              style={{
                marginTop:12,
                background:'rgba(255,255,255,0.04)',
                border:'1px solid rgba(255,255,255,0.08)',
                color:'#94a3b8',
                padding:'8px 12px',
                borderRadius:8,
                fontSize:12,
                cursor:'pointer'
              }}
            >
              Reset Session
            </button>
          </div>
        </div>

        <div>
          <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:16, padding:20, marginBottom:20 }}>
            <p style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:1.5, color:'#64748b', marginBottom:16, fontFamily:"'Space Mono',monospace" }}>02 — Ask Anything</p>
            <div style={{ display:'flex', gap:10, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:'10px 14px' }}>
              <input
                style={{ flex:1, background:'transparent', border:'none', outline:'none', color:'#e2e8f0', fontSize:14, fontFamily:"'Syne',sans-serif" }}
                placeholder={csv ? 'e.g. Show top 5 products by sales...' : 'Upload a CSV file first...'}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && runQuery(query)}
                disabled={!csv || loading}
              />
              <button
                onClick={() => runQuery(query)}
                disabled={!csv || !query.trim() || loading}
                style={{ background:'linear-gradient(135deg,#00e5ff,#7c3aed)', border:'none', borderRadius:8, color:'#070b14', fontWeight:700, fontSize:12, padding:'8px 16px', cursor:'pointer', fontFamily:"'Syne',sans-serif", opacity: (!csv || !query.trim() || loading) ? 0.4 : 1, whiteSpace:'nowrap' }}>
                {loading ? '...' : 'Analyze →'}
              </button>
            </div>

            {csv && (
              <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:10 }}>
                {SUGGESTIONS.map(s => (
                  <button key={s} onClick={() => runQuery(s)} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', color:'#94a3b8', fontSize:11, padding:'5px 12px', borderRadius:20, cursor:'pointer', fontFamily:"'Space Mono',monospace" }}>
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {loading && (
            <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:16, padding:24, marginBottom:16 }}>
              <div style={{ display:'flex', alignItems:'center', gap:12, color:'#64748b', fontSize:13, fontFamily:"'Space Mono',monospace" }}>
                <div style={{ width:20, height:20, border:'2px solid rgba(0,229,255,0.2)', borderTopColor:'#00e5ff', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
                Analyzing your data with AI...
              </div>
            </div>
          )}

          {results.length === 0 && !loading && (
            <div style={{ textAlign:'center', padding:'60px 20px', color:'#475569' }}>
              <div style={{ fontSize:48, marginBottom:12 }}>🔍</div>
              <p style={{ fontSize:14 }}>No analysis yet</p>
              <p style={{ fontSize:12, fontFamily:"'Space Mono',monospace", marginTop:6 }}>Upload a CSV and ask a question to get started</p>
            </div>
          )}

          {results.map(r => (
            <div key={r.id} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:16, padding:20, marginBottom:16, animation:'fadeIn 0.4s ease' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
                <span style={{ fontSize:16 }}>💬</span>
                <span style={{ fontSize:13, color:'#00e5ff', fontFamily:"'Space Mono',monospace" }}>"{r.query}"</span>
                <span style={{ marginLeft:'auto', background:'rgba(124,58,237,0.15)', border:'1px solid rgba(124,58,237,0.3)', color:'#a78bfa', fontSize:9, padding:'3px 8px', borderRadius:20, fontFamily:"'Space Mono',monospace", textTransform:'uppercase', letterSpacing:1 }}>AI</span>
              </div>

              {r.error && <div style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:10, padding:'12px 14px', color:'#fca5a5', fontSize:13 }}>⚠️ {r.error}</div>}
              {r.insight && <div style={{ background:'rgba(0,229,255,0.05)', borderLeft:'3px solid #00e5ff', borderRadius:'0 8px 8px 0', padding:'12px 14px', marginBottom:16, fontSize:13, color:'#cbd5e1', lineHeight:1.6 }}>{r.insight}</div>}
              {r.chartData?.length && <ChartRenderer data={r.chartData} recommended={r.chartRecommendation || 'bar'} />}

              {r.tableData?.length && (
                <div style={{ overflowX:'auto', marginTop: r.chartData ? 16 : 0 }}>
                  <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                    <thead>
                      <tr>{Object.keys(r.tableData[0]).map(k => <th key={k} style={{ textAlign:'left', padding:'8px 10px', background:'rgba(255,255,255,0.04)', color:'#64748b', fontFamily:"'Space Mono',monospace", fontSize:10, textTransform:'uppercase', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>{k}</th>)}</tr>
                    </thead>
                    <tbody>
                      {r.tableData.map((row: any, i: number) => (
                        <tr key={i}>{Object.values(row).map((v: any, j) => <td key={j} style={{ padding:'8px 10px', color:'#cbd5e1', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>{v}</td>)}</tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div style={{ display:'flex', gap:10, marginTop:16 }}>
                <button
                  onClick={() => handleSaveDashboard(r)}
                  disabled={saveLoadingId === r.id}
                  style={{
                    background:'rgba(16,185,129,0.08)',
                    border:'1px solid rgba(16,185,129,0.2)',
                    color:'#10b981',
                    padding:'8px 14px',
                    borderRadius:8,
                    fontSize:12,
                    cursor:'pointer',
                    fontFamily:"'Syne',sans-serif",
                    opacity: saveLoadingId === r.id ? 0.6 : 1
                  }}
                >
                  {saveLoadingId === r.id ? "Saving..." : "Save Dashboard"}
                </button>

                <button
                  onClick={() => exportCSV(r.chartData || r.tableData || [])}
                  disabled={!(r.chartData?.length || r.tableData?.length)}
                  style={{
                    background:'rgba(0,229,255,0.08)',
                    border:'1px solid rgba(0,229,255,0.2)',
                    color:'#00e5ff',
                    padding:'8px 14px',
                    borderRadius:8,
                    fontSize:12,
                    cursor: (r.chartData?.length || r.tableData?.length) ? 'pointer' : 'not-allowed',
                    opacity: (r.chartData?.length || r.tableData?.length) ? 1 : 0.5,
                    fontFamily:"'Syne',sans-serif"
                  }}
                >
                  Export CSV
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </div>
  )
}