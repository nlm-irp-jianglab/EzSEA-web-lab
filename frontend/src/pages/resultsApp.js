// App.js
import React from 'react';
import { TolProvider } from '../components/tolContext';
import Results from './results';

function ResultsApp() {
    return (
        <TolProvider>
            <Results />
        </TolProvider>
    );
}

export default ResultsApp;