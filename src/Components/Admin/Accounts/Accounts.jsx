import React, { useState } from 'react';
import Users from './Users';
import Admins from './Admins';
import CoinRequests from './CoinRequests';
import Button from '../../Shared/Button';

const Accounts = () => {
    const [view, setView] = useState('users'); // 'users', 'admins', or 'coin-requests'

    return (
        <div className="p-6 ">
            <div className="flex justify-center gap-4 mb-6">
                <Button 
                    onClick={() => setView('users')}
                    variant={view === 'users' ? 'primary' : 'secondary'}
                >
                    Users
                </Button>
                <Button 
                    onClick={() => setView('admins')}
                    variant={view === 'admins' ? 'primary' : 'secondary'}
                >
                    Admins
                </Button>
                <Button
                    onClick={() => setView('coin-requests')}
                    variant={view === 'coin-requests' ? 'primary' : 'secondary'}
                >
                    Coin Requests
                </Button>
            </div>

            {view === 'users' && <Users />}
            {view === 'admins' && <Admins />}
            {view === 'coin-requests' && <CoinRequests />}
            
            
        </div>
    );
};

export default Accounts;

