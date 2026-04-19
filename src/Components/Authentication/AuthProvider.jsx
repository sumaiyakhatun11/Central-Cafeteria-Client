import React, { createContext, useContext, useState, useEffect } from 'react';

// Create the context
const AuthContext = createContext();

const normalizeUser = (rawUser) => {
    if (!rawUser) return null;

    const isAdminLike =
        rawUser.role === 'admin' ||
        rawUser.isadmin === true ||
        rawUser.isAdmin === true ||
        rawUser.isSuperAdmin === true;

    return {
        ...rawUser,
        role: isAdminLike ? 'admin' : (rawUser.role || 'user')
    };
};

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
            setUser(normalizeUser(JSON.parse(storedUser)));
        }
        setLoading(false);
    }, []);

    // Login function (you call this after successful fetch login)
    const login = (userData) => {
        const normalizedUser = normalizeUser(userData);
        localStorage.setItem('authUser', JSON.stringify(normalizedUser));
        setUser(normalizedUser);
    };

    // Logout function
    const logout = () => {
        localStorage.removeItem('authUser');
        setUser(null);
    };

    const updateUser = (newUserData) => {
        const normalizedUser = normalizeUser(newUserData);
        localStorage.setItem('authUser', JSON.stringify(normalizedUser));
        setUser(normalizedUser);
    };

    const value = { user, login, logout, isAuthenticated: !!user, updateUser };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;
