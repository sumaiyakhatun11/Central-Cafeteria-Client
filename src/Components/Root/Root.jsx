import React from 'react';
import Navbar from '../Shared/Navbar';
import { Outlet } from 'react-router-dom';
import StatusBar from '../Shared/StatusBar';

const Root = () => {
    return (
        <div className='min-h-screen bg-gradient-to-br from-red-900/90 to-red-800/50'>
            <Navbar></Navbar>
            <StatusBar></StatusBar>
            <Outlet></Outlet>
            
        </div>
    );
};

export default Root;