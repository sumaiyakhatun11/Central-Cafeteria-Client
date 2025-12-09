import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import Root from './Components/Root/Root.jsx';
import Login from './Components/Authentication/Login.jsx';
import Registration from './Components/Authentication/Registration.jsx';
import Home from './Components/Home/Home.jsx';
import Breakfast from './Components/Home/Breakfast.jsx';
import Lunch from './Components/Home/Lunch.jsx';
import Dinner from './Components/Home/Dinner.jsx';
import Snacks from './Components/Home/Snacks.jsx';
import AuthProvider from './Components/Authentication/AuthProvider.jsx';
import Queue from './Components/Queue/Queue.jsx';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Root />,
    children: [
      {
        path: '/',
        element: <Home />,
        children: [
          {
            index: true,
            element: <Breakfast />,
            loader: async () => {
              const res = await fetch("https://central-cafetaria-server.vercel.app/foods");
              const allFood = await res.json();
              const breakfastItems = allFood.filter(item =>
                item.category.includes("breakfast")
              );
              return { breakfastItems };
            },
          },
          {
            path: 'breakfast',
            element: <Breakfast />,
            loader: async () => {
              const res = await fetch("https://central-cafetaria-server.vercel.app/foods");
              const allFood = await res.json();
              const breakfastItems = allFood.filter(item =>
                item.category.includes("breakfast")
              );
              return { breakfastItems };
            },
          },
          {
            path: 'lunch',
            element: <Lunch />,
            loader: async () => {
              const res = await fetch("https://central-cafetaria-server.vercel.app/foods");
              const allFood = await res.json();
              const lunchItems = allFood.filter(item =>
                item.category.includes("lunch")
              );
              return { lunchItems };
            },
          },
          {
            path: 'dinner',
            element: <Dinner />,
            loader: async () => {
              const res = await fetch("https://central-cafetaria-server.vercel.app/foods");
              const allFood = await res.json();
              const dinnerItems = allFood.filter(item =>
                item.category.includes("dinner")
              );
              return { dinnerItems };
            },
          },
          {
            path: 'snacks',
            element: <Snacks />,
            loader: async () => {
              const res = await fetch("https://central-cafetaria-server.vercel.app/foods");
              const allFood = await res.json();
              const snacksItems = allFood.filter(item =>
                item.category.includes("snacks")
              );
              return { snacksItems };
            },
          },
        ],
      },
      {
        path: '/queue',
        element: <Queue />,
      },
      {
        path: '/login',
        element: <Login />,
      },
      {
        path: '/reg',
        element: <Registration />,
      },
    ],
  },
]);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />

    </AuthProvider>
  </StrictMode>,
)
