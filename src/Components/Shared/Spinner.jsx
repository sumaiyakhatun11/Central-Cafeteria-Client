import React from 'react';

const Spinner = ({ size = 'w-16 h-16' }) => {
    return (
        <div className="flex justify-center items-center">
            <div className={`${size} border-4 border-dashed rounded-full animate-spin border-red-600`}></div>
        </div>
    );
};

export default Spinner;