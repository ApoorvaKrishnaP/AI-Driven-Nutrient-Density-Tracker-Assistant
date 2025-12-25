import React, { useState } from 'react';
import './InputSection.css';

const InputSection = ({ onAnalyze }) => {
    // STATE: Tab management and Form Data
    const [activeTab, setActiveTab] = useState('image');
    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [manualData, setManualData] = useState({});

    // STATE: Analysis Status (Passed up typically, but managed here for button UI)
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [statusText, setStatusText] = useState('');
    const [resultScore, setResultScore] = useState(null);

    // --- Image Logic ---
    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (selected) {
            setFile(selected);
            setPreviewUrl(URL.createObjectURL(selected));
            setResultScore(null); // Reset result on new file
        }
    };

    // --- Text Logic ---
    const handleTextChange = (e) => {
        const { name, value } = e.target;
        setManualData(prev => ({ ...prev, [name]: value }));
        setResultScore(null); // Reset result on change
    };

    // --- Submit Wrapper ---
    const handleSubmit = async () => {
        if (!onAnalyze) return;

        setIsAnalyzing(true);
        setResultScore(null);

        // Create a progress callback to update local state
        const updateStatus = (text) => setStatusText(text);
        const updateResult = (score) => setResultScore(score);

        // Call the parent handler
        const data = activeTab === 'image' ? { type: 'image', file } : { type: 'text', ...manualData };

        // We pass setters to the parent so it can control this component's UI
        try {
            await onAnalyze(data, updateStatus, updateResult);
        } catch (e) {
            setStatusText("Error");
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="input-card">

            {/* 1. Tabs */}
            <div className="tabs-container">
                <button
                    className={`tab-btn ${activeTab === 'image' ? 'active' : ''}`}
                    onClick={() => setActiveTab('image')}
                >
                    📷 Scan Image
                </button>
                <button
                    className={`tab-btn ${activeTab === 'text' ? 'active' : ''}`}
                    onClick={() => setActiveTab('text')}
                >
                    📝 Manual Entry
                </button>
            </div>

            {/* 2. Content */}
            <div className="tab-content">

                {/* IMAGE UPLOAD VIEW */}
                {activeTab === 'image' && (
                    <div className="upload-wrapper fade-in">
                        {!previewUrl ? (
                            <label className="upload-area">
                                <input type="file" hidden onChange={handleFileChange} accept="image/*" />
                                <div className="upload-icon">☁️</div>
                                <h3>Click to Upload Food Label</h3>
                                <p>Supports JPG, PNG (Max 10MB)</p>
                            </label>
                        ) : (
                            <div className="preview-area">
                                <img src={previewUrl} alt="Preview" />
                                <button onClick={() => { setPreviewUrl(null); setFile(null) }} className="remove-btn">
                                    × Remove
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* TEXT INPUT VIEW */}
                {activeTab === 'text' && (
                    <div className="manual-form fade-in">
                        {['meal_name', 'Caloric_Value', 'Carbohydrates', 'Protein', 'Sugars', 'Fat', 'Sodium'].map((field) => (
                            <div key={field} className="form-group">
                                <label>{field.replace('_', ' ')}</label>
                                <input
                                    type={field === 'meal_name' ? 'text' : 'number'}
                                    name={field}
                                    placeholder={field === 'meal_name' ? 'e.g. Pasta' : '0'}
                                    onChange={handleTextChange}
                                />
                            </div>
                        ))}
                        <div className="note">Note: Add more fields in the code as needed</div>
                    </div>
                )}
            </div>

            {/* 3. Action Section */}
            <div className="action-section" style={{ marginTop: '24px' }}>
                <button
                    className="analyze-btn"
                    onClick={handleSubmit}
                    disabled={isAnalyzing}
                    style={{ opacity: isAnalyzing ? 0.8 : 1 }}
                >
                    {isAnalyzing ? (
                        <span>⏳ {statusText || "Processing..."}</span>
                    ) : (
                        "🔍 Analyze Nutrition Density"
                    )}
                </button>

                {/* 4. Result Display (Overlay or Inline) */}
                {resultScore !== null && (
                    <div className="result-inline fade-in" style={{
                        marginTop: '20px',
                        padding: '20px',
                        background: resultScore > 70 ? '#e6fcf5' : resultScore > 40 ? '#fff9db' : '#fff5f5',
                        border: `1px solid ${resultScore > 70 ? '#20c997' : resultScore > 40 ? '#fcc419' : '#ff8787'}`,
                        borderRadius: '12px',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '0.9rem', color: '#868e96', marginBottom: '5px' }}>NUTRITION DENSITY SCORE</div>
                        <div style={{
                            fontSize: '3rem',
                            fontWeight: '800',
                            color: resultScore > 70 ? '#0ca678' : resultScore > 40 ? '#fab005' : '#fa5252',
                            lineHeight: '1'
                        }}>
                            {resultScore.toFixed(0)}
                        </div>
                        <div style={{ marginTop: '5px', fontWeight: '500', color: '#495057' }}>
                            {resultScore > 80 ? "Excellent Choice! 🌱" : resultScore > 50 ? "Moderate Density ⚖️" : "Low Nutrition Density 🍔"}
                        </div>
                    </div>
                )}
            </div>

        </div>
    );
};

export default InputSection;
