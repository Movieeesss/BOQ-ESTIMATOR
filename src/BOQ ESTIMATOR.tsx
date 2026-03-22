import React, { useState, useMemo, useCallback, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- 1. ENGINEERING LOGIC DATABASE ---
const ENG_LOGIC = {
  cement: 0.42, steel: 4.0, sand: 1.8, aggregate: 1.35, bricks: 22,
};

const SPECS_DB = {
  Cement: ["Ramco Super Plast", "Chettinad", "UltraTech", "Dalmia"],
  Steel: ["Fe 550D TMT PULKIT", "JSW Neosteel", "TATA Tiscon"],
  Plumbing: ["AvonPlast", "Trubore", "Finolex"],
  Electrical: ["Finolex", "GM Modular", "Legrand", "RR Wires"],
  Structural: ["M20 Mix", "4.5\" Slab", "1:5 Mortar"]
};

interface BOQItem {
  id: number; cat: string; desc: string; qty: number; rate: number; unit: string;
}

// --- 2. DEBOUNCED INPUT COMPONENT (Fixes Lag & Backspace Error) ---
const EditableInput = ({ value, onSave, type = "text", style, placeholder }: any) => {
  const [localVal, setLocalVal] = useState(value);
  useEffect(() => { setLocalVal(value); }, [value]);
  const handleChange = (e: any) => setLocalVal(e.target.value);
  const handleBlur = () => onSave(localVal);

  return (
    <input 
      type={type} 
      value={localVal} 
      onChange={handleChange} 
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

  const [items, setItems] = useState<BOQItem[]>([
    { id: 1, cat: "Civil", desc: "Ground Floor Construction (Framed)", qty: 1500, rate: 2300, unit: "Sft" },
    { id: 4, cat: "Water", desc: "UG Septic Tank (6000 Ltrs)", qty: 6000, rate: 15, unit: "Ltr" },
    { id: 5, cat: "Water", desc: "UG Sump (4000 Ltrs) + 1HP Motor", qty: 4000, rate: 15, unit: "Ltr" },
    { id: 9, cat: "Utility", desc: "Borewell with 1 HP Jet Pump", qty: 1, rate: 85000, unit: "Nos" },
    { id: 10, cat: "Utility", desc: "3 Phase E.B. Supply Charges", qty: 1, rate: 100000, unit: "Nos" },
    { id: 11, cat: "Utility", desc: "Plan Approval Fee & Expenses", qty: 1, rate: 75000, unit: "Nos" }
  ]);

  // --- 3. TRANSPARENCY CALCULATION ---
  const totals = useMemo(() => {
    const subTotal = items.reduce((sum, i) => sum + (i.qty * i.rate), 0);
    return {
      subTotal,
      cement: Math.round(builtArea * ENG_LOGIC.cement),
      steel: Math.round(builtArea * ENG_LOGIC.steel),
      bricks: Math.round(builtArea * ENG_LOGIC.bricks),
    };
  }, [items, builtArea]);

  const updateItem = useCallback((id: number, field: keyof BOQItem, val: any) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: val } : i));
  }, []);

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.setTextColor(15, 23, 42);
    doc.text("MASTER BOQ REPORT", 105, 15, { align: 'center' });
    
    // Client Header Info in PDF
    doc.setFontSize(10);
    doc.text(`Client Name: ${clientName}`, 14, 25);
    doc.text(`Location: ${location}`, 14, 30);
    doc.text(`Date: ${projectDate}`, 160, 25);
    doc.text(`Built-up Area: ${builtArea} Sq.Ft`, 160, 30);

    const tableBody: any[] = items.filter(i => i.qty > 0).map(i => [
      i.desc, `${i.qty} ${i.unit}`, `Rs.${i.rate}`, `Rs.${(i.qty * i.rate).toLocaleString()}`
    ]);

    tableBody.push([{ content: 'ENGINEERING MATERIAL BREAKDOWN', colSpan: 4, styles: { halign: 'center', fillColor: [241, 245, 249], fontStyle: 'bold' } }]);
    tableBody.push(["Cement Bags", `${totals.cement} Bags`, "Logic: 0.42/Sft", "Included"]);
    tableBody.push(["Steel Weight", `${totals.steel} Kgs`, "Logic: 4.00/Sft", "Included"]);
    tableBody.push(["Bricks Count", `${totals.bricks} Nos`, "Logic: 22/Sft", "Included"]);

    autoTable(doc, {
      startY: 35,
      head: [['Description', 'Quantity', 'Rate', 'Total']],
      body: tableBody,
      foot: [['', '', 'GRAND TOTAL', `Rs. ${totals.subTotal.toLocaleString()}`]],
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42] },
      footStyles: { fillColor: [22, 163, 74] }
    });

    doc.save(`${clientName}_Report.pdf`);
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h2 style={{ margin: 0 }}>BOQ MASTER</h2>
        <p style={{ fontSize: '11px' }}>Uniq Designs • Structural & Costing</p>
      </div>

      {/* PROJECT DETAILS (Controllable) */}
      <div style={areaCard}>
        <div style={detailGrid}>
          <div style={{ flex: 1 }}>
            <label style={miniLabel}>Client Name</label>
            <EditableInput value={clientName} onSave={setClientName} style={detailInp} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={miniLabel}>Date</label>
            <input type="date" value={projectDate} onChange={(e) => setProjectDate(e.target.value)} style={detailInp} />
          </div>
        </div>
        <div style={{ marginTop: '10px' }}>
          <label style={miniLabel}>Project Location</label>
          <EditableInput value={location} onSave={setLocation} style={detailInp} />
        </div>
        <div style={{ marginTop: '10px' }}>
          <label style={labelStyle}>Project Built-up Area (Sq.Ft)</label>
          <EditableInput type="number" value={builtArea} onSave={(val: any) => setBuiltArea(Number(val))} style={areaInput} />
        </div>
      </div>

      <div style={scrollArea}>
        {items.map((item) => (
          <div key={item.id} style={itemCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <EditableInput value={item.desc} onSave={(val: any) => updateItem(item.id, 'desc', val)} style={itemTitle} />
              <button onClick={() => setItems(prev => prev.filter(i => i.id !== item.id))} style={delBtn}>✕</button>
            </div>
            <div style={inputRow}>
              <div style={{ flex: 1 }}><span style={miniLabel}>Qty</span><EditableInput type="number" value={item.qty} style={smallInp} onSave={(val: any) => updateItem(item.id, 'qty', Number(val))} /></div>
              <div style={{ flex: 1 }}><span style={miniLabel}>Rate</span><EditableInput type="number" value={item.rate} style={smallInp} onSave={(val: any) => updateItem(item.id, 'rate', Number(val))} /></div>
              <div style={rowTotal}>₹{(item.qty * item.rate).toLocaleString()}</div>
            </div>
            {item.unit === "Sft" && item.qty > 0 && (
              <div style={transparencyBox}>
                🛠️ Engineering Logic: {totals.cement} Cement Bags | {totals.steel} Kg Steel
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={floatingFooter}>
        <div style={footerText}>
          <div><div style={{ fontSize: '11px', color: '#64748b' }}>TOTAL ESTIMATE</div><div style={{ fontSize: '24px', fontWeight: 'bold', color: '#16a34a' }}>₹ {totals.subTotal.toLocaleString()}</div></div>
          <button onClick={() => window.open(`https://wa.me/?text=BOQ Quote for ${clientName}: ₹${totals.subTotal.toLocaleString()}`)} style={waBtn}>WHATSAPP</button>
        </div>
        <button onClick={generatePDF} style={pdfBtn}>DOWNLOAD MASTER REPORT 📄</button>
      </div>
    </div>
  );
}

// --- CSS STYLING ---
const containerStyle = { maxWidth: '100%', minHeight: '100vh', background: '#f8fafc', paddingBottom: '160px', fontFamily: 'sans-serif' };
const headerStyle = { background: '#0f172a', color: 'white', padding: '30px 20px', textAlign: 'center' as const };
const areaCard = { background: 'white', margin: '-20px 15px 15px 15px', padding: '15px', borderRadius: '15px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', zIndex: 10, position: 'relative' as const };
const detailGrid = { display: 'flex', gap: '10px' };
const detailInp = { width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' as const };
const areaInput = { width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '20px', fontWeight: 'bold' as const, textAlign: 'center' as const, boxSizing: 'border-box' as const };
const labelStyle = { fontSize: '11px', color: '#64748b', fontWeight: 'bold' as const, marginBottom: '5px', display: 'block', textAlign: 'center' as const };
const scrollArea = { padding: '0 10px' };
const itemCard = { background: 'white', padding: '15px', borderRadius: '12px', marginBottom: '10px', border: '1px solid #e2e8f0' };
const itemTitle = { border: 'none', fontWeight: 'bold' as const, fontSize: '14px', width: '90%', color: '#1e293b', outline: 'none' };
const inputRow = { display: 'flex', gap: '10px', alignItems: 'flex-end', marginTop: '10px' };
const miniLabel = { fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '2px' };
const smallInp = { width: '100%', border: '1px solid #f1f5f9', padding: '8px', borderRadius: '8px', fontSize: '14px', background: '#f8fafc', outline: 'none' };
const rowTotal = { fontWeight: 'bold' as const, fontSize: '14px', color: '#334155', minWidth: '95px', textAlign: 'right' as const };
const transparencyBox = { marginTop: '10px', padding: '8px', background: '#f0f9ff', borderRadius: '6px', fontSize: '11px', color: '#0369a1', border: '1px dashed #bae6fd' };
const delBtn = { color: '#ef4444', background: 'none', border: 'none', fontSize: '18px' };
const floatingFooter = { position: 'fixed' as const, bottom: 0, width: '100%', background: 'white', padding: '20px', borderTop: '3px solid #0f172a', boxShadow: '0 -10px 25px rgba(0,0,0,0.1)', zIndex: 1000, boxSizing: 'border-box' as const };
const footerText = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' };
const pdfBtn = { width: '100%', padding: '16px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold' as const, fontSize: '15px' };
const waBtn = { padding: '12px 20px', background: '#22c55e', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold' as const, fontSize: '13px' };
