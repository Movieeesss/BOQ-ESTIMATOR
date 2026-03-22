import React, { useState, useEffect, useMemo } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- 1. THE DATA HUB (Directly from your 5 Images) ---
const SPECS = {
  structure: [
    "Type: Fully Framed Residential",
    "Column: 1'0\"x0'9\" & 0'9\"x0'9\"",
    "Plinth: 0'9\"x1'0\" & 0'9\"x1'3\"",
    "Mix: M20 Grade (1:1.5:3)",
    "Slab: 4.5\" Thickness"
  ],
  materials: [
    { item: "Cement", brands: "Chettinad / Ramco Super Plast / UltraTech", rate: 410, unit: "Bag", coeff: 0.42 },
    { item: "Steel", brands: "Fe 550D TMT Bars (PULKIT / JSW)", rate: 75, unit: "Kg", coeff: 4.0 },
    { item: "Sand", brands: "M-Sand & P-Sand (Filter Sand)", rate: 4000, unit: "Unit", coeff: 0.018 }, // 1 unit per ~55 sqft
    { item: "3/4 Metal", brands: "Blue Metal / Aggregates", rate: 30, unit: "Cft", coeff: 1.4 },
    { item: "Bricks", brands: "Chamber brick / Fly-Ash (Basement)", rate: 8.50, unit: "Nos", coeff: 22 },
    { item: "Tiles", brands: "KAG / Millenium (Vitrified 4'x2')", rate: 55, unit: "Sft", coeff: 1.1 },
    { item: "Granite", brands: "Table Top Black Granite", rate: 130, unit: "Sft", coeff: 0.05 },
    { item: "Painting", brands: "Asian Paints (Apex / Tractor Emulsion)", rate: 18, unit: "Sft", coeff: 3.5 }
  ],
  excludes: [
    "Septic Tank & UG Sump (Beyond standard size)",
    "Fan and Light Fittings",
    "Elevation Work (Architect Level)",
    "Compound Wall and Gates",
    "Borewell & EB Charges",
    "Approval & Blue Print Charges"
  ]
};

