// Wraps the Tol component with TolContext
import React from 'react';
import { TolProvider } from '../components/tolContext';
import Tol from './tol';

function TolApp() {
    return (
        <TolProvider>
            <Tol />
        </TolProvider>
    );
}

export default TolApp;