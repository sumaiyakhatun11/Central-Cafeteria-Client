import React, { useState } from 'react';
import Users from './Users';
import Admins from './Admins';
import CoinRequests from './CoinRequests';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Accounts = () => {
    const [view, setView] = useState('users'); // 'users', 'admins', or 'coin-requests'

    return (
        <div className="p-6 ">
            <div className="flex justify-center gap-4 mb-6">
                <button 
                    onClick={() => setView('users')}
                    className={`btn px-5 ${view === 'users' ? 'bg-red-600 text-white' : 'bg-gray-300 text-slate-800'}`}
                >
                    Users
                </button>
                <button 
                    onClick={() => setView('admins')}
                    className={`btn px-5 ${view === 'admins' ? 'bg-red-600 text-white' : 'bg-gray-300 text-slate-800'}`}
                >
                    Admins
                </button>
                <button
                    onClick={() => setView('coin-requests')}
                    className={`btn px-5 ${view === 'coin-requests' ? 'bg-red-600 text-white' : 'bg-gray-300 text-slate-800'}`}
                >
                    Coin Requests
                </button>
            </div>

            {view === 'users' && <Users />}
            {view === 'admins' && <Admins />}
            {view === 'coin-requests' && <CoinRequests />}
            
            
        </div>
    );
};

export default Accounts;

