import React from 'react';
import { useLoaderData } from 'react-router-dom';
import FoodCategory from './FoodCategory';

const Lunch = () => {
    const { lunchItems } = useLoaderData();
    return <FoodCategory title="Lunch Menu" items={lunchItems} />;
};

export default Lunch;
