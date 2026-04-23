'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { MONTHS, DESIGNATIONS, getSaturdays, getDaysInMonth, workDays, calcSalary, fmt } from '../lib/helpers'

type Emp = {
  id: string; name: string; desig: string
  machine: string; saltype: string; fixed: number; daily: number
}
type SalRow = { days: number; sat: number; ot: number; advance: number; other_dedn: number }

const MAROON = '#5C1A1A'
const GOLD   = '#C9A84C'

export default function Home() {
  const [tab, setTab]       = useState<'emp'|'sal'|'sum'>('emp')
  const [emps, setEmps]     = useState<Emp[]>([])
  const [salData, setSalData] = useState<Record<string, SalRow>>({})
  const [month, setMonth]   = useState(new Date().getMonth())
  const [year]              = useState(2026)
  const [loading, setLoading] = useState(false)
  const [toast, setToast]   = useState('')

  // form state
  const [fName, setFName]   = useState('')
  const [fId, setFId]       = useState('')
  const [fDesig, setFDesig] = useState('Operator')
  const [fMach, setFMach]   = useState('Normal')
  const [fStype, setFStype] = useState('fixed')
  const [fFixed, setFFixed] = useState('')
  const [fDaily, setFDaily] = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  const loadEmps = useCallback(async () => {
    const { data } = await supabase.from('employees').select('*').order('id')
    if (data) setEmps(data)
  }, [])

  const loadSalary = useCallback(async () => {
    const { data } = await supabase
      .from('salary_data')
      .select('*')
      .eq('year', year)
      .eq('month', month)
    if (data) {
      const map: Record<string, SalRow> = {}
      data.forEach((r: any) => { map[r.emp_id] = r })
      setSalData(map)
    }
  }, [year, month])

  useEffect(() => { loadEmps() }, [loadEmps])
  useEffect(() => { if (tab === 'sal') loadSalary() }, [tab, loadSalary])

  // Auto ID from name
  const handleNameChange = (val: string) => {
    setFName(val)
    const next = emps.length + 1
    setFId('SPI-' + String(next).padStart(3, '0'))
  }

  const addEmp = async () => {
    if (!fName.trim()) { showToast('Naam daalo!'); return }
    if (fStype === 'fixed' && !fFixed) { showToast('Monthly salary daalo!'); return }
    if (fStype === 'daily' && !fDaily) { showToast('Daily rate daalo!'); return }
    setLoading(true)
    const id = fId || 'SPI-' + String(emps.length + 1).padStart(3, '0')
    const { error } = await supabase.from('employees').insert({
      id, name: fName.trim(), desig: fDesig, machine: fMach,
      saltype: fStype, fixed: parseFloat(fFixed) || 0, daily: parseFloat(fDaily) || 0
    })
    setLoading(false)
    if (error) { showToast('Error: ' + error.message); return }
    setFName(''); setFId(''); setFFixed(''); setFDaily('')
    await loadEmps()
    showToast(fName + ' add ho gaya!')
  }

  const deleteEmp = async (id: string) => {
    if (!confirm('Delete karein?')) return
    await supabase.from('employees').delete().eq('id', id)
    await loadEmps()
    showToast('Delete ho gaya.')
  }

  const updateSal = async (empId: string, field: string, val: number) => {
    const wd = workDays(year, month)
    const existing = salData[empId] || { days: wd, sat: 0, ot: 0, advance: 0, other_dedn: 0 }
    const updated = { ...existing, [field]: val, emp_id: empId, year, month }
    await supabase.from('salary_data').upsert(updated, { onConflict: 'emp_id,year,month' })
    setSalData(prev => ({ ...prev, [empId]: { ...existing, [field]: val } }))
  }

  const exportCSV = () => {
    const wd = workDays(year, month)
    let csv = 'Emp ID,Name,Designation,Machine,Days,Sat,OT Hrs,Base,Sat Bonus,OT Amt,Gross,Advance,Other Dedn,Net\n'
    emps.forEach(e => {
      const ed = salData[e.id] || { days: wd, sat: 0, ot: 0, advance: 0, other_dedn: 0 }
      const { base, satB, otAmt, gross, adv, od, net } = calcSalary(e, ed, wd)
      csv += `${e.id},"${e.name}",${e.desig},${e.machine},${ed.days},${ed.sat},${ed.ot},${base},${satB},${otAmt},${gross},${adv},${od},${net}\n`
    })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = `JaiGuruJi_Salary_${MONTHS[month]}_${year}.csv`
    a.click()
  }

  const wd   = workDays(year, month)
  const sats = getSaturdays(year, month)

  // Summary calc
  const empAnnual: Record<string, number> = {}
  const monthTotals: number[] = Array(12).fill(0)

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh', background: '#f5f0ee' }}>

      {/* Header */}
      <div style={{ background: MAROON, color: '#fff', padding: '12px 16px', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: 0.3 }}>🙏 Jai Guru Ji</div>
        <div style={{ fontSize: 11, color: GOLD, marginTop: 2 }}>Salary Sheet</div>
        <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
          {(['emp','sal','sum'] as const).map((t, i) => (
            <button key={t} onClick={() => setTab(t)}
              style={{
                flex: 1, padding: '7px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: 500,
                background: tab === t ? GOLD : 'rgba(255,255,255,0.12)',
                color: tab === t ? MAROON : '#fff'
              }}>
              {['Employees','Salary','Summary'][i]}
            </button>
          ))}
        </div>
      </div>

      {/* ── EMPLOYEES TAB ── */}
      {tab === 'emp' && (
        <div style={{ padding: 12 }}>
          {/* Info */}
          <div style={{ background: '#FFF9ED', border: `1px solid ${GOLD}`, borderRadius: 10, padding: '10px 13px', fontSize: 12, color: MAROON, marginBottom: 12, lineHeight: 1.8 }}>
            <b>Naam daalo</b> → ID apne aap banega &nbsp;|&nbsp; <b>1.5x</b> = IM Machine &nbsp;|&nbsp; Data cloud mein save hoga
          </div>

          {/* Add Form */}
          <div style={{ background: '#fff', borderRadius: 12, padding: 14, marginBottom: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: MAROON, marginBottom: 12 }}>Naya Employee Add Karo</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
              <div>
                <label style={{ fontSize: 11, color: '#666', display: 'block', marginBottom: 3 }}>Naam *</label>
                <input value={fName} onChange={e => handleNameChange(e.target.value)}
                  placeholder="Uday Kumar"
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 8, fontSize: 13 }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: '#666', display: 'block', marginBottom: 3 }}>ID (auto)</label>
                <input value={fId} readOnly placeholder="SPI-001"
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 8, fontSize: 13, background: '#f5f5f5', color: '#888' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
              <div>
                <label style={{ fontSize: 11, color: '#666', display: 'block', marginBottom: 3 }}>Designation</label>
                <select value={fDesig} onChange={e => setFDesig(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 8, fontSize: 13 }}>
                  {DESIGNATIONS.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: '#666', display: 'block', marginBottom: 3 }}>Machine Type</label>
                <select value={fMach} onChange={e => setFMach(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 8, fontSize: 13 }}>
                  <option value="Normal">Normal (Regular Rate)</option>
                  <option value="1.5x">1.5x Machine (IM)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
              <div>
                <label style={{ fontSize: 11, color: '#666', display: 'block', marginBottom: 3 }}>Salary Type</label>
                <select value={fStype} onChange={e => setFStype(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 8, fontSize: 13 }}>
                  <option value="fixed">Fixed Monthly</option>
                  <option value="daily">Daily Wages</option>
                </select>
              </div>
              <div>
                {fStype === 'fixed'
                  ? <><label style={{ fontSize: 11, color: '#666', display: 'block', marginBottom: 3 }}>Monthly (₹)</label>
                      <input type="number" value={fFixed} onChange={e => setFFixed(e.target.value)} placeholder="18000"
                        style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 8, fontSize: 13 }} /></>
                  : <><label style={{ fontSize: 11, color: '#666', display: 'block', marginBottom: 3 }}>Daily Rate (₹)</label>
                      <input type="number" value={fDaily} onChange={e => setFDaily(e.target.value)} placeholder="650"
                        style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 8, fontSize: 13 }} /></>
                }
              </div>
            </div>

            <button onClick={addEmp} disabled={loading}
              style={{ width: '100%', padding: '11px 0', background: MAROON, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              {loading ? 'Adding...' : '+ Employee Add Karo'}
            </button>
          </div>

          {/* List */}
          <div style={{ background: '#fff', borderRadius: 12, padding: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: MAROON, marginBottom: 10 }}>
              Employee List ({emps.length})
            </div>
            {emps.length === 0
              ? <div style={{ textAlign: 'center', color: '#aaa', fontSize: 12, padding: 24 }}>Koi employee nahi. Upar se add karo.</div>
              : emps.map((e, i) => (
                <div key={e.id} style={{
                  borderRadius: 10, padding: '10px 12px', marginBottom: 6,
                  border: `1px solid #eee`,
                  borderLeft: `4px solid ${e.machine === '1.5x' ? GOLD : '#ddd'}`,
                  background: e.machine === '1.5x' ? '#FFFDF5' : '#fafafa',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>
                      {e.name}
                      <span style={{ marginLeft: 6, fontSize: 10, padding: '2px 6px', borderRadius: 5, fontWeight: 500,
                        background: e.machine === '1.5x' ? '#FFF3CD' : e.saltype === 'daily' ? '#E6F1FB' : '#f0f0f0',
                        color: e.machine === '1.5x' ? '#856404' : e.saltype === 'daily' ? '#185FA5' : '#666'
                      }}>
                        {e.machine === '1.5x' ? '1.5x Machine' : e.saltype === 'daily' ? 'Daily' : 'Fixed'}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
                      {e.id} · {e.desig} · {e.saltype === 'daily' ? '₹'+e.daily+'/day' : '₹'+e.fixed.toLocaleString('en-IN')+'/month'}
                    </div>
                  </div>
                  <button onClick={() => deleteEmp(e.id)}
                    style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, border: '1px solid #fca5a5', background: '#fef2f2', color: '#dc2626', cursor: 'pointer' }}>
                    Delete
                  </button>
                </div>
              ))
            }
          </div>
        </div>
      )}

      {/* ── SALARY TAB ── */}
      {tab === 'sal' && (
        <div style={{ padding: 12 }}>
          {/* Month selector */}
          <div style={{ background: '#fff', borderRadius: 12, padding: '10px 14px', marginBottom: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <select value={month} onChange={e => setMonth(parseInt(e.target.value))}
                style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13 }}>
                {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
              </select>
              <span style={{ fontSize: 13, color: '#888' }}>{year}</span>
              <button onClick={exportCSV}
                style={{ marginLeft: 'auto', padding: '6px 12px', borderRadius: 8, border: '1px solid #ddd', background: '#f5f5f5', fontSize: 12, cursor: 'pointer' }}>
                CSV Export
              </button>
            </div>
            <div style={{ fontSize: 10, color: '#999', marginTop: 6 }}>
              Working days: {wd} &nbsp;|&nbsp; Saturdays (holiday): {sats} &nbsp;|&nbsp;
              Saturday aaya → double milega &nbsp;|&nbsp; Yellow = editable &nbsp;|&nbsp; Red = advance
            </div>
          </div>

          {/* Salary cards — mobile friendly vertical layout */}
          {emps.length === 0
            ? <div style={{ textAlign: 'center', color: '#aaa', fontSize: 13, padding: 40 }}>Pehle employees add karo.</div>
            : emps.map(e => {
              const ed = salData[e.id] || { days: wd, sat: 0, ot: 0, advance: 0, other_dedn: 0 }
              const { base, satB, otAmt, gross, adv, od, net } = calcSalary(e, ed, wd)
              const isIM = e.machine === '1.5x'
              return (
                <div key={e.id} style={{
                  background: '#fff', borderRadius: 12, padding: 14, marginBottom: 10,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                  borderLeft: `4px solid ${isIM ? GOLD : '#ddd'}`
                }}>
                  {/* Name row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{e.name}</div>
                      <div style={{ fontSize: 11, color: '#888' }}>{e.id} · {e.desig} · {isIM ? '1.5x Machine' : 'Normal'}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: MAROON }}>{fmt(net)}</div>
                      <div style={{ fontSize: 10, color: '#aaa' }}>Net Salary</div>
                    </div>
                  </div>

                  {/* Input row */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, marginBottom: 10 }}>
                    {[
                      { label: 'Days Kaam', field: 'days', val: ed.days, max: wd, cls: 'input-yellow' },
                      { label: 'Sat Aaya', field: 'sat', val: ed.sat, max: sats, cls: 'input-yellow' },
                      { label: 'OT Hrs', field: 'ot', val: ed.ot, max: 999, cls: 'input-yellow' },
                      { label: 'Advance ₹', field: 'advance', val: ed.advance, max: 999999, cls: 'input-red' },
                    ].map(inp => (
                      <div key={inp.field} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 9, color: '#888', marginBottom: 3 }}>{inp.label}</div>
                        <input type="number" min={0} max={inp.max} defaultValue={inp.val}
                          onBlur={e => updateSal(e.id, inp.field, parseFloat(e.target.value) || 0)}
                          style={{
                            width: '100%', textAlign: 'center', padding: '5px 2px',
                            border: `1px solid ${inp.cls === 'input-red' ? '#fca5a5' : '#f59e0b'}`,
                            borderRadius: 7, fontSize: 13, fontWeight: 500,
                            background: inp.cls === 'input-red' ? '#fef2f2' : '#fffbeb'
                          }} />
                      </div>
                    ))}
                  </div>

                  {/* Other deduction */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <span style={{ fontSize: 11, color: '#888' }}>Other Deduction (₹)</span>
                    <input type="number" min={0} defaultValue={ed.other_dedn}
                      onBlur={ev => updateSal(e.id, 'other_dedn', parseFloat(ev.target.value) || 0)}
                      style={{ width: 80, textAlign: 'center', padding: '4px 6px', border: '1px solid #ddd', borderRadius: 7, fontSize: 12 }} />
                  </div>

                  {/* Breakdown */}
                  <div style={{ background: '#f9f9f9', borderRadius: 8, padding: '8px 10px', fontSize: 11 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 4, textAlign: 'center' }}>
                      {[['Base', fmt(base)], ['Sat Bonus', satB > 0 ? fmt(satB) : '—'], ['OT', otAmt > 0 ? fmt(otAmt) : '—'], ['Gross', fmt(gross)]].map(([l, v]) => (
                        <div key={l}>
                          <div style={{ color: '#aaa', fontSize: 9 }}>{l}</div>
                          <div style={{ fontWeight: 500, fontSize: 12 }}>{v}</div>
                        </div>
                      ))}
                    </div>
                    {(adv > 0 || od > 0) && (
                      <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid #eee', display: 'flex', gap: 12, justifyContent: 'center', color: '#dc2626', fontSize: 11 }}>
                        {adv > 0 && <span>Advance: -{fmt(adv)}</span>}
                        {od > 0 && <span>Other: -{fmt(od)}</span>}
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          }

          {/* Month total */}
          {emps.length > 0 && (() => {
            let totalNet = 0, totalGross = 0
            emps.forEach(e => {
              const ed = salData[e.id] || { days: wd, sat: 0, ot: 0, advance: 0, other_dedn: 0 }
              const { gross, net } = calcSalary(e, ed, wd)
              totalNet += net; totalGross += gross
            })
            return (
              <div style={{ background: MAROON, borderRadius: 12, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', color: '#fff', marginTop: 4 }}>
                <div><div style={{ fontSize: 11, color: GOLD }}>Total Gross</div><div style={{ fontSize: 16, fontWeight: 700 }}>{fmt(totalGross)}</div></div>
                <div style={{ textAlign: 'right' }}><div style={{ fontSize: 11, color: GOLD }}>Total Net Payable</div><div style={{ fontSize: 16, fontWeight: 700 }}>{fmt(totalNet)}</div></div>
              </div>
            )
          })()}
        </div>
      )}

      {/* ── SUMMARY TAB ── */}
      {tab === 'sum' && (
        <div style={{ padding: 12 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 14, marginBottom: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: MAROON, marginBottom: 12 }}>Month-wise Payroll 2026</div>
            {MONTHS.map((mn, mi) => {
              const wd2 = workDays(year, mi)
              return (
                <div key={mn} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #f0f0f0', fontSize: 13 }}>
                  <span style={{ color: mi === month ? MAROON : '#444', fontWeight: mi === month ? 600 : 400 }}>{mn} {year}</span>
                  <span style={{ color: MAROON, fontWeight: 500 }}>
                    {(() => {
                      let total = 0
                      emps.forEach(e => {
                        const ed = salData[e.id] || { days: wd2, sat: 0, ot: 0, advance: 0, other_dedn: 0 }
                        total += calcSalary(e, ed, wd2).net
                      })
                      return total > 0 ? fmt(total) : '—'
                    })()}
                  </span>
                </div>
              )
            })}
          </div>

          <div style={{ background: '#fff', borderRadius: 12, padding: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: MAROON, marginBottom: 12 }}>Employee List ({emps.length})</div>
            {emps.map(e => (
              <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #f0f0f0', fontSize: 13 }}>
                <div>
                  <div style={{ fontWeight: 500 }}>{e.name}</div>
                  <div style={{ fontSize: 11, color: '#888' }}>{e.desig} · {e.machine === '1.5x' ? '1.5x' : 'Normal'}</div>
                </div>
                <div style={{ textAlign: 'right', fontSize: 11, color: '#888' }}>
                  {e.saltype === 'daily' ? '₹'+e.daily+'/day' : '₹'+e.fixed.toLocaleString('en-IN')+'/mo'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: MAROON, color: '#fff', padding: '10px 20px', borderRadius: 10,
          fontSize: 13, zIndex: 999, whiteSpace: 'nowrap', boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
        }}>{toast}</div>
      )}
    </div>
  )
}
