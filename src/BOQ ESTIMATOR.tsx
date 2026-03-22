import React, { useState, useMemo, useCallback, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- 1. FULL IMAGE DATA & ENGINEERING LOGIC ---
const ENG_LOGIC = { cement: 0.42, steel: 4.0, sand: 1.8, aggregate: 1.35, bricks: 22, paint: 0.25, tiles: 1.1 };

// FULL DATABASE FROM IMAGE 3 (29 ITEMS)
const IMAGE_MATERIAL_LIST = [
  { item: "Sand", spec: "M-Sand & P-Sand", unit: "Cft", constant: ENG_LOGIC.sand },
  { item: "Brick", spec: "Chamber brick / Fly-Ash (Basement)", unit: "Nos", constant: ENG_LOGIC.bricks },
  { item: "Cement", spec: "Chettinad / Ramco Super Plast / UltraTech", unit: "Bags", constant: ENG_LOGIC.cement },
  { item: "Steel", spec: "Fe 550D TMT Bars PULKIT", unit: "Kgs", constant: ENG_LOGIC.steel },
  { item: "Window Grill", spec: "12mm Square Rod (Ladder Design)", unit: "Kg", constant: 1.5 },
  { item: "Window & Door", spec: "Teak Wood / UPVC (Client's Choice)", unit: "Standard", constant: 0 },
  { item: "Maindoor", spec: "Teak Shutter", unit: "Nos", constant: 0 },
  { item: "Bedroom Doors", spec: "Readymade Skin Doors", unit: "Nos", constant: 0 },
  { item: "Hand Rail", spec: "Stainless Steel Tubes (ISI/ISO)- JINDAL Brand", unit: "Rft", constant: 0.15 },
  { item: "Chemicals", spec: "Dr. Fixit, Bostik, Building Doctor", unit: "LS", constant: 0 },
  { item: "Pest Protector", spec: "Terminator (Basement & Wooden Joineries)", unit: "LS", constant: 0 },
  { item: "Terrace", spec: "Professional Water Proofing (Asian Paints)", unit: "Sft", constant: 1 },
  { item: "Tiles", spec: "KAG, Millenium (55/Sft)", unit: "Sft", constant: ENG_LOGIC.tiles },
  { item: "Paints", spec: "Asian Paints (Apex/Advanced)", unit: "Ltr", constant: ENG_LOGIC.paint },
  { item: "Plumbing", spec: "Avon Plast, Aashirvad, Trubore, Finolex", unit: "LS", constant: 0 },
  { item: "Electrical", spec: "Finolex Pipes & GM Metal Concealed Box", unit: "LS", constant: 0 },
  { item: "Wires", spec: "RR / Kundan", unit: "Coils", constant: 0.05 },
  { item: "Switches", spec: "Legrand / GM / Lisha (Modular)", unit: "Nos", constant: 0.35 },
  { item: "MCB", spec: "Legrand, Crompton", unit: "Nos", constant: 0.02 },
  { item: "Closet", spec: "Parryware / Jaquar", unit: "Nos", constant: 0 },
  { item: "Bath Fitting", spec: "Johnson Pedder / Jaquar (Modular)", unit: "Nos", constant: 0 },
  { item: "Kitchen Table", spec: "Table Top Granite", unit: "Sft", constant: 0.04 },
  { item: "Sink", spec: "Prayag (Stainless Steel)", unit: "Nos", constant: 0 },
  { item: "Lock (Main)", spec: "Godrej / Europa", unit: "Nos", constant: 1 },
  { item: "Lock (Bedroom)", spec: "Millarco Mortice Lock", unit: "Nos", constant: 0 },
  { item: "Window Lock", spec: "L Shaped Tower bolt Lock", unit: "Nos", constant: 0 },
  { item: "Window Glass", spec: "White Pin-Head / Clear Glass", unit: "Sft", constant: 0.15 },
  { item: "Stainless Steel", spec: "Jindal 304 Grade", unit: "Standard", constant: 0 }
];

interface BOQItem { id: number; desc: string; qty: number; rate: number; unit: string; }

const FastInput = ({ value, onSave, type = "text", style, placeholder }: any) => {
  const [local, setLocal] = useState(value);
  useEffect(() => { setLocal(value); }, [value]);
  return (
    <input type={type} value={local} onChange={(e) => setLocal(e.target.value)} onBlur={() => onSave(type === "number" ? Number(local) : local)} style={style} placeholder={placeholder}/>
  );
};

export default function MasterBOQEstimator() {
  const [projectName, setProjectName] = useState("Mr. Prasanna Project");
  const [clientName, setClientName] = useState("Mr. Prasanna");
  const [location, setLocation] = useState("Vandipalayam, Cuddalore");
  const [builtArea, setBuiltArea] = useState<number>(1057.5);
  const [projectDate, setProjectDate] = useState(new Date().toISOString().split('T')[0]);

  // INITIAL STATE INCLUDES ALL DATA FROM IMAGES 1 & 2
  const [items, setItems] = useState<BOQItem[]>([
    { id: 1, desc: "Ground Floor Construction Area (22.5' x 47')", qty: 1057.5, rate: 2500, unit: "Sft" },
    { id: 2, desc: "First Floor Construction Area (22.5' x 47')", qty: 1057.5, rate: 2500, unit: "Sft" },
    { id: 3, desc: "Second Floor House Construction Area", qty: 191.25, rate: 2500, unit: "Sft" },
    { id: 4, desc: "Compound Wall (80 Ft Length)", qty: 80, rate: 2500, unit: "Rft" },
    { id: 5, desc: "Brick Water sump (2000 L) + 1 HP motor", qty: 1, rate: 150000, unit: "Nos" },
    { id: 6, desc: "Borewell with 1 HP Jet Pump", qty: 1, rate: 80000, unit: "Nos" },
    { id: 7, desc: "3 Phase E.B. Supply & Temp EB", qty: 2, rate: 50000, unit: "Nos" },
    { id: 8, desc: "Plan Approval Fee and Expenses", qty: 1, rate: 75000, unit: "LS" },
    { id: 9, desc: "Property tax assessment", qty: 1, rate: 50000, unit: "LS" },
    { id: 10, desc: "UGD connection", qty: 1, rate: 40000, unit: "LS" }
  ]);

  const totals = useMemo(() => ({
    cost: items.reduce((sum, i) => sum + (i.qty * i.rate), 0)
  }), [items]);

  const updateItem = useCallback((id: number, field: keyof BOQItem, val: any) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: val } : i));
  }, []);

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("MASTER CONSTRUCTION QUOTATION", 105, 15, { align: 'center' });
    
    doc.setFontSize(9);
    doc.text(`Quotation For: ${clientName} | Location: ${location}`, 14, 25);
    doc.text(`Project: ${projectName} | Date: ${projectDate}`, 14, 30);

    // Table 1: Construction & Additional Expenses (Images 1 & 2)
    autoTable(doc, {
      startY: 35,
      head: [['Description', 'Quantity', 'Rate', 'Amount']],
      body: items.map(i => [i.desc, `${i.qty} ${i.unit}`, `Rs.${i.rate}`, `Rs.${(i.qty * i.rate).toLocaleString()}`]),
      foot: [['', '', 'TOTAL CONTRACT VALUE', `Rs. ${totals.cost.toLocaleString()}`]],
      theme: 'grid', headStyles: { fillColor: [15, 23, 42] }
    });

    // Table 2: Full Material Specification (Image 3 - 29 Items)
    const matRows = IMAGE_MATERIAL_LIST.map(m => [
      m.item, m.spec, m.constant > 0 ? `${Math.round(builtArea * m.constant)} ${m.unit}` : "As Required", "Included"
    ]);

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [[{ content: 'MATERIALS TO BE USED & CONSUMPTION REPORT', colSpan: 4, styles: { halign: 'center' } }]],
      body: matRows,
      theme: 'striped', headStyles: { fillColor: [184, 134, 11] }
    });

    doc.save(`${clientName}_Complete_BOQ.pdf`);
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h2 style={{ margin: 0 }}>UNIQ DESIGNS BOQ</h2>
        <button onClick={() => setItems([...items, { id: Date.now(), desc: "Custom Item", qty: 1, rate: 0, unit: "Nos" }])} style={addBtn}>+ ADD ITEM</button>
      </div>

      <div style={cardStyle}>
        <div style={grid2}>
          <div style={f1}><label style={miniLabel}>Client Name</label><FastInput value={clientName} onSave={setClientName} style={detailInp} /></div>
          <div style={f1}><label style={miniLabel}>Location</label><FastInput value={location} onSave={setLocation} style={detailInp} /></div>
        </div>
        <div style={{ marginTop: '10px', textAlign: 'center' }}>
          <label style={labelStyle}>Reference Area for Materials (Sq.Ft)</label>
          <FastInput type="number" value={builtArea} onSave={setBuiltArea} style={areaInput} />
        </div>
      </div>

      <div style={scrollArea}>
        <h3 style={{ fontSize: '14px', padding: '10px 0' }}>Detailed Work Specifications</h3>
        {items.map(item => (
          <div key={item.id} style={itemCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <FastInput value={item.desc} onSave={(v: any) => updateItem(item.id, 'desc', v)} style={itemTitle} />
              <button onClick={() => setItems(prev => prev.filter(i => i.id !== item.id))} style={delBtn}>✕</button>
            </div>
            <div style={inputRow}>
              <div style={f1}><span style={miniLabel}>Qty</span><FastInput type="number" value={item.qty} style={smallInp} onSave={(v: any) => updateItem(item.id, 'qty', v)} /></div>
              <div style={f1}><span style={miniLabel}>Rate</span><FastInput type="number" value={item.rate} style={smallInp} onSave={(v: any) => updateItem(item.id, 'rate', v)} /></div>
              <div style={rowTotal}>₹{(item.qty * item.rate).toLocaleString()}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={floatingFooter}>
        <div style={footerMain}>
          <div><div style={miniLabel}>GRAND TOTAL</div><div style={totalVal}>₹ {totals.cost.toLocaleString()}</div></div>
          <button onClick={() => window.open(`https://wa.me/?text=BOQ for ${clientName}: ₹${totals.cost.toLocaleString()}`)} style={waBtn}>SHARE</button>
        </div>
        <button onClick={generatePDF} style={pdfBtn}>DOWNLOAD FULL PDF REPORT 📄</button>
      </div>
    </div>
  );
}

// --- CSS STYLING (Optimized for Mobile) ---
const containerStyle = { maxWidth: '500px', margin: '0 auto', background: '#f8fafc', minHeight: '100vh', paddingBottom: '160px', fontFamily: 'sans-serif' };
const headerStyle = { background: '#0f172a', color: 'white', padding: '25px 15px', textAlign: 'center' as const };
const addBtn = { background: '#16a34a', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold' as const };
const cardStyle = { background: 'white', margin: '-20px 15px 15px 15px', padding: '15px', borderRadius: '15px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', position: 'relative' as const, zIndex: 10 };
const grid2 = { display: 'flex', gap: '8px' };
const f1 = { flex: 1 };
const detailInp = { width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px', outline: 'none', boxSizing: 'border-box' as const };
const areaInput = { width: '100%', padding: '12px', border: '2px solid #0f172a', borderRadius: '10px', fontSize: '20px', fontWeight: 'bold' as const, textAlign: 'center' as const };
const labelStyle = { fontSize: '11px', color: '#64748b', fontWeight: 'bold' as const };
const miniLabel = { fontSize: '10px', color: '#94a3b8', fontWeight: 'bold' as const };
const scrollArea = { padding: '0 15px' };
const itemCard = { background: 'white', padding: '15px', borderRadius: '12px', marginBottom: '8px', border: '1px solid #e2e8f0' };
const itemTitle = { border: 'none', fontWeight: 'bold' as const, fontSize: '13px', width: '85%', outline: 'none' };
const inputRow = { display: 'flex', gap: '10px', alignItems: 'flex-end', marginTop: '8px' };
const smallInp = { width: '100%', border: '1px solid #f1f5f9', padding: '8px', borderRadius: '8px', fontSize: '14px', background: '#f8fafc' };
const rowTotal = { fontWeight: '900' as const, fontSize: '15px', color: '#0f172a', minWidth: '90px', textAlign: 'right' as const };
const delBtn = { color: '#ef4444', background: 'none', border: 'none', fontSize: '18px' };
const floatingFooter = { position: 'fixed' as const, bottom: 0, width: '100%', maxWidth: '500px', background: 'white', padding: '20px', borderTop: '2px solid #0f172a', zIndex: 1000, boxSizing: 'border-box' as const };
const footerMain = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' };
const totalVal = { fontSize: '24px', fontWeight: '900' as const, color: '#16a34a' };
const pdfBtn = { width: '100%', padding: '16px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold' as const, fontSize: '14px' };
const waBtn = { padding: '10px 20px', background: '#25D366', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold' as const };
