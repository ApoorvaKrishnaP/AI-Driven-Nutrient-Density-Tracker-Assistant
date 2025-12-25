import { Container, Typography, Box, Button } from '@mui/material';
import { motion } from 'framer-motion';
import { Link as RouterLink } from 'react-router-dom';
import NutriChat from '../components/NutriChat';
import InputSection from '../components/InputSection';
import api from '../services/api';

const Home = () => {

    const handleAnalyze = async (data, setStatus, setResult) => {
        console.log("Analysis requested:", data);
        try {
            let nutrientData = {};

            // 1. Handle Image Input
            if (data.type === 'image') {
                if (!data.file) {
                    alert("Please select an image first.");
                    return;
                }

                const formData = new FormData();
                formData.append('image', data.file);

                // Call Image API which now does Extraction + Prediction directly
                setStatus("Analyzing Image...");
                const ocrRes = await api.post('/img_to_text', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });

                // Response is now { prediction: number, meal_name: string }
                const score = ocrRes.data.prediction;
                console.log("Analysis Result:", ocrRes.data);

                if (score === undefined || score === null) {
                    setStatus("Analysis Failed");
                    return;
                }

                setResult(score);
                setStatus("Complete");
                return; // Done for image
            }

            // 2. Handle Manual Input (still needs separate predict call)
            nutrientData = { ...data };
            delete nutrientData.type; // Remove 'type' field

            // 3. Call Prediction API
            setStatus("Calculating Score...");

            // Ensure numeric values are numbers
            for (const key in nutrientData) {
                if (key !== 'meal_name') {
                    nutrientData[key] = parseFloat(nutrientData[key]) || 0;
                }
            }

            // Default meal name if missing
            if (!nutrientData.meal_name) {
                nutrientData.meal_name = "Manual Meal";
            }

            const predictRes = await api.post('/predict', nutrientData);
            const score = predictRes.data.prediction;

            // Update Result in Child Component
            setResult(score);
            setStatus("Complete");

        } catch (error) {
            console.error("Analysis failed:", error);
            setStatus("Error");
            throw error; // Re-throw to reset button state in child
        }
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, pb: 10 }}>
            {/* Navigation / Header */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                <Box>
                    <Typography variant="h3" fontWeight="bold" color="primary">NUTRILITY</Typography>
                    <Typography variant="subtitle1" color="text.secondary">
                        AI-Powered Nutrition Analysis & Prediction
                    </Typography>
                </Box>
                <Box>
                    {localStorage.getItem('token') ? (
                        <>
                            <Button
                                component={RouterLink}
                                to="/preferences"
                                variant="contained"
                                color="warning"
                                sx={{ mr: 2 }}
                            >
                                🆔 Set Food ID
                            </Button>
                            <Button
                                onClick={() => {
                                    localStorage.removeItem('token');
                                    window.location.reload();
                                }}
                                variant="outlined"
                            >
                                Logout
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button component={RouterLink} to="/login" variant="outlined" sx={{ mr: 2 }}>
                                Login
                            </Button>
                            <Button component={RouterLink} to="/register" variant="contained">
                                Register
                            </Button>
                        </>
                    )}
                </Box>
            </Box>

            {/* Main Content Area */}
            <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '30px' }}>

                {/* 1. The Image/Text Scanner */}
                <Box width="100%" component={motion.div} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
                    <InputSection onAnalyze={handleAnalyze} />
                </Box>

                {/* 2. The Chatbot Assistant */}
                <Box width="100%" component={motion.div} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
                    <NutriChat />
                </Box>

            </div>
        </Container>
    );
};

export default Home;
