import React, { useState, useMemo, useCallback, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- 1. FULL IMAGE DATA & LOGIC HUB ---
const ENG_LOGIC = {
  cement: 0.42, steel: 4.0, sand: 1.8, aggregate: 1.35, bricks: 22, paint: 0.25, tiles: 1.1
};

// Material Database from Image 3
const MATERIAL_SPECS = [
  { item: "Sand", spec: "M-Sand & P-Sand", unit: "Cft", constant: ENG_LOGIC.sand },
  { item: "Brick", spec: "Chamber brick / Fly-Ash (Basement)", unit: "Nos", constant: ENG_LOGIC.bricks },
  { item: "Cement", spec: "Chettinad / Ramco Super Plast / UltraTech", unit: "Bags", constant: ENG_LOGIC.cement },
  { item: "Steel", spec: "Fe 550D TMT Bars PULKIT", unit: "Kgs", constant: ENG_LOGIC.steel },
  { item: "Window Grill", spec: "12mm Square Rod (Ladder Design)", unit: "Kg", constant: 1.5 }, // Logic per Sft
  { item: "Window & Door", spec: "Teak Wood / UPVC", unit: "Nos", constant: 0 },
  { item: "Maindoor", spec: "Teak Shutter", unit: "Nos", constant: 0 },
  { item: "Bedroom Doors", spec: "Readymade Skin Doors", unit: "Nos", constant: 0 },
  { item: "Hand Rail", spec: "Stainless Steel (ISI/ISO) JINDAL", unit: "Rft", constant: 0.15 },
  { item: "Chemicals", spec: "Dr. Fixit, Bostik", unit: "LS", constant: 0 },
  { item: "Pest Protector", spec: "Terminator (Basement & Wood)", unit: "LS", constant: 0 },
  { item: "Terrace", spec: "Water Proofing (Asian Paints)", unit: "Sft", constant: 1 },
  { item: "Tiles", spec: "KAG, Millenium (55/Sft)", unit: "Sft", constant: ENG_LOGIC.tiles },
  { item: "Paints", spec: "Asian Paints (Apex/Advanced)", unit: "Ltr", constant: ENG_LOGIC.paint },
  { item: "Plumbing", spec: "Avon Plast, Trubore, Finolex", unit: "LS", constant: 0 },
  { item: "Electrical", spec: "Finolex Pipes & GM Metal Box", unit: "LS", constant: 0 },
  { item: "Wires", spec: "RR / Kundan", unit: "Coil", constant: 0.05 },
  { item: "Switches", spec: "Legrand / GM / Lisha (Modular)", unit: "Nos", constant: 0.3 },
  { item: "Closet/Bath", spec: "Parryware / Jaquar / Johnson", unit: "Nos", constant: 0 },
  { item: "Lock (Main)", spec: "Godrej / Europa", unit: "Nos", constant: 1 }
];

interface BOQItem {
  id: number; desc: string; qty: number; rate: number; unit: string;
}

const EditableInput = ({ value, onSave, type = "text", style, placeholder }: any) => {
  const [localVal, setLocalVal] = useState(value);
  useEffect(() => { setLocalVal(value); }, [value]);
  const handleBlur = () => onSave(localVal);
  return (
    <input type={type} value={localVal} onChange={(e) => setLocalVal(e.target.value)} onBlur={handleBlur} style={style} placeholder={placeholder}/>
  );
};

export default function MasterBOQEstimator() {
  const [projectName, setProjectName] = useState("Residential Building");
  const [clientName, setClientName] = useState("Mr. Rajendran");
  const [location, setLocation] = useState("Musiri, Trichy");
  const [builtArea, setBuiltArea] = useState<number>(1500);
  const [projectDate, setProjectDate] = useState(new Date().toISOString().split('T')[0]);

  const [items, setItems] = useState<BOQItem[]>([
    { id: 1, desc: "Ground Floor Construction (Framed)", qty: 1500, rate: 2300, unit: "Sft" },
    { id: 2, desc: "UG Septic Tank (6000 Ltrs)", qty: 6000, rate: 15, unit: "Ltr" },
    { id: 3, desc: "UG Sump (4000 Ltrs) + 1HP Motor", qty: 4000, rate: 15, unit: "Ltr" },
    { id: 4, desc: "Borewell with 1 HP Jet Pump", qty: 1, rate: 85000, unit: "Nos" }
  ]);

  const totals = useMemo(() => {
    return { cost: items.reduce((sum, i) => sum + (i.qty * i.rate), 0) };
  }, [items]);

  const updateItem = useCallback((id: number, field: keyof BOQItem, val: any) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: val } : i));
  }, []);

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("CONSTRUCTION BOQ & MATERIAL SPECIFICATION", 105, 15, { align: 'center' });
    
    // Header Info
    doc.setFontSize(9);
    doc.text(`Project: ${projectName}`, 14, 25);
    doc.text(`Client: ${clientName}`, 14, 30);
    doc.text(`Location: ${location}`, 14, 35);
    doc.text(`Date: ${projectDate}`, 160, 25);
    doc.text(`Area: ${builtArea} Sft`, 160, 30);

    // Table 1: Construction Work Cost
    autoTable(doc, {
      startY: 40,
      head: [['Work Description', 'Quantity', 'Rate', 'Amount']],
      body: items.map(i => [i.desc, `${i.qty} ${i.unit}`, `Rs.${i.rate}`, `Rs.${(i.qty * i.rate).toLocaleString()}`]),
      foot: [['', '', 'TOTAL CONSTRUCTION COST', `Rs. ${totals.cost.toLocaleString()}`]],
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42] }
    });

    // Table 2: Full Material Specification (From Image 3)
    const matRows = MATERIAL_SPECS.map(m => [
      m.item, m.spec, m.constant > 0 ? `${Math.round(builtArea * m.constant)} ${m.unit}` : "As per design", "Included"
    ]);

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [[{ content: 'MATERIALS TO BE USED (SPECIFICATION & QUANTITY)', colSpan: 4, styles: { halign: 'center' } }]],
      body: matRows,
      theme: 'striped',
      headStyles: { fillColor: [184, 134, 11] }
    });

    doc.save(`${clientName}_BOQ_Report.pdf`);
  };

  const shareWA = () => {
    const msg = `*UNIQ DESIGNS BOQ*\nProject: ${projectName}\nClient: ${clientName}\nArea: ${builtArea} Sft\nTotal: ₹${totals.cost.toLocaleString()}\n\n*Materials:* Ramco Cement, Pulkit Steel, Teak Wood doors included.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h2 style={{ margin: 0 }}>BOQ ESTIMATOR</h2>
        <button onClick={() => setItems([...items, { id: Date.now(), desc: "Custom Work", qty: 1, rate: 0, unit: "Nos" }])} style={addBtn}>+ ADD WORK</button>
      </div>

      <div style={areaCard}>
        <div style={grid2}>
          <div style={f1}><label style={miniLabel}>Project Name</label><EditableInput value={projectName} onSave={setProjectName} style={detailInp} /></div>
          <div style={f1}><label style={miniLabel}>Date</label><input type="date" value={projectDate} onChange={e => setProjectDate(e.target.value)} style={detailInp} /></div>
        </div>
        <div style={{ marginTop: '8px' }}>
          <label style={miniLabel}>Client Name & Location</label>
          <div style={grid2}>
            <EditableInput value={clientName} onSave={setClientName} style={detailInp} />
            <EditableInput value={location} onSave={setLocation} style={detailInp} />
          </div>
        </div>
        <div style={{ marginTop: '10px', textAlign: 'center' }}>
          <label style={labelStyle}>Total Built-up Area (Sq.Ft)</label>
          <EditableInput type="number" value={builtArea} onSave={(v: any) => setBuiltArea(Number(v))} style={areaInput} />
        </div>
      </div>

      <div style={scrollArea}>
        {items.map(item => (
          <div key={item.id} style={itemCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <EditableInput value={item.desc} onSave={(v: any) => updateItem(item.id, 'desc', v)} style={itemTitle} />
              <button onClick={() => setItems(prev => prev.filter(i => i.id !== item.id))} style={delBtn}>✕</button>
            </div>
            <div style={inputRow}>
              <div style={f1}><span style={miniLabel}>Qty</span><EditableInput type="number" value={item.qty} style={smallInp} onSave={(v: any) => updateItem(item.id, 'qty', Number(v))} /></div>
              <div style={f1}><span style={miniLabel}>Rate</span><EditableInput type="number" value={item.rate} style={smallInp} onSave={(v: any) => updateItem(item.id, 'rate', Number(v))} /></div>
              <div style={rowTotal}>₹{(item.qty * item.rate).toLocaleString()}</div>
            </div>
          </div>
        ))}
        
        <div style={materialSection}>
          <h4 style={{ margin: '0 0 10px 0' }}>Material Transparency Preview</h4>
          {MATERIAL_SPECS.filter(m => m.constant > 0).map(m => (
            <div key={m.item} style={matPreviewRow}>
              <span>{m.item} ({m.unit})</span>
              <b>{Math.round(builtArea * m.constant)}</b>
            </div>
          ))}
        </div>
      </div>

      <div style={floatingFooter}>
        <div style={footerMain}>
          <div><div style={{ fontSize: '10px', color: '#64748b' }}>TOTAL BUDGET</div><div style={{ fontSize: '22px', fontWeight: 'bold', color: '#16a34a' }}>₹ {totals.cost.toLocaleString()}</div></div>
          <button onClick={shareWA} style={waBtn}>WHATSAPP</button>
        </div>
        <button onClick={generatePDF} style={pdfBtn}>DOWNLOAD COMPLETE MASTER REPORT 📄</button>
      </div>
    </div>
  );
}

// --- STYLES ---
const containerStyle = { maxWidth: '100%', minHeight: '100vh', background: '#f1f5f9', paddingBottom: '160px', fontFamily: 'sans-serif' };
const headerStyle = { background: '#0f172a', color: 'white', padding: '25px 15px', textAlign: 'center' as const };
const addBtn = { background: '#16a34a', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', marginTop: '10px' };
const areaCard = { background: 'white', margin: '-20px 10px 10px 10px', padding: '15px', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', position: 'relative' as const, zIndex: 10 };
const grid2 = { display: 'flex', gap: '8px' };
const f1 = { flex: 1 };
const detailInp = { width: '100%', padding: '6px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '12px', outline: 'none' };
const areaInput = { width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '18px', fontWeight: 'bold' as const, textAlign: 'center' as const, marginTop: '5px' };
const labelStyle = { fontSize: '11px', color: '#64748b', fontWeight: 'bold' as const };
const miniLabel = { fontSize: '10px', color: '#94a3b8' };
const scrollArea = { padding: '0 10px' };
const itemCard = { background: 'white', padding: '12px', borderRadius: '10px', marginBottom: '8px', border: '1px solid #e2e8f0' };
const itemTitle = { border: 'none', fontWeight: 'bold' as const, fontSize: '13px', width: '85%', outline: 'none' };
const inputRow = { display: 'flex', gap: '10px', alignItems: 'flex-end', marginTop: '8px' };
const smallInp = { width: '100%', border: '1px solid #f1f5f9', padding: '6px', borderRadius: '6px', fontSize: '13px', background: '#f8fafc' };
const rowTotal = { fontWeight: 'bold' as const, fontSize: '14px', color: '#334155', minWidth: '85px', textAlign: 'right' as const };
const delBtn = { color: '#ef4444', background: 'none', border: 'none', fontSize: '16px' };
const materialSection = { background: '#0f172a', color: 'white', padding: '15px', borderRadius: '12px', marginTop: '15px' };
const matPreviewRow = { display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #1e293b', fontSize: '11px' };
const floatingFooter = { position: 'fixed' as const, bottom: 0, width: '100%', background: 'white', padding: '15px', borderTop: '2px solid #0f172a', zIndex: 1000, boxSizing: 'border-box' as const };
const footerMain = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' };
const pdfBtn = { width: '100%', padding: '14px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold' as const };
const waBtn = { padding: '10px 15px', background: '#22c55e', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold' as const, fontSize: '12px' };
