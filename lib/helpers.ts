export const MONTHS = ['January','February','March','April','May','June',
  'July','August','September','October','November','December']

export const DESIGNATIONS = ['Operator','Supervisor','Packing Staff','Loading Staff','Accounts','Admin']

export function getSaturdays(year: number, month: number) {
  let count = 0
  const d = new Date(year, month, 1)
  while (d.getMonth() === month) {
    if (d.getDay() === 6) count++
    d.setDate(d.getDate() + 1)
  }
  return count
}

export function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

export function workDays(year: number, month: number) {
  return getDaysInMonth(year, month) - getSaturdays(year, month)
}

export function calcSalary(emp: any, ed: any, wd: number) {
  const isIM  = emp.machine === '1.5x'
  const eff   = emp.saltype === 'daily' ? emp.daily : emp.fixed / wd
  const base  = Math.round((isIM ? eff * 1.5 : eff) * ed.days)
  const satB  = Math.round(eff * ed.sat * 2)
  const otAmt = isIM
    ? Math.round((eff / 12) * ed.ot * 1.5)
    : Math.round((eff / 12) * ed.ot)
  const gross = base + satB + otAmt
  const adv   = ed.advance || 0
  const od    = ed.other_dedn || 0
  const net   = gross - adv - od
  return { base, satB, otAmt, gross, adv, od, net }
}

export function fmt(n: number) {
  return '₹' + Math.round(n).toLocaleString('en-IN')
}
