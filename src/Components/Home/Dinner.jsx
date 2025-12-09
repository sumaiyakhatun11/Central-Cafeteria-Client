import React from 'react';
import { useLoaderData } from 'react-router-dom';
import FoodCategory from './FoodCategory';

const Dinner = () => {
    const { dinnerItems } = useLoaderData();
    return <FoodCategory title="Dinner Menu" items={dinnerItems} />;
};

export default Dinner;
