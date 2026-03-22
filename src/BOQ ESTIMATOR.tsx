import React, { useState, useEffect, useMemo, useCallback } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- FULL MATERIAL & BRAND DATABASE (From Images 4, 5, 7, 8) ---
const MATERIAL_DB = {
  Cement: ["Ramco Super Plast", "Chettinad", "UltraTech", "Dalmia"],
  Steel: ["Pulkit (Fe 550D)", "JSW Neosteel", "TATA Tiscon"],
  Sand: ["M-Sand", "P-Sand"],
  Bricks: ["Chamber Brick", "Fly-Ash Brick"],
  Tiles: ["KAG (4x2)", "Millenium", "Somany", "Cool Roof Tile"],
  Plumbing: ["AvonPlast", "Trubore", "Finolex"],
  Electrical: ["Finolex Pipes", "GM Modular", "Legrand", "Lisha"],
  Paint: ["Asian Paints Apex", "Asian Paints Advanced", "Tractor Emulsion"]
};

export default function MasterBOQEstimator() {
  const [builtArea, setBuiltArea] = useState<number>(1500);
  const [clientName, setClientName] = useState("Mr. Rajendran");

  // --- FULL DYNAMIC ITEM STATE (Images 1, 2, 3, 6) ---
  const [items, setItems] = useState([
    { id: 1, cat: "Civil", desc: "Ground Floor Construction (Framed)", qty: 1500, rate: 2300, unit: "Sft" },
    { id: 2, cat: "Civil", desc: "First Floor Construction Area", qty: 0, rate: 2500, unit: "Sft" },
    { id: 3, cat: "Civil", desc: "Second Floor Construction Area", qty: 0, rate: 2500, unit: "Sft" },
    { id: 4, cat: "Water", desc: "UG Septic Tank (6000 Ltrs)", qty: 6000, rate: 15, unit: "Ltr" },
    { id: 5, cat: "Water", desc: "UG Sump (4000 Ltrs) with 1HP Motor", qty: 4000, rate: 15, unit: "Ltr" },
    { id: 6, cat: "Water", desc: "Brick Water Tank (2000L)", qty: 1, rate: 100000, unit: "Nos" },
    { id: 7, cat: "External", desc: "Compound Wall (80 Ft)", qty: 80, rate: 2500, unit: "Rft" },
    { id: 8, cat: "External", desc: "Setbacks - Cement Platform Finish", qty: 275, rate: 500, unit: "Sft" },
    { id: 9, cat: "Utility", desc: "Borewell with 1 HP Jet Pump", qty: 1, rate: 80000, unit: "Nos" },
    { id: 10, cat: "Utility", desc: "3 Phase E.B. Supply & Installation", qty: 1, rate: 100000, unit: "Nos" },
    { id: 11, cat: "Utility", desc: "Plan Approval Fee & Expenses", qty: 1, rate: 75000, unit: "Nos" },
    { id: 12, cat: "Utility", desc: "Property Tax Assessment & UGD", qty: 1, rate: 90000, unit: "Nos" },
    { id: 13, cat: "Special", desc: "Modular Kitchen & Chimney", qty: 1, rate: 150000, unit: "LS" },
    { id: 14, cat: "Special", desc: "Terrace - White Cool Roof Tile", qty: 1, rate: 125000, unit: "LS" }
  ]);

  // --- LAG-FREE CALCULATION ENGINE ---
  const totals = useMemo(() => {
    const subTotal = items.reduce((sum, i) => sum + (i.qty * i.rate), 0);
    const cementBags = Math.round(builtArea * 0.42);
    const steelKgs = Math.round(builtArea * 4.0);
    return { subTotal, cementBags, steelKgs };
  }, [items, builtArea]);

  // --- SEAMLESS EVENT HANDLERS ---
  const updateItem = useCallback((id: number, field: string, val: any) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: val } : i));
  }, []);

  const deleteItem = useCallback((id: number) => {
    setItems(prev => prev.filter(i => i.id !== id));
  }, []);

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.setTextColor(15, 23, 42);
    doc.text("MASTER BOQ ESTIMATION REPORT", 105, 15, { align: 'center' });
    
    const body = items.filter(i => i.qty > 0).map(i => [
      i.desc, `${i.qty} ${i.unit}`, `Rs.${i.rate}`, `Rs.${(i.qty * i.rate).toLocaleString()}`
    ]);

    // Add Detailed Material Section to PDF
    body.push([{ content: 'DETAILED MATERIAL SPECIFICATIONS', colSpan: 4, styles: { halign: 'center', fillColor: [241, 245, 249], fontStyle: 'bold' } }]);
    body.push(["Cement", MATERIAL_DB.Cement.join(" / "), `${totals.cementBags} Bags`, "Included"]);
    body.push(["Steel", MATERIAL_DB.Steel.join(" / "), `${totals.steelKgs} Kgs`, "Included"]);
    body.push(["Plumbing", MATERIAL_DB.Plumbing.join(", "), "ISI Standard", "Included"]);
    body.push(["Electrical", MATERIAL_DB.Electrical.join(", "), "Modular Points", "Included"]);

    autoTable(doc, {
      startY: 25,
      head: [['Description', 'Quantity', 'Rate', 'Cost']],
      body: body,
      foot: [['', '', 'GRAND TOTAL', `Rs. ${totals.subTotal.toLocaleString()}`]],
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42] },
      footStyles: { fillColor: [22, 163, 74], textColor: [255, 255, 255] }
    });

    doc.save(`${clientName}_Master_BOQ.pdf`);
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h2 style={{ margin: 0 }}>BOQ MASTER ESTIMATOR</h2>
        <p style={{ fontSize: '11px', opacity: 0.8 }}>Complete Engineering & Material Package</p>
      </div>

      <div style={cardStyle}>
        <label style={labelStyle}>Total Built-up Area (Sq.Ft)</label>
        <input 
          type="number" 
          value={builtArea} 
          onChange={(e) => setBuiltArea(Number(e.target.value))} 
          style={areaInput} 
        />
      </div>

      <div style={scrollArea}>
        <h3 style={{ padding: '0 15px', fontSize: '15px' }}>Full Cost Breakdown & Specifications</h3>
        {items.map((item) => (
          <div key={item.id} style={itemCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <input 
                style={itemTitle} 
                value={item.desc} 
                onChange={(e) => updateItem(item.id, 'desc', e.target.value)} 
              />
              <button onClick={() => deleteItem(item.id)} style={delBtn}>✕</button>
            </div>
            <div style={inputRow}>
              <div style={{ flex: 1 }}>
                <span style={miniLabel}>Qty ({item.unit})</span>
                <input type="number" value={item.qty} style={smallInp} onChange={e => updateItem(item.id, 'qty', Number(e.target.value))} />
              </div>
              <div style={{ flex: 1 }}>
                <span style={miniLabel}>Rate (₹)</span>
                <input type="number" value={item.rate} style={smallInp} onChange={e => updateItem(item.id, 'rate', Number(e.target.value))} />
              </div>
              <div style={rowTotal}>₹{(item.qty * item.rate).toLocaleString()}</div>
            </div>
          </div>
        ))}
      </div>

      {/* FIXED FLOATING FOOTER FOR PHONE VISIBILITY */}
      <div style={floatingFooter}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>TOTAL ESTIMATE</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#16a34a' }}>₹ {totals.subTotal.toLocaleString()}</div>
          </div>
          <button onClick={() => window.open(`https://wa.me/?text=Master BOQ: ₹${totals.subTotal.toLocaleString()}`)} style={waBtn}>WHATSAPP</button>
        </div>
        <button onClick={generatePDF} style={pdfBtn}>DOWNLOAD MASTER REPORT 📄</button>
      </div>
    </div>
  );
}

