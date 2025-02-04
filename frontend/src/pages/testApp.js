// Wraps the Tol component with TolContext
import React from 'react';
import { TolProvider } from '../components/tolContext';
import TestTol from './testTol';

function TestApp() {
    return (
        <TolProvider>
            <TestTol />
        </TolProvider>
    );
}

export default TestApp;