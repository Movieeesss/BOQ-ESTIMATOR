import React, { useState, useMemo, useCallback, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- 1. THE TRANSPARENCY ENGINE (Engineering Constants) ---
const CONSTANTS = {
  cement: 0.42,    // Bags per Sq.ft
  steel: 4.0,      // Kg per Sq.ft
  sand: 1.8,       // Cft per Sq.ft
  aggregate: 1.35, // Cft per Sq.ft
  bricks: 22,      // Nos per Sq.ft
};

// Material Brands from your Image 3
const BRANDS = {
  Cement: "Chettinad / Ramco Super Plast / UltraTech",
  Steel: "Fe 550D TMT Bars PULKIT",
  Plumbing: "Avon Plast, Aashirvad, Finolex",
  Electrical: "Finolex Pipes & GM Modular"
};

interface BOQItem {
  id: number; cat: string; desc: string; qty: number; rate: number; unit: string;
}

export default function MasterBOQEstimator() {
  const [builtArea, setBuiltArea] = useState<number>(1500);
  const [clientName, setClientName] = useState("Mr. Rajendran");
  const [location, setLocation] = useState("Musiri, Trichy");

  const [items, setItems] = useState<BOQItem[]>([
    { id: 1, cat: "Civil", desc: "Ground Floor Construction (Framed)", qty: 1500, rate: 2300, unit: "Sft" },
    { id: 2, cat: "Utility", desc: "UG Septic Tank (6000 Ltrs)", qty: 6000, rate: 15, unit: "Ltr" },
    { id: 3, cat: "Utility", desc: "UG Sump (4000 Ltrs) + 1HP Motor", qty: 4000, rate: 15, unit: "Ltr" },
    { id: 4, cat: "Expenses", desc: "Borewell with 1 HP Jet Pump", qty: 1, rate: 85000, unit: "Nos" },
    { id: 5, cat: "Expenses", desc: "3 Phase E.B. & Temp Supply", qty: 1, rate: 100000, unit: "Nos" },
    { id: 6, cat: "Expenses", desc: "Plan Approval & Gov Charges", qty: 1, rate: 75000, unit: "Nos" }
  ]);

  // --- 2. DYNAMIC MATERIAL BREAKDOWN CALCULATION ---
  const mto = useMemo(() => {
    const area = builtArea;
    return {
      cement: Math.round(area * CONSTANTS.cement),
      steel: Math.round(area * CONSTANTS.steel),
      sand: Math.round(area * CONSTANTS.sand),
      aggregate: Math.round(area * CONSTANTS.aggregate),
      bricks: Math.round(area * CONSTANTS.bricks),
      totalCost: items.reduce((sum, i) => sum + (i.qty * i.rate), 0)
    };
  }, [items, builtArea]);

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("MASTER BOQ & MATERIAL TRANSPARENCY", 105, 15, { align: 'center' });

    // Header Info
    doc.setFontSize(10);
    doc.text(`Client: ${clientName}`, 14, 25);
    doc.text(`Location: ${location}`, 14, 30);
    doc.text(`Built-up Area: ${builtArea} Sft`, 160, 25);

    // Table 1: Work Item Breakdown
    const workItems: any[] = items.filter(i => i.qty > 0).map(i => [
      i.desc, `${i.qty} ${i.unit}`, `Rs.${i.rate}`, `Rs.${(i.qty * i.rate).toLocaleString()}`
    ]);

    autoTable(doc, {
      startY: 35,
      head: [['Work Description', 'Quantity', 'Unit Rate', 'Total Amount']],
      body: workItems,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42] }
    });

    // --- 3. THE TRANSPARENCY SECTION (From your Material list) ---
    const transparencyBody = [
      ["Cement", BRANDS.Cement, `${mto.cement} Bags`, "0.42 Bags/Sft"],
      ["Steel", BRANDS.Steel, `${mto.steel} Kgs`, "4.00 Kgs/Sft"],
      ["Sand / M-Sand", "M-Sand & P-Sand", `${mto.sand} Cft`, "1.80 Cft/Sft"],
      ["Bricks", "Chamber / Fly-Ash Bricks", `${mto.bricks} Nos`, "22 Nos/Sft"],
      ["Aggregates", "20mm / 40mm Blue Metal", `${mto.aggregate} Cft`, "1.35 Cft/Sft"],
      ["Plumbing", BRANDS.Plumbing, "As per Design", "Included"],
      ["Electrical", BRANDS.Electrical, "As per Points", "Included"]
    ];

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [[{ content: 'DETAILED MATERIAL BREAKDOWN (TRANSPARENCY)', colSpan: 4, styles: { halign: 'center' } }]],
      body: transparencyBody,
      theme: 'striped',
      headStyles: { fillColor: [184, 134, 11] } // Professional Gold
    });

    // Final Total Footer
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.setTextColor(22, 163, 74);
    doc.text(`GRAND TOTAL ESTIMATE: Rs. ${mto.totalCost.toLocaleString()}`, 105, finalY, { align: 'center' });

    doc.save(`${clientName}_Transparency_Report.pdf`);
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h2 style={{ margin: 0 }}>BOQ ESTIMATOR</h2>
        <p style={{ fontSize: '12px' }}>Uniq Designs • Engineering Dreams</p>
      </div>

      <div style={cardStyle}>
        <label style={labelStyle}>Total Built-up Area (Sq.Ft)</label>
        <input 
          type="number" 
          value={builtArea} 
          onChange={(e) => setBuiltArea(Number(e.target.value))} 
          style={areaInput} 
        />
        <div style={transparencyPreview}>
          <strong>Transparency Preview:</strong>
          <div>Cement: {mto.cement} Bags | Steel: {mto.steel} Kgs | Bricks: {mto.bricks} Nos</div>
        </div>
      </div>

      <div style={scrollArea}>
        {items.map((item) => (
          <div key={item.id} style={itemCard}>
            <div style={{ fontWeight: 'bold' }}>{item.desc}</div>
            <div style={inputRow}>
              <input type="number" value={item.qty} style={smallInp} onChange={e => {
                const val = Number(e.target.value);
                setItems(items.map(i => i.id === item.id ? {...i, qty: val} : i))
              }} />
              <input type="number" value={item.rate} style={smallInp} onChange={e => {
                const val = Number(e.target.value);
                setItems(items.map(i => i.id === item.id ? {...i, rate: val} : i))
              }} />
              <div style={rowTotal}>₹{(item.qty * item.rate).toLocaleString()}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={floatingFooter}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span style={{ fontWeight: 'bold' }}>GRAND TOTAL</span>
          <span style={{ fontSize: '22px', fontWeight: 'bold', color: '#16a34a' }}>₹ {mto.totalCost.toLocaleString()}</span>
        </div>
        <button onClick={generatePDF} style={pdfBtn}>DOWNLOAD TRANSPARENT REPORT 📄</button>
      </div>
    </div>
  );
}

// --- STYLING ---
const containerStyle = { maxWidth: '100%', minHeight: '100vh', background: '#f8fafc', paddingBottom: '160px', fontFamily: 'sans-serif' };
const headerStyle = { background: '#0f172a', color: 'white', padding: '30px 20px', textAlign: 'center' as const };
const cardStyle = { background: 'white', margin: '-20px 15px 15px 15px', padding: '15px', borderRadius: '15px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', position: 'relative' as const, zIndex: 10 };
const areaInput = { width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '18px', fontWeight: 'bold' as const, textAlign: 'center' as const, boxSizing: 'border-box' as const };
const transparencyPreview = { marginTop: '10px', fontSize: '11px', color: '#0369a1', textAlign: 'center' as const, background: '#f0f9ff', padding: '8px', borderRadius: '6px' };
const labelStyle = { fontSize: '11px', color: '#64748b', fontWeight: 'bold' as const, marginBottom: '5px', display: 'block', textAlign: 'center' as const };
const scrollArea = { padding: '0 10px' };
const itemCard = { background: 'white', padding: '15px', borderRadius: '12px', marginBottom: '10px', border: '1px solid #e2e8f0' };
const inputRow = { display: 'flex', gap: '10px', marginTop: '10px', alignItems: 'center' };
const smallInp = { width: '80px', border: '1px solid #f1f5f9', padding: '8px', borderRadius: '8px', fontSize: '14px', background: '#f8fafc' };
const rowTotal = { flex: 1, textAlign: 'right' as const, fontWeight: 'bold' as const, color: '#334155' };
const floatingFooter = { position: 'fixed' as const, bottom: 0, width: '100%', background: 'white', padding: '20px', borderTop: '3px solid #0f172a', boxShadow: '0 -10px 25px rgba(0,0,0,0.1)', zIndex: 1000, boxSizing: 'border-box' as const };
const pdfBtn = { width: '100%', padding: '16px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold' as const };
