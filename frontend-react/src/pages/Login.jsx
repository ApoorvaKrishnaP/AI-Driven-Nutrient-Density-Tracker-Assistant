import React, { useState } from 'react';
import { TextField, Button, Paper, Typography, Box, Link } from '@mui/material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {

            const response = await api.post('/auth/login', { username: email, password });
            localStorage.setItem('token', response.data.access_token);
            navigate('/'); // Redirect to Home
        } catch (error) {
            alert('Login failed: ' + (error.response?.data?.detail || error.message));
        }
    };

    return (
        <Box
            component={motion.div}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            display="flex"
            justifyContent="center"
            alignItems="center"
            minHeight="100vh"
        >
            <Paper elevation={3} sx={{ p: 4, width: 350, backdropFilter: 'blur(10px)', background: 'rgba(255,255,255,0.8)' }}>
                <Typography variant="h5" gutterBottom align="center" color="primary">Welcome Back</Typography>
                <form onSubmit={handleLogin}>
                    <TextField
                        fullWidth label="Email" margin="normal"
                        value={email} onChange={(e) => setEmail(e.target.value)}
                    />
                    <TextField
                        fullWidth type="password" label="Password" margin="normal"
                        value={password} onChange={(e) => setPassword(e.target.value)}
                    />
                    <Button type="submit" fullWidth variant="contained" sx={{ mt: 2 }} color="primary">
                        Login
                    </Button>
                </form>
                <Link href="/register" variant="body2" sx={{ display: 'block', mt: 2, textAlign: 'center' }}>
                    Don't have an account? Register
                </Link>
            </Paper>
        </Box>
    );
};

export default Login;
