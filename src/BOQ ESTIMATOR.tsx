import React, { useState, useEffect, useMemo } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- 1. ENGINEERING COEFFICIENTS (Your Structural Expertise) ---
const COEFFICIENTS = {
  cement: 0.42, steel: 4.0, sand: 1.9, aggregate: 1.4, bricks: 22, labor: 1
};

export default function UniqDesignsLiveEstimator() {
  // --- 2. STATE MANAGEMENT ---
  const [builtUpArea, setBuiltUpArea] = useState<number>(0);
  const [qualityTier, setQualityTier] = useState(1.0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleDateString());

  // Live Rates State (Initialized with default Trichy prices)
  const [rates, setRates] = useState({
    cement: 420, steel: 72, sand: 65, aggregate: 45, bricks: 9, laborRate: 550
  });

  // --- 3. LIVE DATA SYNC (Simulating API Fetch) ---
  useEffect(() => {
    const savedRates = localStorage.getItem('trichy_live_rates');
    if (savedRates) {
      setRates(JSON.parse(savedRates));
    }
  }, []);

  // --- 4. CALCULATION ENGINE ---
  const calculation = useMemo(() => {
    const adjustedArea = builtUpArea * qualityTier;
    const totals = {
      cement: adjustedArea * COEFFICIENTS.cement,
      steel: adjustedArea * COEFFICIENTS.steel,
      sand: adjustedArea * COEFFICIENTS.sand,
      aggregate: adjustedArea * COEFFICIENTS.aggregate,
      bricks: adjustedArea * COEFFICIENTS.bricks,
      labor: builtUpArea
    };

    const costs = {
      cement: totals.cement * rates.cement,
      steel: totals.steel * rates.steel,
      sand: totals.sand * rates.sand,
      aggregate: totals.aggregate * rates.aggregate,
      bricks: totals.bricks * rates.bricks,
      labor: totals.labor * rates.laborRate
    };

    const grandTotal = Object.values(costs).reduce((a, b) => a + b, 0);
    return { totals, costs, grandTotal };
  }, [builtUpArea, qualityTier, rates]);

  // --- 5. ADMIN FUNCTIONS ---
  const handleRateChange = (mats: string, value: string) => {
    const newRates = { ...rates, [mats]: Number(value) };
    setRates(newRates);
    localStorage.setItem('trichy_live_rates', JSON.stringify(newRates));
    setLastUpdated(new Date().toLocaleDateString());
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.setTextColor(30, 41, 59);
    doc.text("UNIQ DESIGNS BOQ REPORT", 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`Market Rates Updated: ${lastUpdated}`, 105, 28, { align: 'center' });

    const body = [
      ["Cement", `${calculation.totals.cement.toFixed(0)} Bags`, `Rs.${rates.cement}`, `Rs.${calculation.costs.cement.toLocaleString()}`],
      ["Steel", `${calculation.totals.steel.toFixed(0)} Kgs`, `Rs.${rates.steel}`, `Rs.${calculation.costs.steel.toLocaleString()}`],
      ["M-Sand", `${calculation.totals.sand.toFixed(0)} Cft`, `Rs.${rates.sand}`, `Rs.${calculation.costs.sand.toLocaleString()}`],
      ["Bricks", `${calculation.totals.bricks.toFixed(0)} Nos`, `Rs.${rates.bricks}`, `Rs.${calculation.costs.bricks.toLocaleString()}`],
      ["Labor", `${builtUpArea} Sqft`, `Rs.${rates.laborRate}`, `Rs.${calculation.costs.labor.toLocaleString()}`]
    ];

    autoTable(doc, {
      startY: 40,
      head: [['Material', 'Quantity', 'Live Rate', 'Total Amount']],
      body: body,
      foot: [['', '', 'ESTIMATED TOTAL', `Rs. ${calculation.grandTotal.toLocaleString()}`]],
      theme: 'striped',
      headStyles: { fillColor: [15, 23, 42] }
    });

    doc.save(`Estimate_${builtUpArea}sqft.pdf`);
  };

  return (
    <div style={containerStyle}>
      {/* Header with Live Status */}
      <div style={headerStyle}>
        <h2 style={{ margin: 0 }}>Trichy BOQ Estimator</h2>
        <span style={statusBadge}>● Live Rates: {lastUpdated}</span>
      </div>

      {/* Main Input Area */}
      <div style={cardStyle}>
        <label style={labelStyle}>Total Built-up Area (Sq.Ft)</label>
        <input 
          type="number" 
          style={inputStyle} 
          placeholder="Enter area..." 
          onChange={(e) => setBuiltUpArea(Number(e.target.value))} 
        />

        <label style={labelStyle}>Material Quality Tier</label>
        <select style={inputStyle} onChange={(e) => setQualityTier(Number(e.target.value))}>
          <option value="1.0">Standard (ISI Brands)</option>
          <option value="0.85">Economy (Local Brands)</option>
          <option value="1.3">Premium (Ultra Luxury)</option>
        </select>
      </div>

      {/* Results Display */}
      {builtUpArea > 0 && (
        <>
          <div style={grandTotalCard}>
            <small>Approximate Budget</small>
            <h1 style={{ margin: '5px 0' }}>₹ {calculation.grandTotal.toLocaleString()}</h1>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
            <button onClick={generatePDF} style={btnAction}>PDF REPORT</button>
            <button onClick={() => setIsAdmin(!isAdmin)} style={btnAdmin}>
              {isAdmin ? "CLOSE ADMIN" : "UPDATE RATES"}
            </button>
          </div>
        </>
      )}

      {/* ADMIN PANEL - HIDDEN BY DEFAULT */}
      {isAdmin && (
        <div style={adminPanelStyle}>
          <h3 style={{ marginTop: 0 }}>Update Trichy Market Rates</h3>
          <div style={adminGrid}>
            {Object.keys(rates).map(key => (
              <div key={key}>
                <label style={{ fontSize: '11px', textTransform: 'capitalize' }}>{key}</label>
                <input 
                  type="number" 
                  value={rates[key]} 
                  style={adminInp}
                  onChange={(e) => handleRateChange(key, e.target.value)} 
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// --- STYLING (Optimized for Mobile) ---
const containerStyle = { maxWidth: '450px', margin: '0 auto', background: '#f1f5f9', minHeight: '100vh', padding: '15px', fontFamily: 'sans-serif' };
const headerStyle = { background: '#0f172a', color: 'white', padding: '20px', borderRadius: '15px', textAlign: 'center' as const, marginBottom: '15px' };
const statusBadge = { fontSize: '10px', background: '#16a34a', padding: '3px 8px', borderRadius: '10px', marginTop: '5px', display: 'inline-block' };
const cardStyle = { background: 'white', padding: '20px', borderRadius: '15px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' };
const labelStyle = { fontSize: '12px', fontWeight: 'bold', color: '#64748b', display: 'block', marginBottom: '5px' };
const inputStyle = { width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '10px', marginBottom: '15px', fontSize: '16px', boxSizing: 'border-box' as const };
const grandTotalCard = { background: '#1e293b', color: 'white', padding: '20px', borderRadius: '15px', textAlign: 'center' as const, marginBottom: '15px' };
const btnAction = { background: '#3b82f6', color: 'white', border: 'none', padding: '15px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' };
const btnAdmin = { background: '#64748b', color: 'white', border: 'none', padding: '15px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' };
const adminPanelStyle = { background: '#fff', padding: '20px', borderRadius: '15px', border: '2px dashed #cbd5e1', marginTop: '10px' };
const adminGrid = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' };
const adminInp = { width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '5px', boxSizing: 'border-box' as const };
