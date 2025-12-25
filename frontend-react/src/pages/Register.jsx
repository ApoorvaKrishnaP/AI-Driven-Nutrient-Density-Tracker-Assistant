import React, { useState } from 'react';
import { TextField, Button, Paper, Typography, Box, Link } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const Register = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            await api.post('/auth/register', { username: email, password });
            alert('Registration successful! Please login.');
            navigate('/login');
        } catch (error) {
            alert('Registration failed.');
        }
    };

    return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
            <Paper elevation={3} sx={{ p: 4, width: 350 }}>
                <Typography variant="h5" gutterBottom align="center" color="primary">Create Account</Typography>
                <form onSubmit={handleRegister}>
                    <TextField
                        fullWidth label="Email" margin="normal"
                        value={email} onChange={(e) => setEmail(e.target.value)}
                    />
                    <TextField
                        fullWidth type="password" label="Password" margin="normal"
                        value={password} onChange={(e) => setPassword(e.target.value)}
                    />
                    <Button type="submit" fullWidth variant="contained" sx={{ mt: 2 }} color="primary">
                        Register
                    </Button>
                </form>
                <Link href="/login" variant="body2" sx={{ display: 'block', mt: 2, textAlign: 'center' }}>
                    Already have an account? Login
                </Link>
            </Paper>
        </Box>
    );
};

export default Register;
