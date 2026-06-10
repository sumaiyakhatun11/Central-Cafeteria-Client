import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import Button from '../../Shared/Button';

const Events = () => {
    const [showPastEvents, setShowPastEvents] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const isBaseRoute = location.pathname === '/admin/events';

    const handleCurrent = () => {
        setShowPastEvents(false);
        navigate('/admin/events');
    };

    const handlePast = () => {
        setShowPastEvents(true);
        navigate('/admin/events');
    };

    return (
        <div className="p-6">
            <div className="flex justify-center items-center gap-4 mb-6">
                <Button
                    onClick={handleCurrent}
                    variant={isBaseRoute && !showPastEvents ? 'primary' : 'secondary'}
                >
                    Current Events
                </Button>

                <Button
                    onClick={handlePast}
                    variant={isBaseRoute && showPastEvents ? 'primary' : 'secondary'}
                >
                    Past Events
                </Button>

                <NavLink
                    to="/admin/events/manage-packages"
                    className={({ isActive }) =>
                        `btn transition-all duration-200 flex items-center justify-center gap-2 font-semibold ${
                            isActive
                                ? 'bg-red-600 hover:bg-red-700 text-white border-none'
                                : 'btn-outline border-2 border-red-600 text-red-600 hover:bg-red-600 hover:border-red-600'
                        }`
                    }
                >
                    Manage Food Packages
                </NavLink>
            </div>

            <Outlet context={{ showPastEvents }} />
        </div>
    );
};

export default Events;