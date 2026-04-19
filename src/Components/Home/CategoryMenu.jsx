import React, { useEffect } from 'react';
import { useLoaderData, useParams, Link } from 'react-router-dom';
import FoodCategory from './FoodCategory';

const CATEGORY_LABELS = {
    breakfast: 'Breakfast Menu',
    lunch: 'Lunch Menu',
    dinner: 'Dinner Menu',
    snacks: 'Snacks Menu',
};

const CategoryMenu = () => {
    const { category } = useParams();
    const { items = [], title = 'Menu' } = useLoaderData() || {};

    useEffect(() => {
        const previousTitle = document.title;
        const previousDescription = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
        const description = `Browse ${title.toLowerCase()} at Central Cafetaria.`;

        document.title = `${title} | Central Cafetaria`;

        let descriptionTag = document.querySelector('meta[name="description"]');
        if (!descriptionTag) {
            descriptionTag = document.createElement('meta');
            descriptionTag.setAttribute('name', 'description');
            document.head.appendChild(descriptionTag);
        }
        descriptionTag.setAttribute('content', description);

        return () => {
            document.title = previousTitle;

            if (!previousDescription) {
                descriptionTag?.remove();
                return;
            }

            descriptionTag?.setAttribute('content', previousDescription);
        };
    }, [title]);

    if (!items.length) {
        return (
            <div className="container mx-auto px-4 py-8 text-center">
                <h2 className="text-3xl font-bold mb-4">{CATEGORY_LABELS[category] || title}</h2>
                <p className="text-gray-700 mb-6">No items found for this category.</p>
                <Link to="/" className="inline-flex items-center justify-center rounded bg-red-600 px-5 py-2 text-white hover:bg-red-700">
                    Back to home
                </Link>
            </div>
        );
    }

    return <FoodCategory title={title} items={items} />;
};

export default CategoryMenu;