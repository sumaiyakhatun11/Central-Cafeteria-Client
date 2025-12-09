import React, { createContext, useContext, useState, useEffect } from 'react';

// Create the context
const AuthContext = createContext();

// Hook to access AuthContext easily
export const useAuth = () => useContext(AuthContext);

// Provider component
const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Load user from localStorage on initial mount
    useEffect(() => {
        const storedUser = localStorage.getItem('authUser');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    // Login function (you call this after successful fetch login)
    const login = (userData) => {
        localStorage.setItem('authUser', JSON.stringify(userData));
        setUser(userData);
    };

    // Logout function
    const logout = () => {
        localStorage.removeItem('authUser');
        setUser(null);
    };

    const updateUser = (newUserData) => {
        localStorage.setItem('authUser', JSON.stringify(newUserData));
        setUser(newUserData);
    };

    const value = { user, login, logout, isAuthenticated: !!user, updateUser };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;
