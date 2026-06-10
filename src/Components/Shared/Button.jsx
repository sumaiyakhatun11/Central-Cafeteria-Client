import React from 'react';

/**
 * A reusable Button component to standardize actions across the application.
 *
 * @param {Object} props
 * @param {string} [props.variant='primary'] - Button variant: 'primary', 'secondary', 'success', 'danger', 'warning', 'ghost', 'outline', 'info', 'link'
 * @param {string} [props.size='md'] - Button size: 'xs', 'sm', 'md', 'lg'
 * @param {boolean} [props.isLoading=false] - Whether the button is in a loading state
 * @param {boolean} [props.disabled=false] - Whether the button is disabled
 * @param {string} [props.type='button'] - Button type: 'button', 'submit', 'reset'
 * @param {string} [props.className=''] - Additional CSS classes
 * @param {boolean} [props.fullWidth=false] - Whether the button should fill its container
 * @param {React.ReactNode} props.children - Button content
 * @param {Function} [props.onClick] - Click handler
 */
const Button = ({
    variant = 'primary',
    size = 'md',
    isLoading = false,
    disabled = false,
    type = 'button',
    className = '',
    fullWidth = false,
    children,
    onClick,
    ...rest
}) => {
    const baseClasses = 'btn inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed';

    const variantClasses = {
        primary: 'bg-red-600 hover:bg-red-700 text-white border-none',
        secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800 border-none',
        success: 'bg-green-600 hover:bg-green-700 text-white border-none',
        danger: 'bg-red-600 hover:bg-red-700 text-white border-none',
        warning: 'bg-yellow-500 hover:bg-yellow-600 text-white border-none',
        info: 'bg-blue-400 hover:bg-blue-500 text-white border-none',
        ghost: 'btn-ghost hover:bg-gray-100 text-gray-800 border-none',
        outline: 'btn-outline border-2 border-red-600 text-red-600 hover:bg-red-600 hover:text-white',
        accent: 'btn-accent',
        link: 'bg-transparent text-red-600 hover:text-red-700 border-none underline-offset-4 hover:underline'
    };

    const sizeClasses = {
        xs: 'btn-xs px-2 h-8',
        sm: 'btn-sm px-3 h-9',
        md: 'px-5 h-11',
        lg: 'btn-lg px-8 h-14'
    };

    const combinedClasses = [
        baseClasses,
        variantClasses[variant] || variantClasses.primary,
        sizeClasses[size] || sizeClasses.md,
        fullWidth ? 'w-full' : '',
        className
    ].filter(Boolean).join(' ');

    return (
        <button
            type={type}
            className={combinedClasses}
            disabled={disabled || isLoading}
            onClick={onClick}
            {...rest}
        >
            {isLoading && <span className="loading loading-spinner loading-sm"></span>}
            {children}
        </button>
    );
};

export default Button;
