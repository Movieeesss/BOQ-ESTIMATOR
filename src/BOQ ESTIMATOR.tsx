import React, { useState, useMemo, useCallback, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- 1. FULL ENGINEERING LOGIC (Transparency Database) ---
const ENG_LOGIC = {
  cement: 0.42,    // Bags per Sqft
  steel: 4.0,     // Kg per Sqft
  sand: 1.8,      // Cft per Sqft
  aggregate: 1.35, // Cft per Sqft
  bricks: 22,     // Nos per Sqft
  paint: 0.25,    // Liters per Sqft
  tiles: 1.1      // Sqft per Sqft (Wastage incl.)
};

const BRANDS = {
  Cement: "Ramco / Chettinad / UltraTech",
  Steel: "Pulkit / JSW Neosteel / TATA Tiscon",
  Tiles: "KAG / Millenium / Somany (4x2 Vitrified)",
  Paint: "Asian Paints (Apex / Advanced)"
};

interface BOQItem {
  id: number;
  desc: string;
  qty: number;
  rate: number;
  unit: string;
}

// --- 2. ZERO-LAG INPUT COMPONENT (Fixes Backspace/Typing Lag) ---
const EditableInput = ({ value, onSave, type = "text", style, placeholder }: any) => {
  const [localVal, setLocalVal] = useState(value);
  useEffect(() => { setLocalVal(value); }, [value]);
  const handleBlur = () => onSave(localVal);

  return (
    <input 
      type={type} 
      value={localVal} 
      onChange={(e) => setLocalVal(e.target.value)} 
      onBlur={handleBlur} 
      style={style} 
      placeholder={placeholder}
    />
  );
};

export default function MasterBOQEstimator() {
  const [builtArea, setBuiltArea] = useState<number>(1500);
  const [clientName, setClientName] = useState("Mr. Rajendran");
  const [location, setLocation] = useState("Musiri, Trichy");
  const [projectDate, setProjectDate] = useState(new Date().toISOString().split('T')[0]);

  // --- 3. DYNAMIC WORK ITEMS (All Contents from Images) ---
  const [items, setItems] = useState<BOQItem[]>([
    { id: 1, desc: "Ground Floor Construction (Framed)", qty: 1500, rate: 2300, unit: "Sft" },
    { id: 2, desc: "UG Septic Tank (6000 Ltrs)", qty: 6000, rate: 15, unit: "Ltr" },
    { id: 3, desc: "UG Sump (4000 Ltrs) + 1HP Motor", qty: 4000, rate: 15, unit: "Ltr" },
    { id: 4, desc: "Borewell with 1 HP Jet Pump", qty: 1, rate: 85000, unit: "Nos" },
    { id: 5, desc: "3 Phase E.B. Supply & Temp EB", qty: 1, rate: 100000, unit: "Nos" },
    { id: 6, desc: "Plan Approval & Gov Charges", qty: 1, rate: 75000, unit: "Nos" }
  ]);

  // --- 4. MATERIAL BREAKDOWN CALCULATOR ---
  const totals = useMemo(() => {
    const cost = items.reduce((sum, i) => sum + (i.qty * i.rate), 0);
    return {
      cost,
      cement: Math.round(builtArea * ENG_LOGIC.cement),
      steel: Math.round(builtArea * ENG_LOGIC.steel),
      sand: Math.round(builtArea * ENG_LOGIC.sand),
      bricks: Math.round(builtArea * ENG_LOGIC.bricks),
      tiles: Math.round(builtArea * ENG_LOGIC.tiles),
      paint: Math.round(builtArea * ENG_LOGIC.paint)
    };
  }, [items, builtArea]);

  const updateItem = useCallback((id: number, field: keyof BOQItem, val: any) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: val } : i));
  }, []);

  const addNewItem = () => {
    setItems(prev => [...prev, { id: Date.now(), desc: "New Work Spec", qty: 1, rate: 0, unit: "Nos" }]);
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("MASTER BOQ & MATERIAL SPECIFICATION", 105, 15, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`Client: ${clientName} | Location: ${location}`, 14, 25);
    doc.text(`Date: ${projectDate} | Area: ${builtArea} Sft`, 14, 30);

    const costBody: any[] = items.map(i => [
      i.desc, `${i.qty} ${i.unit}`, `Rs.${i.rate}`, `Rs.${(i.qty * i.rate).toLocaleString()}`
    ]);

    autoTable(doc, {
      startY: 35,
      head: [['Work Description', 'Quantity', 'Rate', 'Total']],
      body: costBody,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42] }
    });

    const matBody = [
      ["Cement", BRANDS.Cement, `${totals.cement} Bags`, "0.42/Sft"],
      ["Steel", BRANDS.Steel, `${totals.steel} Kgs`, "4.00/Sft"],
      ["Sand/M-Sand", "M-Sand & P-Sand", `${totals.sand} Cft`, "1.80/Sft"],
      ["Bricks", "Chamber / Fly-Ash", `${totals.bricks} Nos`, "22/Sft"],
      ["Flooring", BRANDS.Tiles, `${totals.tiles} Sft`, "1.10/Sft"],
      ["Painting", BRANDS.Paint, `${totals.paint} Ltrs`, "0.25/Sft"]
    ];

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [[{ content: 'ENGINEERING MATERIAL TRANSPARENCY', colSpan: 4, styles: { halign: 'center' } }]],
      body: matBody,
      theme: 'striped',
      headStyles: { fillColor: [184, 134, 11] }
    });

    doc.save(`${clientName}_BOQ.pdf`);
  };

  const shareWhatsApp = () => {
    const msg = `*UNIQ DESIGNS BOQ*\nClient: ${clientName}\nArea: ${builtArea} Sft\nTotal Budget: ₹${totals.cost.toLocaleString()}\n\n*Material Breakdown:*\n- Cement: ${totals.cement} Bags\n- Steel: ${totals.steel} Kgs`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h2 style={{ margin: 0 }}>BOQ MASTER ESTIMATOR</h2>
        <button onClick={addNewItem} style={addMainBtn}>+ ADD WORK ITEM</button>
      </div>

      {/* CLIENT & AREA CONTROL */}
      <div style={areaCard}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <div style={{ flex: 1 }}><label style={miniLabel}>Client</label><EditableInput value={clientName} onSave={setClientName} style={detailInp} /></div>
          <div style={{ flex: 1 }}><label style={miniLabel}>Date</label><input type="date" value={projectDate} onChange={(e) => setProjectDate(e.target.value)} style={detailInp} /></div>
        </div>
        <label style={labelStyle}>Total Built-up Area (Sq.Ft)</label>
        <EditableInput type="number" value={builtArea} onSave={(v: any) => setBuiltArea(Number(v))} style={areaInput} />
      </div>

      {/* SCROLLABLE WORK LIST */}
      <div style={scrollArea}>
        {items.map((item) => (
          <div key={item.id} style={itemCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <EditableInput value={item.desc} onSave={(v: any) => updateItem(item.id, 'desc', v)} style={itemTitle} />
              <button onClick={() => setItems(prev => prev.filter(i => i.id !== item.id))} style={delBtn}>✕</button>
            </div>
            <div style={inputRow}>
              <div style={{ flex: 1 }}><span style={miniLabel}>Qty</span><EditableInput type="number" value={item.qty} style={smallInp} onSave={(v: any) => updateItem(item.id, 'qty', Number(v))} /></div>
              <div style={{ flex: 1 }}><span style={miniLabel}>Rate</span><EditableInput type="number" value={item.rate} style={smallInp} onSave={(v: any) => updateItem(item.id, 'rate', Number(v))} /></div>
              <div style={rowTotal}>₹{(item.qty * item.rate).toLocaleString()}</div>
            </div>
            {item.qty > 0 && item.unit === "Sft" && (
              <div style={transBox}>
                🛠️ Logic: {Math.round(item.qty * 0.42)} Cement Bags | {Math.round(item.qty * 4.0)} Kg Steel
              </div>
            )}
          </div>
        ))}
      </div>

      {/* FLOATING ACTION FOOTER */}
      <div style={floatingFooter}>
        <div style={footerText}>
          <div><div style={{ fontSize: '11px', color: '#64748b' }}>GRAND TOTAL</div><div style={{ fontSize: '24px', fontWeight: 'bold', color: '#16a34a' }}>₹ {totals.cost.toLocaleString()}</div></div>
          <button onClick={shareWhatsApp} style={waBtn}>WHATSAPP</button>
        </div>
        <button onClick={generatePDF} style={pdfBtn}>DOWNLOAD MASTER REPORT 📄</button>
      </div>
    </div>
  );
}

