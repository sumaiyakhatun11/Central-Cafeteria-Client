import React from 'react';
import Navbar from '../Shared/Navbar';
import { Outlet } from 'react-router-dom';
import StatusBar from '../Shared/StatusBar';
import Footer from '../Shared/Footer';
import { useAuth } from '../Authentication/AuthProvider';

const Root = () => {
    const user = useAuth()

    return (
        <div className={user ?`min-h-screen `: `min-h-screen bg-gradient-to-br from-red-900/90 to-red-800/50`}>
            <Navbar></Navbar>
            <StatusBar></StatusBar>
            <Outlet></Outlet>
            <Footer></Footer>
        </div>
    );
};

export default Root;