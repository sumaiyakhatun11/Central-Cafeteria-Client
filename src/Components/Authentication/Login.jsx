import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [showScanner, setShowScanner] = useState(false);

    const [formData, setFormData] = useState({
        identifier: '', // could be email or ID
        password: ''
    });

    useEffect(() => {
        if (showScanner) {
            const scanner = new Html5QrcodeScanner('qr-reader', {
                qrbox: { width: 250, height: 250 },
                fps: 5,
            }, false);

            const onScanSuccess = async (decodedText) => {
                scanner.clear();
                setShowScanner(false);
                
                try {
                    const response = await fetch('https://central-cafetaria-server.vercel.app/login-qr', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ qrCodeString: decodedText })
                    });

                    const data = await response.json();

                    if (response.ok) {
                        login(data.user);
                        navigate('/');
                    } else {
                        toast.error(data.message || 'QR Login failed.');
                    }
                } catch (err) {
                    console.error('Error during QR login:', err);
                    toast.error('An error occurred. Please try again.');
                }
            };

            scanner.render(onScanSuccess, (err) => { /* handle error */ });

            return () => {
                scanner.clear().catch(err => console.error("Scanner cleanup failed.", err));
            };
        }
    }, [showScanner, login, navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('https://central-cafetaria-server.vercel.app/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                login(data.user);
                navigate('/');
            } else {
                console.error('Login failed:', data.message);
                toast.error(data.message);
            }
        } catch (err) {
            console.error('Error logging in:', err);
            toast.error('Something went wrong. Please try again later.');
        }
    };

    return (
        <div className='w-full h-screen flex justify-center items-center relative overflow-hidden'>
            <div
                className='absolute inset-0 bg-cover opacity-50 bg-center filter blur-sm z-0'
                style={{ backgroundImage: `url(https://i.ibb.co/fzngpwS3/Whats-App-Image-2025-06-02-at-15-35-28-8e7f8eb2.jpg)` }}
            />
            <div className='absolute inset-0 bg-white/70 z-10'></div>

            <div className='z-20 bg-white p-10 rounded-lg shadow-xl w-full max-w-md'>
                <h2 className='text-3xl border-b-2 pb-2 px-5 border-gray-600 tinos-regular mb-8'>Login</h2>
                
                {showScanner ? (
                    <div className='w-full'>
                        <div id="qr-reader"></div>
                        <button type="button" onClick={() => setShowScanner(false)} className="btn btn-sm btn-warning w-full mt-2">Cancel Scan</button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className='flex flex-col items-center'>
                        <div className='flex flex-col justify-center items-start mb-5 w-full'>
                            <label htmlFor="identifier" className='text-xl ml-3 tinos-regular'>Email or ID</label>
                            <input
                                name="identifier"
                                value={formData.identifier}
                                onChange={handleChange}
                                className='border-2 text-xl w-full py-2 px-3 focus:outline-none focus:border-gray-700 rounded'
                                type="text"
                                required
                            />
                        </div>

                        <div className='flex flex-col justify-center items-start mb-8 w-full'>
                            <label htmlFor="password" className='text-xl ml-3 tinos-regular'>Password</label>
                            <input
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className='border-2 text-xl w-full py-2 px-3 focus:outline-none focus:border-gray-700 rounded'
                                type="password"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className='bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-10 text-xl tinos-regular transition-colors'
                        >
                            Login
                        </button>

                        <div className="divider my-4">OR</div>

                        <button 
                            type="button"
                            onClick={() => setShowScanner(true)}
                            className="btn btn-outline w-full"
                        >
                            Scan QR to Login
                        </button>

                        <div className='mt-4 tinos-regular'>
                            <p>Don't have an account? <NavLink to="/reg" className="text-blue-600 hover:underline">Sign Up</NavLink></p>
                        </div>
                    </form>
                )}
            </div>
            <ToastContainer />
        </div>
    );
};

export default Login;