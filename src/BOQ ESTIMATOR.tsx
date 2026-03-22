import React, { useState, useMemo, useCallback, useEffect } from 'react';
// FIXED: Changed 'jsPDF' to 'jspdf' to solve Vercel build error
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- 1. ENGINEERING STANDARDS & IMAGE DATA ---
const ENG_LOGIC = { 
  cement: 0.42, steel: 4.0, sand: 1.8, aggregate: 1.35, bricks: 22, paint: 0.25, tiles: 1.1 
};

// FULL DATABASE FROM IMAGE 3
const MATERIAL_SPECS = [
  { item: "Sand", spec: "M-Sand & P-Sand", unit: "Cft", constant: ENG_LOGIC.sand },
  { item: "Brick", spec: "Chamber brick / Fly-Ash (Basement)", unit: "Nos", constant: ENG_LOGIC.bricks },
  { item: "Cement", spec: "Chettinad / Ramco Super Plast / UltraTech", unit: "Bags", constant: ENG_LOGIC.cement },
  { item: "Steel", spec: "Fe 550D TMT Bars PULKIT", unit: "Kgs", constant: ENG_LOGIC.steel },
  { item: "Window Grill", spec: "12mm Square Rod (Ladder Design)", unit: "Kg", constant: 1.5 },
  { item: "Window & Door", spec: "Teak Wood / UPVC", unit: "Nos", constant: 0 },
  { item: "Maindoor", spec: "Teak Shutter", unit: "Nos", constant: 0 },
  { item: "Bedroom Doors", spec: "Readymade Skin Doors", unit: "Nos", constant: 0 },
  { item: "Hand Rail", spec: "Stainless Steel (ISI/ISO) JINDAL", unit: "Rft", constant: 0.15 },
  { item: "Chemicals", spec: "Dr. Fixit, Bostik, Building Doctor", unit: "LS", constant: 0 },
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

interface BOQItem { id: number; desc: string; qty: number; rate: number; unit: string; }

const FastInput = ({ value, onSave, type = "text", style, placeholder }: any) => {
  const [local, setLocal] = useState(value);
  useEffect(() => { setLocal(value); }, [value]);
  
  return (
    <input 
      type={type} 
      value={local} 
      onChange={(e) => setLocal(e.target.value)} 
      onBlur={() => onSave(type === "number" ? Number(local) : local)}
      style={style} 
      placeholder={placeholder}
    />
  );
};

export default function MasterBOQEstimator() {
  const [projectName, setProjectName] = useState("Residential Villa");
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

  const totals = useMemo(() => ({
    cost: items.reduce((sum, i) => sum + (i.qty * i.rate), 0)
  }), [items]);

  const updateItem = useCallback((id: number, field: keyof BOQItem, val: any) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: val } : i));
  }, []);

  const deleteItem = (id: number) => setItems(prev => prev.filter(i => i.id !== id));
  const addItem = () => setItems(prev => [...prev, { id: Date.now(), desc: "Custom Work Detail", qty: 1, rate: 0, unit: "Nos" }]);

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("MASTER BOQ & MATERIAL SPECIFICATION", 105, 15, { align: 'center' });
    
    doc.setFontSize(9);
    doc.text(`Project: ${projectName} | Client: ${clientName}`, 14, 25);
    doc.text(`Location: ${location} | Date: ${projectDate}`, 14, 30);
    doc.text(`Total Area: ${builtArea} Sq.Ft`, 160, 25);

    autoTable(doc, {
      startY: 35,
      head: [['Work Description', 'Quantity', 'Rate', 'Amount']],
      body: items.map(i => [i.desc, `${i.qty} ${i.unit}`, `Rs.${i.rate}`, `Rs.${(i.qty * i.rate).toLocaleString()}`]),
      foot: [['', '', 'TOTAL CONSTRUCTION COST', `Rs. ${totals.cost.toLocaleString()}`]],
      theme: 'grid', headStyles: { fillColor: [15, 23, 42] }
    });

    const matRows = MATERIAL_SPECS.map(m => [
      m.item, m.spec, m.constant > 0 ? `${Math.round(builtArea * m.constant)} ${m.unit}` : "Standard", "Included"
    ]);

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [[{ content: 'DETAILED MATERIAL SPECIFICATIONS (TRANSPARENCY)', colSpan: 4, styles: { halign: 'center' } }]],
      body: matRows,
      theme: 'striped', headStyles: { fillColor: [184, 134, 11] }
    });

    doc.save(`${clientName}_BOQ_Report.pdf`);
  };

  const shareWhatsApp = () => {
    const msg = `*UNIQ DESIGNS BOQ*\nClient: ${clientName}\nArea: ${builtArea} Sft\nTotal Budget: ₹${totals.cost.toLocaleString()}\n\n*Material Breakdown:*\n- Cement: ${Math.round(builtArea * 0.42)} Bags\n- Steel: ${Math.round(builtArea * 4)} Kgs`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h2 style={{ margin: 0 }}>BOQ MASTER ESTIMATOR</h2>
        <button onClick={addItem} style={addBtn}>+ ADD WORK ITEM</button>
      </div>

      <div style={cardStyle}>
        <div style={grid2}>
          <div style={f1}><label style={miniLabel}>Project Name</label><FastInput value={projectName} onSave={setProjectName} style={detailInp} /></div>
          <div style={f1}><label style={miniLabel}>Date</label><input type="date" value={projectDate} onChange={e => setProjectDate(e.target.value)} style={detailInp} /></div>
        </div>
        <div style={{ marginTop: '8px' }}>
          <label style={miniLabel}>Client & Location</label>
          <div style={grid2}>
            <FastInput value={clientName} onSave={setClientName} style={detailInp} />
            <FastInput value={location} onSave={setLocation} style={detailInp} />
          </div>
        </div>
        <div style={{ marginTop: '10px', textAlign: 'center' }}>
          <label style={labelStyle}>Total Built-up Area (Sq.Ft)</label>
          <FastInput type="number" value={builtArea} onSave={setBuiltArea} style={areaInput} />
        </div>
      </div>

      <div style={scrollArea}>
        {items.map(item => (
          <div key={item.id} style={itemCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <FastInput value={item.desc} onSave={(v: any) => updateItem(item.id, 'desc', v)} style={itemTitle} />
              <button onClick={() => deleteItem(item.id)} style={delBtn}>✕</button>
            </div>
            <div style={inputRow}>
              <div style={f1}><span style={miniLabel}>Qty</span><FastInput type="number" value={item.qty} style={smallInp} onSave={(v: any) => updateItem(item.id, 'qty', v)} /></div>
              <div style={f1}><span style={miniLabel}>Rate</span><FastInput type="number" value={item.rate} style={smallInp} onSave={(v: any) => updateItem(item.id, 'rate', v)} /></div>
              <div style={rowTotal}>₹{(item.qty * item.rate).toLocaleString()}</div>
            </div>
          </div>
        ))}
        
        <div style={materialSection}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '13px' }}>Material Preview (Engineering Standard)</h4>
          <div style={grid2}>
            {MATERIAL_SPECS.filter(m => m.constant > 0).slice(0, 6).map(m => (
              <div key={m.item} style={matBadge}>
                {m.item}: {Math.round(builtArea * m.constant)} {m.unit}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={floatingFooter}>
        <div style={footerMain}>
          <div><div style={miniLabel}>TOTAL ESTIMATE</div><div style={totalVal}>₹ {totals.cost.toLocaleString()}</div></div>
          <button onClick={shareWhatsApp} style={waBtn}>WHATSAPP</button>
        </div>
        <button onClick={generatePDF} style={pdfBtn}>DOWNLOAD COMPLETE REPORT 📄</button>
      </div>
    </div>
  );
}

const containerStyle = { maxWidth: '500px', margin: '0 auto', background: '#f8fafc', minHeight: '100vh', paddingBottom: '160px', fontFamily: 'sans-serif' };
const headerStyle = { background: '#0f172a', color: 'white', padding: '25px 15px', textAlign: 'center' as const };
const addBtn = { background: '#16a34a', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold' as const };
const cardStyle = { background: 'white', margin: '-20px 15px 15px 15px', padding: '15px', borderRadius: '15px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', position: 'relative' as const, zIndex: 10 };
const grid2 = { display: 'flex', gap: '8px', flexWrap: 'wrap' as const };
const f1 = { flex: 1, minWidth: '100px' };
const detailInp = { width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px', outline: 'none', boxSizing: 'border-box' as const };
const areaInput = { width: '100%', padding: '12px', border: '2px solid #0f172a', borderRadius: '10px', fontSize: '22px', fontWeight: 'bold' as const, textAlign: 'center' as const };
const labelStyle = { fontSize: '11px', color: '#64748b', fontWeight: 'bold' as const, marginBottom: '5px', display: 'block' };
const miniLabel = { fontSize: '10px', color: '#94a3b8', fontWeight: 'bold' as const };
const scrollArea = { padding: '0 15px' };
const itemCard = { background: 'white', padding: '15px', borderRadius: '12px', marginBottom: '8px', border: '1px solid #e2e8f0' };
const itemTitle = { border: 'none', fontWeight: 'bold' as const, fontSize: '13px', width: '85%', outline: 'none' };
const inputRow = { display: 'flex', gap: '10px', alignItems: 'flex-end', marginTop: '8px' };
const smallInp = { width: '100%', border: '1px solid #f1f5f9', padding: '8px', borderRadius: '8px', fontSize: '14px', background: '#f8fafc' };
const rowTotal = { fontWeight: '900' as const, fontSize: '15px', color: '#0f172a', minWidth: '90px', textAlign: 'right' as const };
const delBtn = { color: '#ef4444', background: 'none', border: 'none', fontSize: '18px' };
const materialSection = { background: '#1e293b', color: 'white', padding: '15px', borderRadius: '12px', marginTop: '15px' };
const matBadge = { background: '#334155', padding: '6px', borderRadius: '6px', fontSize: '10px', flex: '1 1 45%' };
const floatingFooter = { position: 'fixed' as const, bottom: 0, width: '100%', maxWidth: '500px', background: 'white', padding: '20px', borderTop: '2px solid #0f172a', zIndex: 1000, boxSizing: 'border-box' as const };
const footerMain = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' };
const totalVal = { fontSize: '26px', fontWeight: '900' as const, color: '#16a34a' };
const pdfBtn = { width: '100%', padding: '16px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold' as const, fontSize: '14px' };
const waBtn = { padding: '10px 20px', background: '#25D366', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold' as const };
