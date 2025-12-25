import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Preferences from './pages/Preferences';
 
function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/preferences" element={<Preferences />} />
      <Route path="/" element={<Home />} />
    </Routes>
  );
}

export default App;
