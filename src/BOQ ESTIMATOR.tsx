import React, { useState, useMemo, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const INITIAL_TITLES = [
  "1. Earthwork excavation for foundation", "2. Filling in basement with gravel",
  "3. Filling in basement with river sand", "4. PCC 1:4:8 for foundation",
  "5. RCC 1:2:4 for footings", "6. RCC 1:2:4 for column up to plinth level",
  "7. RCC 1:2:4 for plinth beam", "8. Brickwork in CM 1:6 for foundation",
  "9. Brickwork in CM 1:6 for super structure", "10. RCC 1:2:4 for lintel",
  "11. RCC 1:2:4 for sunshade", "12. RCC 1:2:4 for roof beam",
  "13. RCC 1:2:4 for roof slab", "14. Internal Plastering (12mm)",
  "15. External Plastering (20mm)", "16. Ceiling Plastering (10mm)",
  "17. PCC 1:4:8 for flooring", "18. Vitrified tile flooring",
  "19. Toilet wall tiling", "20. Toilet floor tiling",
  "21. Main door", "22. Internal doors", "23. PVC doors",
  "24. UPVC Windows", "25. UPVC Ventilators", "26. Kitchen Granite",
  "27. Kitchen wall tiles", "28. Wall Painting (Internal)",
  "29. Wall Painting (External)", "30. Ceiling Painting",
  "31. Parapet brickwork", "32. Weathering course",
  "33. Septic tank", "34. Water tank (UG)", "35. Compound wall",
  "36. Main gate", "37. Electrical - LS", "38. Sanitary - LS"
];

export default function DetailedConstructionEstimator() {
  const [projectInfo, setProjectInfo] = useState(() => {
    const saved = localStorage.getItem('est_v21_info');
    return saved ? JSON.parse(saved) : { name: "", client: "" };
  });

  const [sections, setSections] = useState(() => {
    const saved = localStorage.getItem('est_v21_sections');
    return saved ? JSON.parse(saved) : INITIAL_TITLES.map((title, idx) => ({
      id: Date.now() + idx,
      title: title,
      unit: 'Cu.m',
      rate: '',
      lsQty: '0',
      measurements: [{ id: Date.now() + idx + 100, type: 'Add', label: 'Item', nos: '1', l: '0', b: '0', d: '0' }]
    }));
  });

  useEffect(() => {
    localStorage.setItem('est_v21_info', JSON.stringify(projectInfo));
    localStorage.setItem('est_v21_sections', JSON.stringify(sections));
  }, [projectInfo, sections]);

  const computedData = useMemo(() => {
    let grandTotal = 0;
    const processed = sections.map(sec => {
      let totalQty = 0;
      if (sec.unit === 'Lumpsum') {
        totalQty = parseFloat(sec.lsQty) || 0;
      } else {
        totalQty = sec.measurements.reduce((acc, m) => {
          let val = 0;
          const nos = parseFloat(m.nos) || 0;
          const l = parseFloat(m.l) || 0;
          const b = parseFloat(m.b) || 0;
          const d = parseFloat(m.d) || 0;

          if (sec.unit === 'Cu.m') val = nos * l * b * d;
          else if (sec.unit === 'Sq.m') val = nos * l * b;
          else if (sec.unit === 'R.ft') val = nos * l;
          else if (sec.unit === 'Nos') val = nos;
          
          return m.type === 'Add' ? acc + val : acc - val;
        }, 0);
      }
      const rateVal = parseFloat(sec.rate) || 0;
      const amount = totalQty * rateVal;
      grandTotal += amount;
      return { ...sec, totalQty, amount, rateVal };
    });
    return { processed, grandTotal };
  }, [sections]);

  const addCustomSection = () => {
    const newSec = {
      id: Date.now(),
      title: "New Custom Work Item",
      unit: 'Cu.m',
      rate: '',
      lsQty: '0',
      measurements: [{ id: Date.now() + 1, type: 'Add', label: 'Item', nos: '1', l: '0', b: '0', d: '0' }]
    };
    setSections([...sections, newSec]);
  };

  const deleteSection = (id: number) => {
    if (window.confirm("Delete this entire category?")) {
      setSections(sections.filter(s => s.id !== id));
    }
  };

  const updateSection = (id: number, field: string, val: string) => {
    setSections(sections.map(s => s.id === id ? { ...s, [field]: val } : s));
  };

  const updateM = (secId: number, mId: number, field: string, val: string) => {
    setSections(sections.map(s => s.id === secId ? { ...s, measurements: s.measurements.map(m => m.id === mId ? { ...m, [field]: val } : m) } : s));
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("DETAILED CONSTRUCTION ESTIMATE", 105, 15, { align: 'center' });
    
    const tableRows = computedData.processed
      .filter(s => Math.abs(s.totalQty) > 0)
      .map(s => [s.title, s.unit, s.totalQty.toFixed(2), s.rateVal > 0 ? s.rateVal.toLocaleString() : "—", s.amount > 0 ? s.amount.toLocaleString() : "—"]);

    autoTable(doc, {
      startY: 30,
      head: [['Description', 'Unit', 'Qty', 'Rate (Rs)', 'Amount (Rs)']],
      body: tableRows,
      foot: [['', '', '', 'Total Estimate Amount', `Rs. ${computedData.grandTotal.toLocaleString()}`]],
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], halign: 'center' },
      footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' }
    });
    doc.save("Estimate_Report.pdf");
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', background: '#f1f5f9', minHeight: '100vh', paddingBottom: '180px' }}>
      <div style={{ background: '#0f172a', color: 'white', padding: '20px 15px', textAlign: 'center' }}>
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>DETAILED CONSTRUCTION ESTIMATE</h2>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '10px' }}>
            <button onClick={addCustomSection} style={{ background: '#10b981', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>+ ADD CUSTOM ITEM</button>
            <button onClick={() => { if(window.confirm("Clear All?")) { localStorage.clear(); window.location.reload(); }}} style={resetStyle}>RESET ALL</button>
        </div>
      </div>

      <div style={{ background: '#fff', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', borderBottom: '1px solid #ddd' }}>
        <input placeholder="Project Name" value={projectInfo.name} style={headerInp} onChange={e => setProjectInfo({...projectInfo, name: e.target.value})} />
        <input placeholder="Client Name" value={projectInfo.client} style={headerInp} onChange={e => setProjectInfo({...projectInfo, client: e.target.value})} />
      </div>

      <div style={{ padding: '8px' }}>
        {computedData.processed.map((sec) => (
          <div key={sec.id} style={{ background: '#fff', marginBottom: '15px', borderRadius: '8px', border: '1px solid #cbd5e1', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
            <div style={{ background: '#334155', padding: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <textarea value={sec.title} onChange={(e) => updateSection(sec.id, 'title', e.target.value)} style={titleArea} rows={1} />
                <button onClick={() => deleteSection(sec.id)} style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', fontSize: '9px', padding: '2px 5px' }}>DELETE</button>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <select value={sec.unit} onChange={(e) => updateSection(sec.id, 'unit', e.target.value)} style={dropStyle}>
                  <option value="Cu.m">Cu.m</option>
                  <option value="Sq.m">Sq.m</option>
                  <option value="Nos">Nos</option>
                  <option value="R.ft">R.ft</option>
                  <option value="Lumpsum">Lumpsum</option>
                </select>
                <input placeholder="Rate Rs." type="number" value={sec.rate} onChange={(e) => updateSection(sec.id, 'rate', e.target.value)} style={rateInp} />
              </div>
            </div>

            <div style={{ padding: '5px' }}>
              {sec.unit === 'Lumpsum' ? (
                <input type="number" placeholder="Enter Total Quantity" value={sec.lsQty} onChange={e => updateSection(sec.id, 'lsQty', e.target.value)} style={{ width: '90%', margin: '10px auto', display: 'block', padding: '10px', border: '1px solid #ddd' }} />
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                  <thead style={{ background: '#f8fafc' }}>
                    <tr>
                      <th style={tdStyle}>Desc</th>
                      <th style={tdStyle}>Nos</th>
                      {(sec.unit === 'Cu.m' || sec.unit === 'R.ft') && <th style={tdStyle}>L</th>}
                      {(sec.unit === 'Cu.m' || sec.unit === 'Sq.m') && <th style={tdStyle}>B</th>}
                      {sec.unit === 'Cu.m' && <th style={tdStyle}>D</th>}
                      {sec.unit === 'Sq.m' && <th style={tdStyle}>L</th>}
                      <th style={tdStyle}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {sec.measurements.map(m => (
                      <tr key={m.id} style={{ background: m.type === 'Ded' ? '#fff1f2' : 'white' }}>
                        <td style={tdStyle}><input value={m.label} onChange={e => updateM(sec.id, m.id, 'label', e.target.value)} style={cellInp} /></td>
                        <td style={tdStyle}><input type="number" value={m.nos} onChange={e => updateM(sec.id, m.id, 'nos', e.target.value)} style={cellInp} /></td>
                        {(sec.unit === 'Cu.m' || sec.unit === 'Sq.m' || sec.unit === 'R.ft') && <td style={tdStyle}><input type="number" value={m.l} onChange={e => updateM(sec.id, m.id, 'l', e.target.value)} style={cellInp} /></td>}
                        {(sec.unit === 'Cu.m' || sec.unit === 'Sq.m') && <td style={tdStyle}><input type="number" value={m.b} onChange={e => updateM(sec.id, m.id, 'b', e.target.value)} style={cellInp} /></td>}
                        {sec.unit === 'Cu.m' && <td style={tdStyle}><input type="number" value={m.d} onChange={e => updateM(sec.id, m.id, 'd', e.target.value)} style={cellInp} /></td>}
                        <td style={tdStyle}><button onClick={() => setSections(sections.map(s => s.id === sec.id ? {...s, measurements: s.measurements.filter(row => row.id !== m.id)} : s))} style={{ border: 'none', background: 'transparent' }}>🗑️</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div style={{ padding: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                {sec.unit !== 'Lumpsum' && <>
                  <button onClick={() => setSections(sections.map(s => s.id === sec.id ? {...s, measurements: [...s.measurements, { id: Date.now(), type: 'Add', label: 'Item', nos: '1', l: '0', b: '0', d: '0' }]} : s))} style={addBtn}>+ Add</button>
                  <button onClick={() => setSections(sections.map(s => s.id === sec.id ? {...s, measurements: [...s.measurements, { id: Date.now(), type: 'Ded', label: 'Deduction', nos: '1', l: '0', b: '0', d: '0' }]} : s))} style={{ ...addBtn, background: '#e11d48' }}>- Ded</button>
                </>}
              </div>
              <div style={{ textAlign: 'right', fontSize: '11px', fontWeight: 'bold' }}>
                 {sec.totalQty.toFixed(2)} {sec.unit} | ₹{sec.amount.toLocaleString()}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={stickyFoot}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b' }}>ESTIMATE TOTAL</span>
          <span style={{ fontSize: '20px', fontWeight: '900' }}>₹ {computedData.grandTotal.toLocaleString()}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <button onClick={generatePDF} style={mainBtn}>DOWNLOAD PDF 📄</button>
          <button onClick={() => {
            let msg = `*CONSTRUCTION ESTIMATE*\n*Project:* ${projectInfo.name}\n*Total:* ₹${computedData.grandTotal.toLocaleString()}\n\n`;
            computedData.processed.filter(s => s.totalQty !== 0).forEach(s => msg += `✅ ${s.title}: ${s.totalQty.toFixed(2)} ${s.unit}\n`);
            window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
          }} style={{ ...mainBtn, background: '#16a34a' }}>WHATSAPP ✅</button>
        </div>
      </div>
    </div>
  );
}

const tdStyle = { border: '1px solid #e2e8f0', padding: '4px', textAlign: 'center' as const };
const cellInp = { width: '100%', border: 'none', textAlign: 'center' as const, fontSize: '12px', background: 'transparent' };
const headerInp = { padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '14px' };
const titleArea = { width: '100%', background: 'transparent', border: 'none', color: 'white', fontWeight: 'bold' as const, fontSize: '13px', resize: 'none' as const };
const dropStyle = { padding: '4px', borderRadius: '4px', border: 'none', fontSize: '12px', background: '#f1f5f9' };
const rateInp = { padding: '4px 8px', borderRadius: '4px', border: 'none', fontSize: '12px', width: '80px' };
const addBtn = { padding: '6px 8px', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' as const };
const stickyFoot = { position: 'fixed' as const, bottom: 0, left: 0, right: 0, background: 'white', padding: '16px 20px', borderTop: '2px solid #0f172a', zIndex: 1000 };
const mainBtn = { padding: '12px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold' as const, fontSize: '14px' };
const resetStyle = { background: '#ef4444', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' as const };
