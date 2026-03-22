import React, { useState, useEffect, useMemo } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- 1. DATA HUB: EXTRACTED FROM ALL 8 IMAGES ---
const MARKET_DATABASE = {
  cement: { "Ramco Super Plast": 410, "Chettinad": 405, "UltraTech": 425, "Dalmia": 415 },
  steel: { "Pulkit (Fe 550D)": 75, "JSW Neosteel": 78, "TATA Tiscon": 82 },
  tiles: { "Vitrified (4x2)": 55, "KAG GVT": 65, "Cool Roof Tile": 45 },
  wood: { "Teak Wood (Main)": 4500, "Flush Door": 1800, "PVC Door": 950 }
};

export default function MasterBOQEstimator() {
  // --- 2. STATE MANAGEMENT ---
  const [clientInfo, setClientInfo] = useState({ name: "Mr. Rajendran", location: "Musiri, Trichy", area: 1300 });
  const [selectedSteel, setSelectedSteel] = useState("Pulkit (Fe 550D)");
  const [selectedCement, setSelectedCement] = useState("Ramco Super Plast");

  // Dynamic Item List (Fully Editable - Content from Images 1 to 8)
  const [items, setItems] = useState([
    { id: 1, group: "Civil", desc: "Ground Floor Construction (Framed)", qty: 1300, rate: 2250, unit: "Sft" },
    { id: 2, group: "Utility", desc: "UG Septic Tank (6000 Ltrs)", qty: 6000, rate: 15, unit: "Ltr" },
    { id: 3, group: "Utility", desc: "UG Sump (4000 Ltrs) with 1HP Motor", qty: 4000, rate: 15, unit: "Ltr" },
    { id: 4, group: "Expenses", desc: "Borewell with 1HP Jet Pump", qty: 1, rate: 80000, unit: "Nos" },
    { id: 5, group: "Expenses", desc: "3 Phase EB Connection & Temporary EB", qty: 1, rate: 100000, unit: "Nos" },
    { id: 6, group: "Expenses", desc: "Plan Approval & Blueprint Fee", qty: 1, rate: 75000, unit: "Nos" },
    { id: 7, group: "Add-ons", desc: "Compound Wall (25+55=80ft)", qty: 80, rate: 2500, unit: "Rft" },
    { id: 8, group: "Add-ons", desc: "Terrace White Cool Roof Tile", qty: 1, rate: 125000, unit: "LS" },
    { id: 9, group: "Add-ons", desc: "Property Tax & UGD Connection", qty: 1, rate: 90000, unit: "LS" }
  ]);

  // --- 3. LOGIC ENGINE ---
  const totals = useMemo(() => {
    const area = clientInfo.area;
    // Structural Coefficients (Image 5 & 8)
    const cementBags = Math.round(area * 0.42);
    const steelKgs = Math.round(area * 4.0);
    
    const itemsTotal = items.reduce((sum, i) => sum + (i.qty * i.rate), 0);
    // Material rates are already baked into the Sft rate in Image 1, 
    // but we display them for transparency.
    return { cementBags, steelKgs, itemsTotal };
  }, [items, clientInfo.area]);

  // --- 4. ACTIONS ---
  const updateItem = (id, field, val) => {
    setItems(items.map(i => i.id === id ? { ...i, [field]: val } : i));
  };

  const deleteItem = (id) => setItems(items.filter(i => i.id !== id));
  const addNewItem = () => setItems([...items, { id: Date.now(), group: "Custom", desc: "New Specification", qty: 1, rate: 0, unit: "Nos" }]);

  // --- 5. REPORT GENERATION (IMAGE 6 STYLE) ---
  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.setTextColor(184, 134, 11); // Gold
    doc.text("BOQ ESTIMATOR - MASTER QUOTATION", 105, 15, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text(`Client: ${clientInfo.name} | Site: ${clientInfo.location}`, 14, 25);
    doc.text(`Built-up Area: ${clientInfo.area} Sft | Date: ${new Date().toLocaleDateString()}`, 14, 30);

    const body = items.map(i => [i.desc, `${i.qty} ${i.unit}`, `Rs.${i.rate}`, `Rs.${(i.qty * i.rate).toLocaleString()}`]);
    body.push([{ content: 'MATERIAL BREAKDOWN (For Information Only)', colSpan: 4, styles: { halign: 'center', fillColor: [245, 245, 245] } }]);
    body.push([`Cement: ${selectedCement}`, `${totals.cementBags} Bags`, "Market", "Included"]);
    body.push([`Steel: ${selectedSteel}`, `${totals.steelKgs} Kgs`, "Market", "Included"]);

    autoTable(doc, {
      startY: 35,
      head: [['Description', 'Quantity', 'Rate', 'Total Cost']],
      body: body,
      foot: [['', '', 'GRAND TOTAL', `Rs. ${totals.itemsTotal.toLocaleString()}`]],
      theme: 'grid',
      headStyles: { fillColor: [30, 41, 59] },
      footStyles: { fillColor: [184, 134, 11], textColor: [255, 255, 255], fontStyle: 'bold' }
    });

    doc.save(`${clientInfo.name}_BOQ.pdf`);
  };

  return (
    <div style={containerStyle}>
      {/* MOBILE FRIENDLY HEADER */}
      <div style={headerStyle}>
        <h2 style={{ margin: 0 }}>BOQ ESTIMATOR</h2>
        <div style={{ fontSize: '12px', opacity: 0.8 }}>Professional Construction Consultancy</div>
      </div>

      {/* CLIENT & MATERIAL CONTROLS */}
      <div style={cardStyle}>
        <div style={inputGroup}>
          <label>Project Area (Sft)</label>
          <input type="number" value={clientInfo.area} onChange={e => setClientInfo({...clientInfo, area: Number(e.target.value)})} style={inputStyle} />
        </div>
        <div style={grid2}>
          <div>
            <label style={miniLabel}>Steel Brand</label>
            <select value={selectedSteel} onChange={e => setSelectedSteel(e.target.value)} style={selectStyle}>
              {Object.keys(MARKET_DATABASE.steel).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={miniLabel}>Cement Brand</label>
            <select value={selectedCement} onChange={e => setSelectedCement(e.target.value)} style={selectStyle}>
              {Object.keys(MARKET_DATABASE.cement).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* EDITABLE SPECIFICATION LIST (IMAGES 1-8 CONTENTS) */}
      <div style={{ padding: '0 15px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
          <h3 style={{ margin: 0, fontSize: '16px' }}>Work Specifications</h3>
          <button onClick={addNewItem} style={addBtn}>+ Add Detail</button>
        </div>

        {items.map(item => (
          <div key={item.id} style={itemCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <input 
                style={itemDescInp} 
                value={item.desc} 
                onChange={e => updateItem(item.id, 'desc', e.target.value)} 
              />
              <button onClick={() => deleteItem(item.id)} style={delBtn}>✕</button>
            </div>
            <div style={itemInputs}>
              <div style={{ flex: 1 }}>
                <label style={miniLabel}>Qty ({item.unit})</label>
                <input type="number" value={item.qty} onChange={e => updateItem(item.id, 'qty', Number(e.target.value))} style={subInp} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={miniLabel}>Rate (₹)</label>
                <input type="number" value={item.rate} onChange={e => updateItem(item.id, 'rate', Number(e.target.value))} style={subInp} />
              </div>
              <div style={itemTotalLine}>
                ₹{(item.qty * item.rate).toLocaleString()}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* VISIBILITY FIXED: STICKY GRAND TOTAL FOOTER */}
      <div style={stickyFooter}>
        <div style={footerMain}>
          <div style={{ fontSize: '12px', color: '#64748b' }}>GRAND TOTAL ESTIMATE</div>
          <div style={{ fontSize: '22px', fontWeight: '900', color: '#0f172a' }}>₹ {totals.itemsTotal.toLocaleString()}</div>
        </div>
        <div style={actionGrid}>
          <button onClick={generatePDF} style={pdfBtn}>GENERATE REPORT</button>
          <button onClick={() => window.open(`https://wa.me/?text=BOQ Quote: ₹${totals.itemsTotal.toLocaleString()}`)} style={waBtn}>WHATSAPP</button>
        </div>
      </div>
    </div>
  );
}

// --- STYLING (Optimized for all Phone Screens) ---
const containerStyle = { maxWidth: '100%', minHeight: '100vh', background: '#f1f5f9', paddingBottom: '160px', fontFamily: '-apple-system, sans-serif' };
const headerStyle = { background: '#0f172a', color: 'white', padding: '25px 15px', textAlign: 'center' as const };
const cardStyle = { background: 'white', margin: '15px', padding: '15px', borderRadius: '15px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' };
const grid2 = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' };
const inputGroup = { display: 'flex', flexDirection: 'column' as const };
const labelStyle = { fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '5px' };
const inputStyle = { padding: '12px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '16px' };
const selectStyle = { width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f8fafc' };
const miniLabel = { fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' as const };
const itemCard = { background: 'white', padding: '12px', borderRadius: '12px', marginBottom: '10px', border: '1px solid #e2e8f0' };
const itemDescInp = { flex: 1, border: 'none', fontWeight: 'bold' as const, fontSize: '14px', marginBottom: '8px', color: '#1e293b', width: '90%' };
const itemInputs = { display: 'flex', gap: '10px', alignItems: 'center' };
const subInp = { width: '100%', border: '1px solid #f1f5f9', padding: '5px', borderRadius: '5px', background: '#f8fafc' };
const itemTotalLine = { fontSize: '14px', fontWeight: '900', color: '#B8860B', minWidth: '80px', textAlign: 'right' as const };
const addBtn = { background: '#0f172a', color: 'white', border: 'none', padding: '5px 12px', borderRadius: '8px', fontSize: '12px' };
const delBtn = { color: '#ef4444', background: 'none', border: 'none', fontSize: '18px' };
const stickyFooter = { position: 'fixed' as const, bottom: 0, width: '100%', background: 'white', padding: '15px', borderTop: '2px solid #0f172a', boxShadow: '0 -10px 20px rgba(0,0,0,0.05)', zIndex: 100 };
const footerMain = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' };
const actionGrid = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' };
const pdfBtn = { background: '#0f172a', color: 'white', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: 'bold' as const, fontSize: '13px' };
const waBtn = { background: '#22c55e', color: 'white', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: 'bold' as const, fontSize: '13px' };
