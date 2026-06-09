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
            <div className='sticky top-0 z-50 mb-5'>
                <Navbar></Navbar>
                <StatusBar></StatusBar>
            </div>
            <Outlet></Outlet>
            <Footer></Footer>
        </div>
    );
};

export default Root;