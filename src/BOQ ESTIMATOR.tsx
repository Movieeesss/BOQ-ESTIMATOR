import React, { useState, useMemo, useCallback, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- 1. FULL ENGINEERING CONSTANTS ---
const ENG_LOGIC = {
  cement: 0.42,    // Bags per Sft
  steel: 4.0,     // Kg per Sft
  sand: 1.8,      // Cft per Sft (Concrete + Plaster)
  aggregate: 1.35, // Cft per Sft
  bricks: 22,     // Nos per Sft
  paint: 0.25,    // Liters per Sft (Total surface area coverage)
  tiles: 1.1,     // Sq.ft per Sft (Including 10% wastage)
};

// --- 2. MATERIAL SPECIFICATIONS (From Images 3, 4, 7 & 8) ---
const MATERIALS = [
  { item: "Cement", brand: "Ramco Super Plast / Chettinad / UltraTech", unit: "Bags", constant: ENG_LOGIC.cement },
  { item: "Steel", brand: "Fe 550D TMT Bars PULKIT / JSW", unit: "Kgs", constant: ENG_LOGIC.steel },
  { item: "Sand/M-Sand", brand: "M-Sand & P-Sand (Filtered)", unit: "Cft", constant: ENG_LOGIC.sand },
  { item: "Bricks", brand: "Chamber Brick / Fly-Ash Brick", unit: "Nos", constant: ENG_LOGIC.bricks },
  { item: "Aggregates", brand: "20mm & 40mm Blue Metal", unit: "Cft", constant: ENG_LOGIC.aggregate },
  { item: "Tiles", brand: "KAG / Millenium / Vitrified (4'x2')", unit: "Sft", constant: ENG_LOGIC.tiles },
  { item: "Painting", brand: "Asian Paints (Apex / Advanced)", unit: "Ltrs", constant: ENG_LOGIC.paint },
  { item: "Plumbing", brand: "AvonPlast / Trubore / Finolex", unit: "LS", constant: 0 },
  { item: "Electrical", brand: "Finolex / GM Modular / Legrand", unit: "LS", constant: 0 },
];

interface BOQItem {
  id: number; cat: string; desc: string; qty: number; rate: number; unit: string;
}

const EditableInput = ({ value, onSave, type = "text", style }: any) => {
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
    />
  );
};

export default function MasterBOQEstimator() {
  const [builtArea, setBuiltArea] = useState<number>(1500);
  const [clientName, setClientName] = useState("Mr. Rajendran");
  const [location, setLocation] = useState("Musiri, Trichy");
  const [projectDate, setProjectDate] = useState(new Date().toISOString().split('T')[0]);

  const [items, setItems] = useState<BOQItem[]>([
    { id: 1, cat: "Civil", desc: "Main Building Construction", qty: 1500, rate: 2300, unit: "Sft" },
    { id: 2, cat: "Water", desc: "UG Septic Tank (6000 Ltrs)", qty: 6000, rate: 15, unit: "Ltr" },
    { id: 3, cat: "Water", desc: "UG Sump (4000 Ltrs) + 1HP Motor", qty: 4000, rate: 15, unit: "Ltr" },
    { id: 4, cat: "Utility", desc: "Borewell with 1 HP Jet Pump", qty: 1, rate: 85000, unit: "Nos" },
    { id: 5, cat: "Utility", desc: "3 Phase E.B. Supply Charges", qty: 1, rate: 100000, unit: "Nos" },
  ]);

  const summary = useMemo(() => {
    const cost = items.reduce((sum, i) => sum + (i.qty * i.rate), 0);
    return { cost };
  }, [items]);

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("UNIQ DESIGNS - FULL MATERIAL BOQ", 105, 15, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`Client: ${clientName} | Location: ${location}`, 14, 25);
    doc.text(`Date: ${projectDate} | Area: ${builtArea} Sft`, 14, 30);

    // Table 1: Cost Estimation
    const costBody: any[] = items.filter(i => i.qty > 0).map(i => [
      i.desc, `${i.qty} ${i.unit}`, `Rs.${i.rate}`, `Rs.${(i.qty * i.rate).toLocaleString()}`
    ]);

    autoTable(doc, {
      startY: 35,
      head: [['Work Description', 'Quantity', 'Rate', 'Total']],
      body: costBody,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42] }
    });

    // Table 2: Material Transparency Breakdown
    const matBody = MATERIALS.map(m => [
      m.item, 
      m.brand, 
      m.constant > 0 ? `${Math.round(builtArea * m.constant)} ${m.unit}` : "As per site",
      m.constant > 0 ? `${m.constant} / Sft` : "Included"
    ]);

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [[{ content: 'MATERIAL TAKE-OFF (TRANSPARENCY)', colSpan: 4, styles: { halign: 'center' } }]],
      body: matBody,
      theme: 'striped',
      headStyles: { fillColor: [184, 134, 11] }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.text(`GRAND TOTAL: Rs. ${summary.cost.toLocaleString()}`, 105, finalY, { align: 'center' });

    doc.save(`${clientName}_Final_BOQ.pdf`);
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h2 style={{ margin: 0 }}>BOQ MASTER ESTIMATOR</h2>
        <p style={{ fontSize: '11px' }}>Structural Standards • Full Material Visibility</p>
      </div>

      <div style={areaCard}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <div style={{ flex: 1 }}><label style={miniLabel}>Client</label><EditableInput value={clientName} onSave={setClientName} style={detailInp} /></div>
          <div style={{ flex: 1 }}><label style={miniLabel}>Location</label><EditableInput value={location} onSave={setLocation} style={detailInp} /></div>
        </div>
        <label style={labelStyle}>Total Built-up Area (Sq.Ft)</label>
        <EditableInput type="number" value={builtArea} onSave={(val: any) => setBuiltArea(Number(val))} style={areaInput} />
      </div>

      <div style={scrollArea}>
        {items.map((item) => (
          <div key={item.id} style={itemCard}>
            <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{item.desc}</div>
            <div style={inputRow}>
              <div style={{ flex: 1 }}><EditableInput type="number" value={item.qty} style={smallInp} onSave={(v: any) => updateItem(item.id, 'qty', Number(v))} /></div>
              <div style={{ flex: 1 }}><EditableInput type="number" value={item.rate} style={smallInp} onSave={(v: any) => updateItem(item.id, 'rate', Number(v))} /></div>
              <div style={rowTotal}>₹{(item.qty * item.rate).toLocaleString()}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={floatingFooter}>
        <div style={footerText}>
          <div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>TOTAL BUDGET</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#16a34a' }}>₹ {summary.cost.toLocaleString()}</div>
          </div>
          <button onClick={() => window.open(`https://wa.me/?text=BOQ for ${clientName}: ₹${summary.cost.toLocaleString()}`)} style={waBtn}>WHATSAPP</button>
        </div>
        <button onClick={generatePDF} style={pdfBtn}>GENERATE FULL REPORT 📄</button>
      </div>
    </div>
  );
}

// --- STYLING ---
const containerStyle = { maxWidth: '100%', minHeight: '100vh', background: '#f8fafc', paddingBottom: '160px', fontFamily: 'sans-serif' };
const headerStyle = { background: '#0f172a', color: 'white', padding: '30px 20px', textAlign: 'center' as const };
const areaCard = { background: 'white', margin: '-20px 15px 15px 15px', padding: '15px', borderRadius: '15px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', zIndex: 10, position: 'relative' as const };
const detailInp = { width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px' };
const areaInput = { width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '20px', fontWeight: 'bold' as const, textAlign: 'center' as const };
const labelStyle = { fontSize: '11px', color: '#64748b', fontWeight: 'bold' as const, marginBottom: '5px', display: 'block', textAlign: 'center' as const };
const miniLabel = { fontSize: '10px', color: '#94a3b8', display: 'block' };
const scrollArea = { padding: '0 10px' };
const itemCard = { background: 'white', padding: '15px', borderRadius: '12px', marginBottom: '10px', border: '1px solid #e2e8f0' };
const inputRow = { display: 'flex', gap: '10px', alignItems: 'flex-end', marginTop: '10px' };
const smallInp = { width: '100%', border: '1px solid #f1f5f9', padding: '8px', borderRadius: '8px', fontSize: '14px', background: '#f8fafc' };
const rowTotal = { fontWeight: 'bold' as const, fontSize: '14px', color: '#334155', minWidth: '95px', textAlign: 'right' as const };
const floatingFooter = { position: 'fixed' as const, bottom: 0, width: '100%', background: 'white', padding: '20px', borderTop: '3px solid #0f172a', boxShadow: '0 -10px 25px rgba(0,0,0,0.1)', zIndex: 1000, boxSizing: 'border-box' as const };
const footerText = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' };
const pdfBtn = { width: '100%', padding: '16px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold' as const, fontSize: '15px' };
const waBtn = { padding: '12px 20px', background: '#22c55e', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold' as const, fontSize: '13px' };
