import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import './InputSection.css'; // Re-using our nice card styles

const NutriChat = () => {
    // STATE
    const [activeTab, setActiveTab] = useState('analysis'); // 'analysis' or 'shops'
    const [foodInput, setFoodInput] = useState('');
    
    // ANALYSIS STATE
    const [analysisData, setAnalysisData] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [selectedResults, setSelectedResults] = useState({
        main_issues: false,
        simple_fixes: false,
        recommendations: false
    });

    // SHOP STATE
    const [shopsData, setShopsData] = useState(null);
    const [isSearchingShops, setIsSearchingShops] = useState(false);
    const [shopSearchTerm, setShopSearchTerm] = useState('');

    // --- 1. ANALYSIS FUNCTIONALITY ---
    const handleAnalyze = async () => {
        if (!foodInput.trim()) return;
        setIsAnalyzing(true);
        setAnalysisData(null); // Clear previous
       const pos = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject);
            });
        try {
            const res = await fetch('/recommend', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ food: foodInput, lat: pos.coords.latitude, lng: pos.coords.longitude })
            });

            if (!res.ok) throw new Error("Analysis failed");
            
            const data = await res.json();
            setAnalysisData(data);
        } catch (error) {
            alert(error.message);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const toggleResultSelection = (type) => {
        setSelectedResults(prev => ({
            ...prev,
            [type]: !prev[type]
        }));
    };

    // --- 2. SHOP FUNCTIONALITY ---
    const handleFindShops = async () => {
        if (!shopSearchTerm.trim()) return;
        setIsSearchingShops(true);
        setShopsData(null);

        try {
            // Get Location
            const pos = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject);
            });

            const res = await fetch('/shops', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                    query: shopSearchTerm
                })
            });

            if (!res.ok) throw new Error("Shop search failed");
            
            const data = await res.json();
            setShopsData(data.shops || []);
        } catch (error) {
            alert(error.message === "User denied Geolocation" 
                ? "Please allow location access to find shops." 
                : "Error finding shops.");
        } finally {
            setIsSearchingShops(false);
        }
    };

    // --- 3. PDF DOWNLOAD ---
    const downloadPDF = () => {
        if (!analysisData) return;
        
        const doc = new jsPDF();
        const foodName = analysisData.food || "Nutrition Analysis";
        
        doc.setFontSize(20);
        doc.setTextColor(40, 53, 147);
        doc.text(`Report: ${foodName}`, 20, 20);
        
        let yPos = 40;
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);

        Object.keys(selectedResults).forEach(key => {
            if (selectedResults[key] && analysisData[key]) {
                // Title
                doc.setFont(undefined, 'bold');
                doc.text(key.replace('_', ' ').toUpperCase(), 20, yPos);
                yPos += 10;
                
                // Content
                doc.setFont(undefined, 'normal');
                const items = analysisData[key];
                items.forEach(item => {
                    const lines = doc.splitTextToSize(`• ${item}`, 170);
                    doc.text(lines, 25, yPos);
                    yPos += (lines.length * 7);
                });
                yPos += 10;
            }
        });
        
        doc.save(`${foodName}_Analysis.pdf`);
    };

    return (
        <div className="input-card" style={{marginTop: '30px'}}>
            <h2 style={{textAlign:'center', color:'#444', marginBottom:'20px'}}>
                 🤖 NutriChat Assistant
            </h2>

            {/* TABS */}
            <div className="tabs-container">
                <button 
                    className={`tab-btn ${activeTab === 'analysis' ? 'active' : ''}`}
                    onClick={() => setActiveTab('analysis')}
                >
                    🍎 Get Advice
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'shops' ? 'active' : ''}`}
                    onClick={() => setActiveTab('shops')}
                >
                    🏪 Find Shops
                </button>
            </div>

            {/* === TAB 1: ANALYSIS === */}
            {activeTab === 'analysis' && (
                <div className="fade-in">
                    <div className="form-group">
                        <input 
                            type="text" 
                            placeholder="Enter food (e.g. Potato Chips)..." 
                            value={foodInput}
                            onChange={(e) => setFoodInput(e.target.value)}
                            style={{padding: '15px'}}
                        />
                    </div>
                    <button className="analyze-btn" onClick={handleAnalyze} disabled={isAnalyzing}>
                        {isAnalyzing ? "🧠 Analyzing..." : "Get Recommendations"}
                    </button>

                    {/* RESULTS */}
                    {analysisData && (
                        <div style={{marginTop: '20px', borderTop:'1px solid #eee', paddingTop:'20px'}}>
                            <h3>Analysis for: {analysisData.food}</h3>
                            
                            <div style={{display:'flex', gap:'15px', margin:'15px 0'}}>
                                {['main_issues', 'simple_fixes', 'recommendations'].map(key => (
                                    <label key={key} style={{cursor:'pointer', display:'flex', alignItems:'center', gap:'5px'}}>
                                        <input 
                                            type="checkbox" 
                                            checked={selectedResults[key]}
                                            onChange={() => toggleResultSelection(key)}
                                        />
                                        {key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                    </label>
                                ))}
                            </div>

                            {/* CONTENT DISPLAY */}
                            <div style={{background:'#f9f9f9', padding:'15px', borderRadius:'10px', minHeight:'100px'}}>
                                {Object.keys(selectedResults).some(k => selectedResults[k]) ? (
                                    Object.keys(selectedResults).map(key => (
                                        selectedResults[key] && analysisData[key] && (
                                            <div key={key} style={{marginBottom:'15px'}}>
                                                <h4 style={{color:'#1a73e8', textTransform:'capitalize'}}>{key.replace('_',' ')}</h4>
                                                <ul style={{paddingLeft:'20px'}}>
                                                    {analysisData[key].map((item, i) => <li key={i}>{item}</li>)}
                                                </ul>
                                            </div>
                                        )
                                    ))
                                ) : (
                                    <p style={{color:'#999', textAlign:'center'}}>Select a checkbox above to view details</p>
                                )}
                            </div>

                            <button 
                                onClick={downloadPDF}
                                style={{
                                    marginTop:'15px', padding:'10px', width:'100%', 
                                    background:'white', color:'#1a73e8', border:'2px solid #1a73e8', borderRadius:'8px', fontWeight:'bold', cursor:'pointer'
                                }}
                            >
                                📄 Download PDF Report
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* === TAB 2: SHOPS === */}
            {activeTab === 'shops' && (
                <div className="fade-in">
                     <div className="form-group">
                        <input 
                            type="text" 
                            placeholder="What do you want to buy?" 
                            value={shopSearchTerm}
                            onChange={(e) => setShopSearchTerm(e.target.value)}
                            style={{padding: '15px'}}
                        />
                    </div>
                    <button className="analyze-btn" onClick={handleFindShops} disabled={isSearchingShops}>
                        {isSearchingShops ? "📍 Locating..." : "Find Nearby Shops"}
                    </button>

                    {/* SHOP RESULTS */}
                    {shopsData && (
                        <div style={{marginTop:'20px'}}>
                            {shopsData.length === 0 ? (
                                <p style={{textAlign:'center', color:'#999'}}>No shops found nearby.</p>
                            ) : (
                                <div style={{display:'grid', gap:'10px'}}>
                                    {shopsData.map((shop, idx) => (
                                        <div key={idx} style={{background:'#f8f9fa', padding:'12px', borderRadius:'8px', borderLeft:'4px solid #1a73e8'}}>
                                            <div style={{fontWeight:'bold'}}>{shop.name}</div>
                                            <div style={{fontSize:'0.9rem', color:'#666'}}>{shop.vicinity}</div>
                                            <div style={{fontSize:'0.8rem', marginTop:'5px', display:'flex', justifyContent:'space-between'}}>
                                                <span>⭐ {shop.rating} ({shop.user_ratings_total})</span>
                                                <span style={{color: shop.open_now ? 'green' : 'red'}}>
                                                    {shop.open_now ? 'Open Now' : 'Closed or Unknown'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NutriChat;