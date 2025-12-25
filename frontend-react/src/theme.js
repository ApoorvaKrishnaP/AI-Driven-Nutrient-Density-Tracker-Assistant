import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        primary: {
            main: '#42b983', // Your Nutrility Green
        },
        secondary: {
            main: '#2c3e50',
        },
        background: {
            default: '#f4f6f8',
        },
    },
    typography: {
        fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
    },
});

export default theme;
