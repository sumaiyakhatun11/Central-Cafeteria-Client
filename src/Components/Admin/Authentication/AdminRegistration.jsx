import React, { useState, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { toast } from 'react-toastify';

const AdminRegistration = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        studentIdCards: [],
        uploadProgress: 0,
        isSubmitting: false
    });

    const [errors, setErrors] = useState({});
    const fileInputRef = useRef(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);

        if (files.length < 2) {
            setErrors(prev => ({
                ...prev,
                studentIdCards: 'Please upload at least 2 images'
            }));
            return;
        }

        setErrors(prev => ({ ...prev, studentIdCards: null }));

        const newImages = files.map(file => {
            return {
                file,
                preview: URL.createObjectURL(file),
                uploaded: false,
                url: null
            };
        });

        setFormData(prev => ({
            ...prev,
            studentIdCards: [...prev.studentIdCards, ...newImages].slice(0, 4) // Limit to 4 images max
        }));
    };

    const handleRemoveImage = (index) => {
        setFormData(prev => {
            const updatedCards = [...prev.studentIdCards];
            URL.revokeObjectURL(updatedCards[index].preview);
            updatedCards.splice(index, 1);
            return { ...prev, studentIdCards: updatedCards };
        });
    };

    const uploadToImgBB = async (imageFile) => {
        const formData = new FormData();
        formData.append('image', imageFile);

        try {
            const response = await fetch('https://api.imgbb.com/1/upload?key=1bd43b51970f772c727eeb303938d6b9', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            return data.data.url;
        } catch (error) {
            toast.error('Image upload failed.');
            return null;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        const newErrors = {};
        if (formData.password !== formData.confirmPassword) {
            newErrors.password = "Passwords don't match!";
        }
        if (formData.studentIdCards.length < 2) {
            newErrors.studentIdCards = 'Please upload at least 2 images';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setFormData(prev => ({ ...prev, isSubmitting: true }));

        try {
            // Upload all images to ImgBB
            const uploadPromises = formData.studentIdCards.map(card =>
                !card.uploaded ? uploadToImgBB(card.file) : Promise.resolve(card.url)
            );

            const urls = await Promise.all(uploadPromises);

            // Prepare submission data
            const submissionData = {
                email: formData.email,
                password: formData.password,
                studentIdCards: urls.filter(url => url) // Filter out any failed uploads
            };

            // Submit to backend using fetch POST
            const response = await fetch(`https://central-cafetaria-server.vercel.app/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(submissionData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Registration failed');
            }

            const data = await response.json();

            // Handle successful registration
            toast.success('Registration successful!');
            // Optionally redirect to login or dashboard
            // navigate('/login');

        } catch (error) {
            console.error('Registration error:', error);
            toast.error(error.message || 'Registration failed. Please try again.');
        } finally {
            setFormData(prev => ({ ...prev, isSubmitting: false }));
        }
    };

    return (
        <div className='w-full py-10 min-h-screen flex justify-center items-center relative overflow-hidden'>
            {/* Blurred Background Image */}
            <div
                className='absolute inset-0 bg-cover opacity-50 bg-center filter blur-sm z-0'
                style={{
                    backgroundImage: `url(https://i.ibb.co/fzngpwS3/Whats-App-Image-2025-06-02-at-15-35-28-8e7f8eb2.jpg)`
                }}
            />

            {/* Semi-transparent overlay */}
            <div className='absolute inset-0 bg-white/30 z-10'></div>

            {/* Registration Form */}
            <div className='z-20 bg-white p-8 rounded-lg shadow-xl w-full lg:max-w-[500px] '>
                <form onSubmit={handleSubmit} className='flex flex-col items-center'>
                    <h2 className='text-3xl border-b-2 pb-2 px-5 border-gray-600 tinos-regular mb-6'>Register</h2>

                    {/* Email Field */}
                    <div className='flex flex-col justify-center items-start mb-4 w-full'>
                        <label htmlFor="email" className='text-lg ml-3 tinos-regular'>Email</label>
                        <input
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className='border-2 text-lg w-full py-2 px-3 focus:outline-none focus:border-gray-700 rounded mt-1'
                            type="email"
                            required
                        />
                    </div>

                    {/* Password Field */}
                    <div className='flex flex-col justify-center items-start mb-4 w-full'>
                        <label htmlFor="password" className='text-lg ml-3 tinos-regular'>Password</label>
                        <input
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className='border-2 text-lg w-full py-2 px-3 focus:outline-none focus:border-gray-700 rounded mt-1'
                            type="password"
                            required
                            minLength="6"
                        />
                        {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                    </div>

                    {/* Confirm Password Field */}
                    <div className='flex flex-col justify-center items-start mb-6 w-full'>
                        <label htmlFor="confirmPassword" className='text-lg ml-3 tinos-regular'>Confirm Password</label>
                        <input
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            className='border-2 text-lg w-full py-2 px-3 focus:outline-none focus:border-gray-700 rounded mt-1'
                            type="password"
                            required
                            minLength="6"
                        />
                    </div>

                    {/* Student ID Card Upload */}
                    <div className='flex flex-col justify-center items-start mb-6 w-full'>
                        <label className='text-lg ml-3 tinos-regular mb-2'>
                            Student ID Card (Minimum 2 images)
                        </label>

                        {/* Image Preview Grid */}
                        <div className='grid grid-cols-2 gap-4 w-full mb-4'>
                            {formData.studentIdCards.map((card, index) => (
                                <div key={index} className='relative border-2 border-gray-300 rounded-lg p-2 h-40'>
                                    <img
                                        src={card.preview}
                                        alt={`ID Card Preview ${index + 1}`}
                                        className='w-full h-full object-contain'
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveImage(index)}
                                        className='absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 text-xs'
                                    >
                                        ×
                                    </button>
                                    {card.uploaded && (
                                        <div className='absolute bottom-1 left-1 bg-green-500 text-white text-xs px-2 py-1 rounded'>
                                            Uploaded
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Upload Area */}
                        <label className='w-full border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50'>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImageChange}
                                className='hidden'
                                accept="image/*"
                                multiple
                            />
                            <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className='text-gray-600'>Click to upload ID cards</span>
                            <span className='text-sm text-gray-400 mt-1'>JPEG, PNG (Max 5MB each)</span>
                            <span className='text-sm text-gray-500 mt-2'>
                                {formData.studentIdCards.length} of 4 images selected
                            </span>
                        </label>
                        {errors.studentIdCards && (
                            <p className="text-red-500 text-sm mt-2">{errors.studentIdCards}</p>
                        )}
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className='bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-10 text-lg tinos-regular transition-colors  w-full mb-4 disabled:opacity-50'
                        disabled={formData.isSubmitting}
                    >
                        {formData.isSubmitting ? 'Uploading...' : 'Register'}
                    </button>

                    {formData.uploadProgress > 0 && formData.uploadProgress < 100 && (
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                            <div
                                className="bg-blue-600 h-2.5 rounded-full"
                                style={{ width: `${formData.uploadProgress}%` }}
                            ></div>
                        </div>
                    )}

                    <div className='tinos-regular text-center'>
                        <p>Already have an account? <NavLink to="/login" className="text-blue-600 hover:underline">Sign in</NavLink></p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminRegistration;