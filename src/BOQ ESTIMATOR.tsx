import React, { useState, useEffect, useMemo } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- 1. THE DATA HUB (From your 5 Images) ---
const SPECS = {
  structure: ["Fully Framed Residential", "Column: 1'0\"x0'9\"", "Plinth: 0'9\"x1'0\"", "M20 Grade Mix"],
  materials: [
    { item: "Cement", brands: "Chettinad / Ramco Super Plast / UltraTech", rate: 410, unit: "Bag", coeff: 0.42 },
    { item: "Steel", brands: "Fe 550D TMT Bars (PULKIT/JSW)", rate: 75, unit: "Kg", coeff: 4.0 },
    { item: "Sand", brands: "M-Sand & P-Sand", rate: 4000, unit: "Unit", coeff: 0.018 },
    { item: "Bricks", brands: "Chamber / Fly-Ash Bricks", rate: 8.50, unit: "Nos", coeff: 22 },
    { item: "Tiles", brands: "KAG / Millenium (Vitrified 4x2)", rate: 55, unit: "Sft", coeff: 1.1 }, // 1.1 accounts for wastage
    { item: "Painting", brands: "Asian Paints (Apex/Tractor Emulsion)", rate: 18, unit: "Sft", coeff: 3.5 }, // Total surface area coeff
    { item: "Granite", brands: "Table Top Granite (Black/G20)", rate: 130, unit: "Sft", coeff: 0.05 } // Average kitchen/sill area
  ],
  excludes: ["Fan/Light Fittings", "Elevation Architect Level", "Compound Wall", "Borewell & EB"]
};

export default function UniversalConstructionEstimator() {
  // --- 2. STORAGE & STATE ---
  const [builtUpArea, setBuiltUpArea] = useState(() => Number(localStorage.getItem('uniq_area')) || 0);
  const [clientName, setClientName] = useState(() => localStorage.getItem('uniq_client') || "");

  useEffect(() => {
    localStorage.setItem('uniq_area', builtUpArea.toString());
    localStorage.setItem('uniq_client', clientName);
  }, [builtUpArea, clientName]);

  // --- 3. THE "PERFECT ESTIMATOR" LOGIC ---
  const results = useMemo(() => {
    if (!builtUpArea) return null;

    const items = SPECS.materials.map(m => {
      const qty = builtUpArea * m.coeff;
      const cost = qty * m.rate;
      return { ...m, qty, cost };
    });

    // Adding Labor and Sump/Septic (Flat rates based on image 1)
    const laborCost = builtUpArea * 550; // Standard Trichy Labor
    const septicSumpCost = 150000; // Combined approx for 6000L + 4000L
    const grandTotal = items.reduce((sum, i) => sum + i.cost, 0) + laborCost + septicSumpCost;

    return { items, laborCost, septicSumpCost, grandTotal };
  }, [builtUpArea]);

  // --- 4. EXPORT LOGIC ---
  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("CONSTRUCTION SPECIFICATION & ESTIMATE", 105, 15, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Client: ${clientName || "Valued Customer"} | Area: ${builtUpArea} Sqft`, 105, 22, { align: 'center' });

    // Table 1: Materials & Costs
    const tableData = results.items.map(i => [i.item, i.brands, `${i.qty.toFixed(0)} ${i.unit}`, `Rs.${i.cost.toLocaleString()}`]);
    tableData.push(["Labor Charges", "Full Execution", "-", `Rs.${results.laborCost.toLocaleString()}`]);
    tableData.push(["Sump & Septic", "4000L & 6000L", "UG", `Rs.${results.septicSumpCost.toLocaleString()}`]);

    autoTable(doc, {
      startY: 30,
      head: [['Material', 'Work Specification / Brands', 'Quantity', 'Amount']],
      body: tableData,
      foot: [['', '', 'TOTAL ESTIMATE', `Rs. ${results.grandTotal.toLocaleString()}`]],
      theme: 'grid',
      headStyles: { fillColor: [184, 134, 11] } // Golden color similar to Manchester logo
    });

    // Table 2: Exclusions (Image 3)
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [['EXCLUSIONS (Works not included)']],
      body: SPECS.excludes.map(ex => [ex]),
      theme: 'plain',
      headStyles: { fillColor: [200, 0, 0] }
    });

    doc.save(`Estimate_${clientName}.pdf`);
  };

  const shareWhatsApp = () => {
    const text = `*UNIQ DESIGNS ESTIMATE*\nClient: ${clientName}\nArea: ${builtUpArea} Sqft\nTotal: ₹${results?.grandTotal.toLocaleString()}\n\nIncludes: ${SPECS.materials.map(m => m.item).join(", ")}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h2 style={{ margin: 0 }}>Digital Construction Planner</h2>
        <p style={{ fontSize: '11px' }}>Based on Manchester Constructions Specs</p>
      </div>

      <div style={cardStyle}>
        <input 
          style={inputStyle} 
          placeholder="Client Name" 
          value={clientName} 
          onChange={(e) => setClientName(e.target.value)} 
        />
        <input 
          style={inputStyle} 
          type="number" 
          placeholder="Enter Total Area (Sqft)" 
          onChange={(e) => setBuiltUpArea(Number(e.target.value))} 
        />
      </div>

      {results && (
        <div style={{ marginTop: '15px' }}>
          <div style={totalCard}>
            <small>Estimated Budget (Materials + Labor)</small>
            <h2 style={{ margin: '5px 0' }}>₹ {results.grandTotal.toLocaleString()}</h2>
          </div>

          <div style={cardStyle}>
            <h4 style={{ margin: '0 0 10px 0', borderBottom: '1px solid #eee' }}>Material & Brand Guide</h4>
            {results.items.map(i => (
              <div key={i.item} style={itemRow}>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{i.item}</div>
                  <div style={{ fontSize: '10px', color: '#667' }}>{i.brands}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '13px' }}>{i.qty.toFixed(0)} {i.unit}</div>
                  <div style={{ fontSize: '11px', fontWeight: 'bold' }}>₹{i.cost.toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={stickyActions}>
            <button onClick={generatePDF} style={pdfBtn}>DOWNLOAD PDF 📄</button>
            <button onClick={shareWhatsApp} style={waBtn}>WHATSAPP ✅</button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- STYLES (Clean & Professional) ---
const containerStyle = { maxWidth: '480px', margin: '0 auto', background: '#f8f9fa', minHeight: '100vh', padding: '15px', fontFamily: 'sans-serif' };
const headerStyle = { background: '#B8860B', color: 'white', padding: '20px', borderRadius: '15px', textAlign: 'center' as const, marginBottom: '15px' };
const cardStyle = { background: 'white', padding: '15px', borderRadius: '15px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', marginBottom: '15px' };
const inputStyle = { width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '10px', boxSizing: 'border-box' as const };
const totalCard = { background: '#1a1a1a', color: '#B8860B', padding: '20px', borderRadius: '15px', textAlign: 'center' as const, marginBottom: '15px' };
const itemRow = { display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f8f9fa' };
const stickyActions = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '15px' };
const pdfBtn = { background: '#333', color: 'white', border: 'none', padding: '15px', borderRadius: '10px', fontWeight: 'bold' as const };
const waBtn = { background: '#25D366', color: 'white', border: 'none', padding: '15px', borderRadius: '10px', fontWeight: 'bold' as const };
