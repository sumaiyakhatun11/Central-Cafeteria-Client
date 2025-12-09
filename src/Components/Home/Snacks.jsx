import React from 'react';
import { useLoaderData } from 'react-router-dom';
import FoodCategory from './FoodCategory';

const Snacks = () => {
    const { snacksItems } = useLoaderData();
    return <FoodCategory title="Snacks Menu" items={snacksItems} />;
};

export default Snacks;
