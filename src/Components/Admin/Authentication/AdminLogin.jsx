import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../Authentication/AuthProvider';
import { toast } from 'react-toastify';

const AdminLogin = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('https://central-cafetaria-server.vercel.app/adminlogin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (res.ok) {
                login(data.admin); // Set user in auth context
                navigate('/admin/accounts'); // Redirect to dashboard
            } else {
                toast.error(data.message || 'Login failed');
            }
        } catch (err) {
            console.error('Login error:', err);
            toast.error('Something went wrong');
        }
    };


    return (
        <div className='w-full h-screen flex text-black justify-center items-center relative overflow-hidden'>
            {/* Blurred Background Image */}
            <div
                className='absolute inset-0 bg-cover opacity-50 bg-center filter blur-sm z-0'
                style={{
                    backgroundImage: `url(https://i.ibb.co/fzngpwS3/Whats-App-Image-2025-06-02-at-15-35-28-8e7f8eb2.jpg)`
                }}
            />

            {/* Semi-transparent overlay */}
            <div className='absolute inset-0 bg-whitw/70 z-10'></div>

            {/* Login Form */}
            <div className='z-20 bg-white p-10 rounded-lg shadow-xl w-full max-w-md'>
                <form onSubmit={handleSubmit} className='flex flex-col items-center'>
                    <h2 className='text-3xl border-b-2 pb-2 px-5 border-gray-600 tinos-regular mb-8'>Admin Login</h2>

                    <div className='flex flex-col justify-center items-start mb-5 w-full'>
                        <label htmlFor="email" className='text-xl ml-3 tinos-regular'>Email</label>
                        <input
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className='border-2 text-xl w-full py-2 px-3 focus:outline-none focus:border-gray-700 rounded'
                            type="email"
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
                        className='bg-red-500 hover:bg-red-500 text-white font-bold py-2 px-10 text-xl tinos-regular transition-colors'
                    >
                        Login
                    </button>


                </form>
            </div>
        </div>
    );
};

export default AdminLogin;