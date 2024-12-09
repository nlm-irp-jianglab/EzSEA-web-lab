// App.js
import React from 'react';
import { TolProvider } from '../components/tolContext';
import Tol from './tol';

function App() {
    return (
        <TolProvider>
            <Tol />
        </TolProvider>
    );
}

export default App;