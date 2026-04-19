import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';

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
                <button
                    onClick={handleCurrent}
                    className={`btn px-5 ${
                        isBaseRoute && !showPastEvents
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-300 text-slate-800'
                    }`}
                >
                    Current Events
                </button>

                <button
                    onClick={handlePast}
                    className={`btn px-5 ${
                        isBaseRoute && showPastEvents
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-300 text-slate-800'
                    }`}
                >
                    Past Events
                </button>

                <NavLink
                    to="/admin/events/manage-packages"
                    className={({ isActive }) =>
                        `btn ${
                            isActive
                                ? 'bg-red-600 text-white'
                                : 'border-2 border-red-600'
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