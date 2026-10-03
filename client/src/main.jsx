import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import { SettingsProvider } from './hooks';
import App from './App';
import './styles.css';
createRoot(document.getElementById('root')).render(<BrowserRouter><SettingsProvider><AuthProvider><App /></AuthProvider></SettingsProvider></BrowserRouter>);
