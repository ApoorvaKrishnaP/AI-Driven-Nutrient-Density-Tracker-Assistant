import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Grid, Button, Paper, CircularProgress } from '@mui/material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const Preferences = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // State matching the schema
    const [prefs, setPrefs] = useState({
        diet_type: null,
        is_low_sugar: false,
        is_low_carb: false,
        is_lactose_free: false,
        primary_goal: null
    });

    // Load existing preferences on mount
    useEffect(() => {
        const loadPrefs = async () => {
            try {
                const res = await api.get('/auth/preferences');
                // api.js adds the token automatically. 
                // If it returns data, update state.
                if (res.data && Object.keys(res.data).length > 0) {
                    setPrefs(prev => ({ ...prev, ...res.data }));
                }
            } catch (error) {
                console.error("Failed to load preferences:", error);
                // If 401, maybe redirect login? For now just stay here.
            } finally {
                setLoading(false);
            }
        };
        loadPrefs();
    }, []);

    const handleDietSelect = (value) => {
        setPrefs(prev => ({ ...prev, diet_type: value }));
    };

    const handleGoalSelect = (value) => {
        setPrefs(prev => ({ ...prev, primary_goal: value }));
    };

    const toggleRestriction = (key) => {
        setPrefs(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSave = async () => {
        if (!prefs.diet_type || !prefs.primary_goal) {
            alert("Please select a Diet Type and a Primary Goal!");
            return;
        }

        setSaving(true);
        try {
            await api.post('/auth/preferences', prefs);
            alert("Identity Saved! The Chatbot will now personalize your advice.");
            navigate('/'); // Go back home
        } catch (error) {
            console.error("Save error:", error);
            alert("Failed to save preferences. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    // Helper for Card styling
    const CardOption = ({ selected, onClick, image, title, subTitle, color }) => (
        <Paper
            elevation={selected ? 6 : 2}
            onClick={onClick}
            sx={{
                p: 2,
                cursor: 'pointer',
                textAlign: 'center',
                borderRadius: 4,
                border: selected ? `2px solid ${color}` : '2px solid transparent',
                bgcolor: selected ? `${color}15` : 'background.paper', // slight tint
                transition: 'all 0.3s ease',
                '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 },
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
            }}
        >
            <Box sx={{ width: 60, height: 60, mb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={image} alt={title} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
            </Box>
            <Typography variant="subtitle2" fontWeight="bold">{title}</Typography>
            <Typography variant="caption" color="text.secondary">{subTitle}</Typography>
        </Paper>
    );

    if (loading) {
        return <Box display="flex" justifyContent="center" mt={10}><CircularProgress /></Box>;
    }

    return (
        <Container maxWidth="md" sx={{ mt: 4, pb: 10 }}>
            <Box textAlign="center" mb={5}>
                <Typography variant="h4" fontWeight="bold" color="primary" gutterBottom>
                    Set Your Food Identity
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Personalize your experience to get the best nutrient advice.
                </Typography>
            </Box>

            {/* Section 1: Diet Type */}
            <Typography variant="h6" sx={{ borderBottom: '1px solid #eee', pb: 1, mb: 3 }}>
                1. The Base (Select One)
            </Typography>
            <Grid container spacing={2} mb={4}>
                {[
                    { val: 'vegan', img: '/images/Vegan.png', title: 'Plant Power', sub: 'Vegan' },
                    { val: 'vegetarian', img: '/images/Vegetarian.png', title: 'Dairy & Greens', sub: 'Vegetarian' },
                    { val: 'Eggetarian', img: '/images/Eggetarian.png', title: 'Eggs', sub: 'Eggetarian' },
                    { val: 'non_veg', img: '/images/Non_vegetarian.png', title: 'The Hunter', sub: 'Non-Veg' }
                ].map((opt) => (
                    <Grid item xs={6} sm={3} key={opt.val}>
                        <CardOption
                            selected={prefs.diet_type === opt.val}
                            onClick={() => handleDietSelect(opt.val)}
                            image={opt.img}
                            title={opt.title}
                            subTitle={opt.sub}
                            color="#4CAF50"
                        />
                    </Grid>
                ))}
            </Grid>

            {/* Section 2: Restrictions */}
            <Typography variant="h6" sx={{ borderBottom: '1px solid #eee', pb: 1, mb: 3 }}>
                2. The Enemies (Select All That Apply)
            </Typography>
            <Grid container spacing={2} mb={4}>
                {[
                    { key: 'is_low_sugar', img: '/images/Low_sugar.png', title: 'Sugar Crash', sub: 'Low Sugar' },
                    { key: 'is_low_carb', img: '/images/Keto_or_low_carb.png', title: 'Carb Load', sub: 'Low Carb' },
                    { key: 'is_lactose_free', img: '/images/Gluten_or_Dairy_Restriction.png', title: 'The Bloat', sub: 'Lactose Free' }
                ].map((opt) => (
                    <Grid item xs={6} sm={4} key={opt.key}>
                        <CardOption
                            selected={prefs[opt.key]}
                            onClick={() => toggleRestriction(opt.key)}
                            image={opt.img}
                            title={opt.title}
                            subTitle={opt.sub}
                            color="#FF5252"
                        />
                    </Grid>
                ))}
            </Grid>

            {/* Section 3: Goal */}
            <Typography variant="h6" sx={{ borderBottom: '1px solid #eee', pb: 1, mb: 3 }}>
                3. The Superpower (Select Goal)
            </Typography>
            <Grid container spacing={2} mb={5}>
                {[
                    { val: 'weight_loss', img: '/images/weight_loss.png', title: 'Slim Down', sub: 'Weight Loss' },
                    { val: 'muscle_gain', img: '/images/Muscle_gain.png', title: 'Muscle Up', sub: 'Muscle Gain' }
                ].map((opt) => (
                    <Grid item xs={6} sm={6} key={opt.val}>
                        <CardOption
                            selected={prefs.primary_goal === opt.val}
                            onClick={() => handleGoalSelect(opt.val)}
                            image={opt.img}
                            title={opt.title}
                            subTitle={opt.sub}
                            color="#2196F3"
                        />
                    </Grid>
                ))}
            </Grid>

            <Button
                variant="contained"
                size="large"
                fullWidth
                onClick={handleSave}
                disabled={saving}
                sx={{
                    py: 2,
                    fontSize: '1.1rem',
                    background: 'linear-gradient(90deg, #4CAF50, #45a049)',
                    boxShadow: '0 4px 15px rgba(76,175,80,0.4)'
                }}
            >
                {saving ? 'Saving...' : '💾 Save My Identity'}
            </Button>
        </Container>
    );
};

export default Preferences;