// --- HIGH-PERFORMANCE MOBILE STYLING ---
const containerStyle = { maxWidth: '100%', minHeight: '100vh', background: '#f8fafc', paddingBottom: '160px', fontFamily: 'sans-serif' };
const headerStyle = { background: '#0f172a', color: 'white', padding: '30px 20px', textAlign: 'center' as const };
const cardStyle = { background: 'white', margin: '-20px 15px 15px 15px', padding: '20px', borderRadius: '15px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', position: 'relative' as const, zIndex: 10 };
const areaInput = { width: '100%', padding: '15px', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '20px', fontWeight: 'bold' as const, textAlign: 'center' as const };
const labelStyle = { fontSize: '12px', color: '#64748b', fontWeight: 'bold' as const, marginBottom: '8px', display: 'block', textAlign: 'center' as const };
const scrollArea = { padding: '0 5px' };
const itemCard = { background: 'white', padding: '15px', borderRadius: '12px', margin: '0 10px 10px 10px', border: '1px solid #e2e8f0' };
const itemTitle = { border: 'none', fontWeight: 'bold' as const, fontSize: '14px', width: '90%', color: '#1e293b', outline: 'none' };
const inputRow = { display: 'flex', gap: '10px', alignItems: 'flex-end', marginTop: '10px' };
const miniLabel = { fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '2px' };
const smallInp = { width: '100%', border: '1px solid #f1f5f9', padding: '8px', borderRadius: '8px', fontSize: '14px', background: '#f8fafc' };
const rowTotal = { fontWeight: 'bold' as const, fontSize: '14px', color: '#334155', minWidth: '90px', textAlign: 'right' as const };
const delBtn = { color: '#ef4444', background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' };
const floatingFooter = { position: 'fixed' as const, bottom: 0, width: '100%', background: 'white', padding: '20px', borderTop: '3px solid #0f172a', boxShadow: '0 -10px 25px rgba(0,0,0,0.1)', zIndex: 1000, boxSizing: 'border-box' as const };
const pdfBtn = { width: '100%', padding: '16px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold' as const, fontSize: '15px' };
const waBtn = { padding: '12px 20px', background: '#22c55e', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold' as const, fontSize: '13px' };