// --- CSS STYLING ---
const containerStyle = { maxWidth: '100%', minHeight: '100vh', background: '#f8fafc', paddingBottom: '160px', fontFamily: 'sans-serif' };
const headerStyle = { background: '#0f172a', color: 'white', padding: '30px 20px', textAlign: 'center' as const };
const addMainBtn = { background: '#16a34a', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '8px', fontSize: '12px', marginTop: '10px', fontWeight: 'bold' as const };
const areaCard = { background: 'white', margin: '-20px 15px 15px 15px', padding: '15px', borderRadius: '15px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', zIndex: 10, position: 'relative' as const };
const detailInp = { width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', outline: 'none' };
const areaInput = { width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '20px', fontWeight: 'bold' as const, textAlign: 'center' as const };
const labelStyle = { fontSize: '11px', color: '#64748b', fontWeight: 'bold' as const, marginBottom: '5px', display: 'block', textAlign: 'center' as const };
const miniLabel = { fontSize: '10px', color: '#94a3b8', display: 'block' };
const scrollArea = { padding: '0 10px' };
const itemCard = { background: 'white', padding: '15px', borderRadius: '12px', marginBottom: '10px', border: '1px solid #e2e8f0' };
const itemTitle = { border: 'none', fontWeight: 'bold' as const, fontSize: '14px', width: '85%', color: '#1e293b', outline: 'none' };
const inputRow = { display: 'flex', gap: '10px', alignItems: 'flex-end', marginTop: '10px' };
const smallInp = { width: '100%', border: '1px solid #f1f5f9', padding: '8px', borderRadius: '8px', fontSize: '14px', background: '#f8fafc', outline: 'none' };
const rowTotal = { fontWeight: 'bold' as const, fontSize: '14px', color: '#334155', minWidth: '95px', textAlign: 'right' as const };
const transBox = { marginTop: '10px', padding: '8px', background: '#f0f9ff', borderRadius: '6px', fontSize: '11px', color: '#0369a1', border: '1px dashed #bae6fd' };
const delBtn = { color: '#ef4444', background: 'none', border: 'none', fontSize: '18px' };
const floatingFooter = { position: 'fixed' as const, bottom: 0, width: '100%', background: 'white', padding: '20px', borderTop: '3px solid #0f172a', boxShadow: '0 -10px 25px rgba(0,0,0,0.1)', zIndex: 1000, boxSizing: 'border-box' as const };
const footerText = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' };
const pdfBtn = { width: '100%', padding: '16px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold' as const, fontSize: '15px' };
const waBtn = { padding: '12px 20px', background: '#22c55e', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold' as const, fontSize: '13px' };