export default function UniversalConstructionEstimator() {
  // --- 2. LOCAL STORAGE & STATE ---
  const [builtUpArea, setBuiltUpArea] = useState<number>(() => Number(localStorage.getItem('uniq_area')) || 0);
  const [clientName, setClientName] = useState(() => localStorage.getItem('uniq_client') || "");

  // Auto-save to LocalStorage
  useEffect(() => {
    localStorage.setItem('uniq_area', builtUpArea.toString());
    localStorage.setItem('uniq_client', clientName);
  }, [builtUpArea, clientName]);

  // --- 3. THE "PERFECT ESTIMATOR" CALCULATION ---
  const results = useMemo(() => {
    if (!builtUpArea || builtUpArea <= 0) return null;

    const items = SPECS.materials.map(m => {
      const qty = builtUpArea * m.coeff;
      const cost = qty * m.rate;
      return { ...m, qty, cost };
    });

    // Calculations for Sump & Septic from Image 1
    const laborCost = builtUpArea * 550; 
    const septicCost = 90000; // From Image 1: 6000 Ltrs @ Rs.15
    const sumpCost = 60000;   // From Image 1: 4000 Ltrs @ Rs.15
    
    const grandTotal = items.reduce((sum, i) => sum + i.cost, 0) + laborCost + septicCost + sumpCost;

    return { items, laborCost, septicCost, sumpCost, grandTotal };
  }, [builtUpArea]);

  // --- 4. EXPORT TO PDF (Vercel/TypeScript Fixed) ---
  const generatePDF = () => {
    if (!results) return;
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(184, 134, 11); // Golden color
    doc.text("UNIQ DESIGNS & CONSULTANCY", 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Project Specification for: ${clientName || "Valued Client"}`, 105, 28, { align: 'center' });
    doc.text(`Total Area: ${builtUpArea} Sq.Ft | Date: ${new Date().toLocaleDateString()}`, 105, 33, { align: 'center' });

    // Material Table
    const tableData = results.items.map(i => [
      i.item, 
      i.brands, 
      `${i.qty.toFixed(0)} ${i.unit}`, 
      `Rs.${i.cost.toLocaleString()}`
    ]);

    // Adding Labor and Utilities
    tableData.push(["Labor Charges", "Full Execution (RCC + Brick + Plaster)", "-", `Rs.${results.laborCost.toLocaleString()}`]);
    tableData.push(["UG Septic Tank", "6000 Ltrs Capacity", "Rs.15/L", `Rs.${results.septicCost.toLocaleString()}`]);
    tableData.push(["UG Sump", "4000 Ltrs Capacity", "Rs.15/L", `Rs.${results.sumpCost.toLocaleString()}`]);

    autoTable(doc, {
      startY: 40,
      head: [['Work Description', 'Specification / Brands', 'Quantity', 'Amount']],
      body: tableData,
      foot: [['', '', 'TOTAL ESTIMATED COST', `Rs. ${results.grandTotal.toLocaleString()}`]],
      theme: 'grid',
      headStyles: { fillColor: [184, 134, 11] }, // Golden
      footStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255] }
    });

    // Fix for TypeScript "lastAutoTable" error
    const finalY = (doc as any).lastAutoTable.finalY;

    // Exclusions Table
    autoTable(doc, {
      startY: finalY + 10,
      head: [['EXCLUSIONS (NOT INCLUDED IN ABOVE COST)']],
      body: SPECS.excludes.map(ex => [ex]),
      theme: 'plain',
      headStyles: { fillColor: [200, 0, 0] },
      styles: { fontSize: 9, textColor: [100, 100, 100] }
    });

    doc.save(`Estimate_${clientName || 'Uniq'}.pdf`);
  };

  // --- 5. WHATSAPP SHARE ---
  const shareWhatsApp = () => {
    if (!results) return;
    const msg = `*UNIQ DESIGNS ESTIMATE*\n` +
                `--------------------------\n` +
                `*Client:* ${clientName}\n` +
                `*Area:* ${builtUpArea} Sq.Ft\n` +
                `*Total Cost:* ₹${results.grandTotal.toLocaleString()}\n\n` +
                `*Includes:* ${SPECS.materials.slice(0, 4).map(m => m.item).join(", ")}...\n` +
                `_PDF report generated via Uniq App_`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h2 style={{ margin: 0, letterSpacing: '1px' }}>UNIQ DESIGNS</h2>
        <p style={{ fontSize: '11px', opacity: 0.9 }}>Professional Construction Estimator</p>
      </div>

      <div style={cardStyle}>
        <label style={labelStyle}>Client / Project Name</label>
        <input 
          style={inputStyle} 
          placeholder="e.g. Mr. Rajendran, Musiri" 
          value={clientName} 
          onChange={(e) => setClientName(e.target.value)} 
        />
        
        <label style={labelStyle}>Total Built-up Area (Sq.Ft)</label>
        <input 
          style={inputStyle} 
          type="number" 
          placeholder="e.g. 1300" 
          value={builtUpArea || ""} 
          onChange={(e) => setBuiltUpArea(Number(e.target.value))} 
        />
      </div>

      {results && (
        <div style={{ animation: 'fadeIn 0.5s ease' }}>
          <div style={grandTotalCard}>
            <small style={{ color: '#B8860B' }}>Total Construction Budget</small>
            <h1 style={{ margin: '5px 0', fontSize: '32px' }}>₹ {results.grandTotal.toLocaleString()}</h1>
          </div>

          <div style={cardStyle}>
            <h4 style={{ margin: '0 0 15px 0', color: '#334155', borderBottom: '2px solid #f1f5f9', paddingBottom: '5px' }}>
              Material & Brand Guide
            </h4>
            {results.items.map(i => (
              <div key={i.item} style={itemRow}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#1e293b' }}>{i.item}</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>{i.brands}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '14px', color: '#1e293b' }}>{i.qty.toFixed(0)} {i.unit}</div>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#B8860B' }}>₹{i.cost.toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={stickyFooter}>
            <button onClick={generatePDF} style={pdfBtn}>DOWNLOAD PDF 📄</button>
            <button onClick={shareWhatsApp} style={waBtn}>WHATSAPP ✅</button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- STYLING (Professional Mobile Look) ---
const containerStyle = { maxWidth: '480px', margin: '0 auto', background: '#f8fafc', minHeight: '100vh', padding: '15px', fontFamily: '"Segoe UI", Roboto, sans-serif', paddingBottom: '100px' };
const headerStyle = { background: '#1e293b', color: '#B8860B', padding: '25px', borderRadius: '20px', textAlign: 'center' as const, marginBottom: '20px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' };
const cardStyle = { background: 'white', padding: '20px', borderRadius: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', marginBottom: '15px' };
const labelStyle = { fontSize: '12px', fontWeight: 'bold', color: '#64748b', display: 'block', marginBottom: '8px', marginLeft: '5px' };
const inputStyle = { width: '100%', padding: '15px', border: '1px solid #e2e8f0', borderRadius: '12px', marginBottom: '15px', boxSizing: 'border-box' as const, fontSize: '16px', outline: 'none' };
const grandTotalCard = { background: '#0f172a', color: 'white', padding: '30px', borderRadius: '25px', textAlign: 'center' as const, marginBottom: '20px', border: '1px solid #B8860B' };
const itemRow = { display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f1f5f9' };
const stickyFooter = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '15px' };
const pdfBtn = { background: '#1e293b', color: 'white', border: 'none', padding: '18px', borderRadius: '15px', fontWeight: 'bold' as const, fontSize: '14px', cursor: 'pointer' };
const waBtn = { background: '#22c55e', color: 'white', border: 'none', padding: '18px', borderRadius: '15px', fontWeight: 'bold' as const, fontSize: '14px', cursor: 'pointer' };
