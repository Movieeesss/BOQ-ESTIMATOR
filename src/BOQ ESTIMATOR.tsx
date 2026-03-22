import React, { useState, useEffect, useMemo } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- DATABASE FROM ALL 8 IMAGES ---
const DATA_STORE = {
  steelBrands: { "Pulkit (Fe 550D)": 75, "JSW Neosteel": 78, "TATA Tiscon": 82 },
  cementBrands: { "Ramco Super Plast": 410, "Chettinad": 405, "UltraTech": 425 },
  specifications: {
    concrete: "M20 Grade (1:1.5:3)",
    slab: "4.5 inch Thickness",
    plinth: "0'9\" x 1'0\" / 1'3\"",
    mortar: "1:5 (Brick) / 1:4 (Plaster)",
    doors: "Teak Wood Frame & Shutter",
    windows: "Teak Wood Frame with Shutter",
    painting: "Asian Paints (Apex/Advanced)"
  }
};

export default function BOQEstimator() {
  const [clientName, setClientName] = useState("Mr. Rajendran");
  const [builtArea, setBuiltArea] = useState(1300);
  const [selectedSteel, setSelectedSteel] = useState("Pulkit (Fe 550D)");
  const [selectedCement, setSelectedCement] = useState("Ramco Super Plast");

  // IMAGE 1, 2, 7 & 8 Content Integration
  const [items, setItems] = useState([
    { id: 1, desc: "Ground Floor Construction (Framed)", qty: 1300, rate: 2250, unit: "Sft" },
    { id: 2, desc: "First Floor Construction Area", qty: 0, rate: 2500, unit: "Sft" },
    { id: 3, desc: "UG Septic Tank (6000 Ltrs)", qty: 6000, rate: 15, unit: "Ltr" },
    { id: 4, desc: "UG Sump (4000 Ltrs) + 1HP Motor", qty: 4000, rate: 15, unit: "Ltr" },
    { id: 5, desc: "Borewell with 1 HP Jet Pump", qty: 1, rate: 80000, unit: "Nos" },
    { id: 6, desc: "3 Phase E.B. Supply & Temp EB", qty: 1, rate: 100000, unit: "Nos" },
    { id: 7, desc: "Plan Approval Fee & Expenses", qty: 1, rate: 75000, unit: "Nos" },
    { id: 8, desc: "Compound Wall (80 Ft Length)", qty: 80, rate: 2500, unit: "Rft" },
    { id: 9, desc: "Setbacks - Cement Platform Finish", qty: 275, rate: 500, unit: "Sft" },
    { id: 10, desc: "Terrace - White Cool Roof Tile", qty: 1, rate: 125000, unit: "LS" },
    { id: 11, desc: "Property Tax & UGD Connection", qty: 1, rate: 90000, unit: "LS" }
  ]);

  const calculations = useMemo(() => {
    const area = builtArea;
    const cementBags = Math.round(area * 0.42);
    const steelKgs = Math.round(area * 4.0);
    const subTotal = items.reduce((sum, i) => sum + (i.qty * i.rate), 0);
    return { cementBags, steelKgs, subTotal };
  }, [items, builtArea]);

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.setTextColor(184, 134, 11);
    doc.text("BOQ ESTIMATOR - MASTER REPORT", 105, 15, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text(`Client: ${clientName} | Area: ${builtArea} Sft`, 14, 25);
    doc.text(`Specs: ${DATA_STORE.specifications.concrete} | ${DATA_STORE.specifications.doors}`, 14, 30);

    // FIX FOR TS2322 Error: Using 'any' for the body to allow complex spanning objects
    const tableBody: any[] = items.filter(i => i.qty > 0).map(i => [
      i.desc, `${i.qty} ${i.unit}`, `Rs.${i.rate}`, `Rs.${(i.qty * i.rate).toLocaleString()}`
    ]);

    tableBody.push([{ content: 'MATERIAL & BRAND SPECIFICATIONS', colSpan: 4, styles: { halign: 'center', fillColor: [240, 240, 240], fontStyle: 'bold' } }]);
    tableBody.push([`Cement: ${selectedCement}`, `${calculations.cementBags} Bags`, "Market Rate", "Included"]);
    tableBody.push([`Steel: ${selectedSteel}`, `${calculations.steelKgs} Kgs`, "Market Rate", "Included"]);

    autoTable(doc, {
      startY: 35,
      head: [['Work Description', 'Quantity', 'Unit Rate', 'Total Amount']],
      body: tableBody,
      foot: [['', '', 'GRAND TOTAL', `Rs. ${calculations.subTotal.toLocaleString()}`]],
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42] },
      footStyles: { fillColor: [184, 134, 11], textColor: [255, 255, 255] }
    });

    // TypeScript Fix for lastAutoTable
    const finalY = (doc as any).lastAutoTable.finalY;
    doc.setFontSize(8);
    doc.text("Note: GST and local taxes extra as per Image 8. Valid for 50 Years estimation logic.", 14, finalY + 10);

    doc.save(`${clientName}_Estimate.pdf`);
  };

  return (
    <div style={containerStyle}>
      {/* HEADER */}
      <div style={headerStyle}>
        <h1 style={{ margin: 0, fontSize: '22px' }}>BOQ ESTIMATOR</h1>
        <p style={{ margin: 0, fontSize: '11px', opacity: 0.8 }}>Professional Structural & Cost Consultancy</p>
      </div>

      {/* PROJECT AREA & BRANDS */}
      <div style={cardStyle}>
        <label style={labelStyle}>Total Built-up Area (Sq.Ft)</label>
        <input 
          type="number" 
          value={builtArea} 
          onChange={(e) => setBuiltArea(Number(e.target.value))} 
          style={inputStyle} 
        />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
          <div>
            <label style={subLabel}>Steel Brand</label>
            <select style={selectStyle} value={selectedSteel} onChange={e => setSelectedSteel(e.target.value)}>
              {Object.keys(DATA_STORE.steelBrands).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={subLabel}>Cement Brand</label>
            <select style={selectStyle} value={selectedCement} onChange={e => setSelectedCement(e.target.value)}>
              {Object.keys(DATA_STORE.cementBrands).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* EDITABLE WORK ITEMS (All Image Content) */}
      <div style={{ padding: '0 10px' }}>
        <h3 style={{ fontSize: '15px', color: '#1e293b', marginBottom: '10px' }}>Detailed Work Specifications</h3>
        {items.map((item) => (
          <div key={item.id} style={itemCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <input 
                style={itemTitleInp} 
                value={item.desc} 
                onChange={(e) => setItems(items.map(i => i.id === item.id ? {...i, desc: e.target.value} : i))}
              />
              <button onClick={() => setItems(items.filter(i => i.id !== item.id))} style={delBtn}>✕</button>
            </div>
            <div style={itemActionRow}>
              <div style={{ flex: 1 }}>
                <span style={subLabel}>Qty</span>
                <input type="number" value={item.qty} style={smallInp} onChange={e => setItems(items.map(i => i.id === item.id ? {...i, qty: Number(e.target.value)} : i))} />
              </div>
              <div style={{ flex: 1 }}>
                <span style={subLabel}>Rate</span>
                <input type="number" value={item.rate} style={smallInp} onChange={e => setItems(items.map(i => i.id === item.id ? {...i, rate: Number(e.target.value)} : i))} />
              </div>
              <div style={itemTotalDisplay}>
                ₹{(item.qty * item.rate).toLocaleString()}
              </div>
            </div>
          </div>
        ))}
        <button onClick={() => setItems([...items, { id: Date.now(), desc: "Custom Work", qty: 1, rate: 0, unit: "Nos" }])} style={addBtn}>+ ADD NEW SPECIFICATION</button>
      </div>

      {/* FLOATING SUMMARY BAR (FIX FOR PHONE VISIBILITY) */}
      <div style={floatingFooter}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>GRAND TOTAL</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#B8860B' }}>₹ {calculations.subTotal.toLocaleString()}</div>
          </div>
          <button onClick={() => window.open(`https://wa.me/?text=BOQ Estimation for ${clientName}: ₹${calculations.subTotal.toLocaleString()}`)} style={waBtn}>WHATSAPP</button>
        </div>
        <button onClick={generatePDF} style={pdfBtn}>DOWNLOAD MASTER REPORT 📄</button>
      </div>
    </div>
  );
}

// --- CSS-IN-JS (Optimized for Mobile Visibility) ---
const containerStyle = { maxWidth: '100%', minHeight: '100vh', background: '#f8fafc', paddingBottom: '180px', fontFamily: 'sans-serif' };
const headerStyle = { background: '#0f172a', color: 'white', padding: '30px 20px', textAlign: 'center' as const };
const cardStyle = { background: 'white', margin: '-20px 15px 15px 15px', padding: '20px', borderRadius: '15px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', position: 'relative' as const };
const inputStyle = { width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '18px', fontWeight: 'bold' as const, boxSizing: 'border-box' as const };
const labelStyle = { fontSize: '12px', color: '#64748b', fontWeight: 'bold' as const, marginBottom: '5px', display: 'block' };
const subLabel = { fontSize: '10px', color: '#94a3b8', display: 'block' };
const selectStyle = { width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '12px' };
const itemCard = { background: 'white', padding: '15px', borderRadius: '12px', marginBottom: '10px', border: '1px solid #e2e8f0' };
const itemTitleInp = { border: 'none', fontWeight: 'bold' as const, fontSize: '14px', width: '85%', color: '#1e293b' };
const itemActionRow = { display: 'flex', gap: '15px', alignItems: 'flex-end', marginTop: '8px' };
const smallInp = { width: '100%', border: '1px solid #f1f5f9', padding: '6px', borderRadius: '6px', fontSize: '13px' };
const itemTotalDisplay = { fontWeight: 'bold' as const, fontSize: '14px', color: '#334155', minWidth: '80px', textAlign: 'right' as const };
const delBtn = { background: 'none', border: 'none', color: '#ef4444', fontSize: '16px', cursor: 'pointer' };
const addBtn = { width: '92%', margin: '10px 4%', padding: '12px', background: '#f1f5f9', border: '2px dashed #cbd5e1', borderRadius: '10px', color: '#64748b', fontWeight: 'bold' as const };
const floatingFooter = { position: 'fixed' as const, bottom: 0, width: '100%', background: 'white', padding: '20px', borderTop: '3px solid #0f172a', boxShadow: '0 -10px 20px rgba(0,0,0,0.1)', boxSizing: 'border-box' as const, zIndex: 1000 };
const pdfBtn = { width: '100%', padding: '15px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold' as const, fontSize: '14px' };
const waBtn = { padding: '10px 20px', background: '#22c55e', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold' as const };
