import React, { useState, useMemo, useCallback, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- 1. ENGINEERING LOGIC ---
const ENG_LOGIC = { 
  cement: 0.42, steel: 4.0, sand: 1.8, aggregate: 1.35, bricks: 22, paint: 0.25, tiles: 1.1 
};

// FULL DATABASE FROM IMAGE 3 (29 ITEMS)
const IMAGE_MATERIAL_LIST = [
  { item: "Sand", spec: "M-Sand & P-Sand", unit: "Cft", constant: ENG_LOGIC.sand },
  { item: "Brick", spec: "Chamber brick / Fly-Ash (Basement)", unit: "Nos", constant: ENG_LOGIC.bricks },
  { item: "Cement", spec: "Chettinad / Ramco Super Plast / UltraTech", unit: "Bags", constant: ENG_LOGIC.cement },
  { item: "Steel", spec: "Fe 550D TMT Bars PULKIT", unit: "Kgs", constant: ENG_LOGIC.steel },
  { item: "Window Grill", spec: "12mm Square Rod (Ladder Design)", unit: "Kg", constant: 1.5 },
  { item: "Window & Door", spec: "Teak Wood / UPVC", unit: "Standard", constant: 0 },
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

// --- 2. THE LAG-FIXER: HIGH PERFORMANCE INPUT ---
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

export default function MasterProfessionalBOQ() {
  const [clientName, setClientName] = useState("Mr. Prasanna");
  const [location, setLocation] = useState("Vandipalayam, Cuddalore");
  const [projectDate, setProjectDate] = useState(new Date().toISOString().split('T')[0]);
  const [builtArea, setBuiltArea] = useState<number>(1057.5);

  const [items, setItems] = useState<BOQItem[]>([
    { id: 1, desc: "Ground Floor Construction Area (22.5' x 47')", qty: 1057.5, rate: 2500, unit: "Sft" },
    { id: 2, desc: "First Floor Construction Area (22.5' x 47')", qty: 1057.5, rate: 2500, unit: "Sft" },
    { id: 3, desc: "Second Floor House Construction Area", qty: 191.25, rate: 2500, unit: "Sft" },
    { id: 4, desc: "Brick Water sump (2000 L) + 1 HP motor", qty: 1, rate: 150000, unit: "Nos" },
    { id: 5, desc: "Borewell with 1 HP Jet Pump", qty: 1, rate: 80000, unit: "Nos" },
    { id: 6, desc: "3 Phase E.B. Supply & Temp EB", qty: 2, rate: 50000, unit: "Nos" },
    { id: 7, desc: "Plan Approval Fee and Expenses", qty: 1, rate: 75000, unit: "LS" },
    { id: 8, desc: "Property tax assessment", qty: 1, rate: 50000, unit: "LS" },
    { id: 9, desc: "UGD connection", qty: 1, rate: 40000, unit: "LS" }
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
    doc.setFontSize(18);
    doc.text(`QUOTATION For ${clientName}`, 105, 15, { align: 'center' });
    
    doc.setFontSize(9);
    doc.text(`Location: ${location}`, 14, 25);
    doc.text(`Date: ${projectDate}`, 160, 25);
    doc.text(`Material Reference Area: ${builtArea} Sft`, 14, 30);

    // TABLE 1: CONSTRUCTION COST
    autoTable(doc, {
      startY: 35,
      head: [['Description', 'Quantity', 'Rate', 'Amount']],
      body: items.map(i => [i.desc, `${i.qty} ${i.unit}`, `Rs.${i.rate}`, `Rs.${(i.qty * i.rate).toLocaleString()}`]),
      foot: [['', '', 'TOTAL CONTRACT VALUE', `Rs. ${totals.cost.toLocaleString()}`]],
      theme: 'grid', headStyles: { fillColor: [15, 23, 42] }
    });

    // TABLE 2: MATERIAL CONSUMPTION (BASED ON REFERENCE AREA)
    const matRows = IMAGE_MATERIAL_LIST.map(m => [
      m.item, m.spec, m.constant > 0 ? `${Math.round(builtArea * m.constant)} ${m.unit}` : "As per design", "Included"
    ]);

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [[{ content: 'MATERIAL CONSUMPTION LOGIC (Based on Reference Area)', colSpan: 4, styles: { halign: 'center' } }]],
      body: matRows,
      theme: 'striped', headStyles: { fillColor: [184, 134, 11] }
    });

    doc.save(`Quotation_${clientName}.pdf`);
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h2 style={{ margin: 0, fontSize: '18px' }}>QUOTATION For {clientName}</h2>
        <button onClick={addItem} style={addBtn}>+ ADD WORK ITEM</button>
      </div>

      {/* EDITABLE HEADER SECTION */}
      <div style={cardStyle}>
        <div style={grid2}>
          <div style={f1}>
            <label style={miniLabel}>CLIENT NAME</label>
            <FastInput value={clientName} onSave={setClientName} style={detailInp} />
          </div>
          <div style={f1}>
            <label style={miniLabel}>DATE</label>
            <input type="date" value={projectDate} onChange={e => setProjectDate(e.target.value)} style={detailInp} />
          </div>
        </div>
        <div style={{ marginTop: '10px' }}>
          <label style={miniLabel}>LOCATION</label>
          <FastInput value={location} onSave={setLocation} style={detailInp} />
        </div>
        
        <div style={refAreaBox}>
          <label style={labelStyle}>REFERENCE AREA FOR MATERIALS (Sq.Ft)</label>
          <FastInput type="number" value={builtArea} onSave={setBuiltArea} style={areaInput} />
          <p style={infoText}>*This area automatically calculates the material consumption table in the report.</p>
        </div>
      </div>

      <div style={scrollArea}>
        <h3 style={{ fontSize: '14px', padding: '0 5px 10px 5px', margin: 0 }}>Work Specifications & Expenses</h3>
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
      </div>

      <div style={floatingFooter}>
        <div style={footerMain}>
          <div><div style={miniLabel}>TOTAL QUOTATION</div><div style={totalVal}>₹ {totals.cost.toLocaleString()}</div></div>
          <button onClick={() => window.open(`https://wa.me/?text=Quotation for ${clientName}: ₹${totals.cost.toLocaleString()}`)} style={waBtn}>SHARE</button>
        </div>
        <button onClick={generatePDF} style={pdfBtn}>DOWNLOAD COMPLETE REPORT 📄</button>
      </div>
    </div>
  );
}

// --- CSS STYLING ---
const containerStyle = { maxWidth: '500px', margin: '0 auto', background: '#f8fafc', minHeight: '100vh', paddingBottom: '160px', fontFamily: 'sans-serif' };
const headerStyle = { background: '#0f172a', color: 'white', padding: '25px 15px', textAlign: 'center' as const };
const cardStyle = { background: 'white', margin: '-20px 15px 15px 15px', padding: '15px', borderRadius: '15px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', position: 'relative' as const, zIndex: 10 };
const refAreaBox = { marginTop: '15px', padding: '12px', background: '#f0f9ff', borderRadius: '10px', border: '1px solid #bae6fd' };
const infoText = { fontSize: '10px', color: '#0369a1', margin: '5px 0 0 0', lineHeight: '1.4' };
const grid2 = { display: 'flex', gap: '8px' };
const f1 = { flex: 1 };
const detailInp = { width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px', outline: 'none', boxSizing: 'border-box' as const };
const areaInput = { width: '100%', padding: '10px', border: '2px solid #0369a1', borderRadius: '8px', fontSize: '20px', fontWeight: 'bold' as const, textAlign: 'center' as const };
const labelStyle = { fontSize: '11px', color: '#64748b', fontWeight: 'bold' as const, display: 'block', marginBottom: '5px', textAlign: 'center' as const };
const miniLabel = { fontSize: '10px', color: '#94a3b8', fontWeight: 'bold' as const, textTransform: 'uppercase' as const };
const scrollArea = { padding: '0 15px' };
const itemCard = { background: 'white', padding: '15px', borderRadius: '12px', marginBottom: '10px', border: '1px solid #e2e8f0' };
const itemTitle = { border: 'none', fontWeight: 'bold' as const, fontSize: '13px', width: '85%', outline: 'none' };
const inputRow = { display: 'flex', gap: '10px', alignItems: 'flex-end', marginTop: '10px' };
const smallInp = { width: '100%', border: '1px solid #f1f5f9', padding: '8px', borderRadius: '8px', fontSize: '14px', background: '#f8fafc' };
const rowTotal = { fontWeight: '900' as const, fontSize: '15px', color: '#0f172a', minWidth: '95px', textAlign: 'right' as const };
const delBtn = { color: '#ef4444', background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' };
const addBtn = { background: '#16a34a', color: 'white', border: 'none', padding: '6px 15px', borderRadius: '8px', fontSize: '11px', marginTop: '10px' };
const floatingFooter = { position: 'fixed' as const, bottom: 0, width: '100%', maxWidth: '500px', background: 'white', padding: '20px', borderTop: '2px solid #0f172a', zIndex: 1000, boxSizing: 'border-box' as const };
const footerMain = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' };
const totalVal = { fontSize: '24px', fontWeight: '900' as const, color: '#16a34a' };
const pdfBtn = { width: '100%', padding: '16px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold' as const, fontSize: '14px' };
const waBtn = { padding: '10px 20px', background: '#25D366', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold' as const };
