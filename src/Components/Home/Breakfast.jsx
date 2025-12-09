import React from 'react';
import { useLoaderData } from 'react-router-dom';
import FoodCategory from './FoodCategory';

const Breakfast = () => {
    const { breakfastItems } = useLoaderData();
    return <FoodCategory title="Breakfast Menu" items={breakfastItems} />;
};

export default Breakfast;
