import React, { useState, useEffect, useMemo } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- DATA FROM IMAGES 1-8 ---
const INITIAL_MARKET_RATES = {
  cement: { "Ramco": 410, "Chettinad": 405, "UltraTech": 425 },
  steel: { "Pulkit": 75, "JSW": 78, "TATA Tiscon": 82 },
  tiles: { "KAG": 55, "Millenium": 60, "Somany": 75 },
  sand: 4000, bricks: 8.5, granite: 130
};

export default function MasterConstructionERP() {
  const [clientName, setClientName] = useState("Mr. Rajendran");
  const [builtArea, setBuiltArea] = useState(1300);
  const [selectedSteel, setSelectedSteel] = useState("Pulkit");
  const [selectedCement, setSelectedCement] = useState("Ramco");
  
  // Custom Items State (Allows Adding/Deleting from Images 1 & 2)
  const [items, setItems] = useState([
    { id: 1, desc: "Ground Floor Construction", qty: 1300, rate: 2250, unit: "Sft", type: "main" },
    { id: 2, desc: "UG Septic Tank (6000L)", qty: 6000, rate: 15, unit: "Ltr", type: "utility" },
    { id: 3, desc: "UG Sump (4000L)", qty: 4000, rate: 15, unit: "Ltr", type: "utility" },
    { id: 4, desc: "Borewell with 1HP Jet Pump", qty: 1, rate: 80000, unit: "Nos", type: "expense" },
    { id: 5, desc: "3 Phase EB Connection", qty: 1, rate: 100000, unit: "Nos", type: "expense" },
    { id: 6, desc: "Plan Approval Fee", qty: 1, rate: 75000, unit: "Nos", type: "expense" }
  ]);

  // --- CALCULATION LOGIC ---
  const calculation = useMemo(() => {
    // Material Quantities based on Built Area
    const cementQty = builtArea * 0.42;
    const steelQty = builtArea * 4.0;
    
    const materialCost = (cementQty * INITIAL_MARKET_RATES.cement[selectedCement]) + 
                         (steelQty * INITIAL_MARKET_RATES.steel[selectedSteel]);
    
    const itemsTotal = items.reduce((sum, item) => sum + (item.qty * item.rate), 0);
    const grandTotal = itemsTotal + materialCost;

    return { cementQty, steelQty, itemsTotal, materialCost, grandTotal };
  }, [builtArea, selectedSteel, selectedCement, items]);

  // --- ACTIONS ---
  const deleteItem = (id) => setItems(items.filter(i => i.id !== id));
  
  const addItem = () => {
    const newItem = { id: Date.now(), desc: "New Work Item", qty: 1, rate: 0, unit: "Nos", type: "custom" };
    setItems([...items, newItem]);
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("UNIQ DESIGNS - MASTER QUOTATION", 105, 15, { align: 'center' });
    
    const tableData = items.map(i => [i.desc, `${i.qty} ${i.unit}`, `Rs.${i.rate}`, `Rs.${(i.qty * i.rate).toLocaleString()}`]);
    tableData.push(["Cement (" + selectedCement + ")", `${calculation.cementQty.toFixed(0)} Bags`, "Market", "Included"]);
    tableData.push(["Steel (" + selectedSteel + ")", `${calculation.steelQty.toFixed(0)} Kgs`, "Market", "Included"]);

    autoTable(doc, {
      startY: 25,
      head: [['Description', 'Quantity', 'Rate', 'Total']],
      body: tableData,
      foot: [['', '', 'GRAND TOTAL', `Rs. ${calculation.grandTotal.toLocaleString()}`]],
      theme: 'grid',
      headStyles: { fillColor: [184, 134, 11] }
    });

    doc.save(`${clientName}_Quotation.pdf`);
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h2 style={{ margin: 0 }}>UNIQ DESIGNS ERP</h2>
        <p style={{ fontSize: '10px' }}>Trichy Market Real-Time Estimator</p>
      </div>

      {/* CUSTOMIZATION PANEL */}
      <div style={cardStyle}>
        <div style={grid2}>
          <div>
            <label style={labelStyle}>Select Steel Brand</label>
            <select style={selectStyle} value={selectedSteel} onChange={(e) => setSelectedSteel(e.target.value)}>
              {Object.keys(INITIAL_MARKET_RATES.steel).map(s => <option key={s} value={s}>{s} (₹{INITIAL_MARKET_RATES.steel[s]}/kg)</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Select Cement Brand</label>
            <select style={selectStyle} value={selectedCement} onChange={(e) => setSelectedCement(e.target.value)}>
              {Object.keys(INITIAL_MARKET_RATES.cement).map(c => <option key={c} value={c}>{c} (₹{INITIAL_MARKET_RATES.cement[c]}/bag)</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* DYNAMIC ITEM LIST (Images 1 & 2) */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h4 style={{ margin: 0 }}>Work Specifications & Expenses</h4>
          <button onClick={addItem} style={addBtn}>+ ADD ITEM</button>
        </div>
        {items.map((item) => (
          <div key={item.id} style={itemRow}>
            <input 
              style={{ flex: 2, border: 'none', fontWeight: 'bold' }} 
              value={item.desc} 
              onChange={(e) => setItems(items.map(i => i.id === item.id ? {...i, desc: e.target.value} : i))}
            />
            <input 
              style={{ width: '60px', textAlign: 'right', border: '1px solid #eee' }} 
              type="number" 
              value={item.rate} 
              onChange={(e) => setItems(items.map(i => i.id === item.id ? {...i, rate: Number(e.target.value)} : i))}
            />
            <button onClick={() => deleteItem(item.id)} style={delBtn}>✕</button>
          </div>
        ))}
      </div>

      {/* SUMMARY FOOTER */}
      <div style={footerStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
          <span>Grand Total Estimate:</span>
          <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#B8860B' }}>₹ {calculation.grandTotal.toLocaleString()}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <button onClick={generatePDF} style={mainBtn}>DOWNLOAD PDF</button>
          <button onClick={() => window.open(`https://wa.me/?text=Quotation: ₹${calculation.grandTotal.toLocaleString()}`)} style={waBtn}>WHATSAPP</button>
        </div>
      </div>
    </div>
  );
}

// --- STYLING ---
const containerStyle = { maxWidth: '500px', margin: '0 auto', background: '#f4f7f6', minHeight: '100vh', padding: '15px', paddingBottom: '150px', fontFamily: 'sans-serif' };
const headerStyle = { background: '#1a1a1a', color: '#B8860B', padding: '20px', borderRadius: '15px', textAlign: 'center' as const, marginBottom: '15px' };
const cardStyle = { background: 'white', padding: '15px', borderRadius: '15px', marginBottom: '15px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' };
const grid2 = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' };
const labelStyle = { fontSize: '11px', color: '#666', fontWeight: 'bold' as const };
const selectStyle = { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', marginTop: '5px' };
const itemRow = { display: 'flex', gap: '10px', padding: '10px 0', borderBottom: '1px solid #f9f9f9', alignItems: 'center' };
const addBtn = { background: '#B8860B', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', fontSize: '12px' };
const delBtn = { background: '#ff4d4d', color: 'white', border: 'none', borderRadius: '5px', padding: '2px 8px', cursor: 'pointer' };
const footerStyle = { position: 'fixed' as const, bottom: 0, width: '100%', maxWidth: '500px', background: 'white', padding: '20px', borderTop: '2px solid #B8860B', boxShadow: '0 -5px 10px rgba(0,0,0,0.05)' };
const mainBtn = { padding: '15px', background: '#1a1a1a', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold' as const, cursor: 'pointer' };
const waBtn = { padding: '15px', background: '#25D366', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold' as const, cursor: 'pointer' };
