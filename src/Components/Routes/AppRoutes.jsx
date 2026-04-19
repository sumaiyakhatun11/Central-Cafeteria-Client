import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Root from '../Root/Root.jsx';
import Login from '../Authentication/Login.jsx';
import Registration from '../Authentication/Registration.jsx';
import Home from '../Home/Home.jsx';
import CategoryMenu from '../Home/CategoryMenu.jsx';
import Queue from '../Queue/Queue.jsx';

// Admin Imports
import AdminRegistration from '../Admin/Authentication/AdminRegistration.jsx';
import AdminPrivateRoute from '../Admin/Authentication/AdminPrivateRoute.jsx';
import Users from '../Admin/Accounts/Users.jsx';
import CoinRequests from '../Admin/Accounts/CoinRequests.jsx';
import EventRecords from '../Admin/Events/EventRecords.jsx';
import Events from '../Admin/Events/Events.jsx';
import ManageFoodPackages from '../Admin/Events/ManageFoodPackages.jsx';
import ManageFood from '../Admin/FoodManagement/ManageFood.jsx';
import AdminHome from '../Admin/Home/Home.jsx';
import AdminBreakfast from '../Admin/Home/Breakfast.jsx';
import AdminDinner from '../Admin/Home/Dinner.jsx';
import AdminLunch from '../Admin/Home/Lunch.jsx';
import AdminSnacks from '../Admin/Home/Snacks.jsx';
import AdminQueue from '../Admin/Queue/Queue.jsx';
import SalesReport from '../Admin/SalesReport/SalesReport.jsx';
import Accounts from '../Admin/Accounts/Accounts.jsx';

const CATEGORY_CONFIG = {
  breakfast: { title: 'Breakfast Menu' },
  lunch: { title: 'Lunch Menu' },
  dinner: { title: 'Dinner Menu' },
  snacks: { title: 'Snacks Menu' },
};

const loadCategoryItems = async (category = 'breakfast') => {
  const normalizedCategory = String(category || 'breakfast').toLowerCase();
  const res = await fetch('https://central-cafetaria-server.vercel.app/foods');
  const allFood = await res.json();
  const items = allFood.filter((item) => {
    const categoryValue = item?.category;

    if (Array.isArray(categoryValue)) {
      return categoryValue.some((value) =>
        String(value || '').toLowerCase().includes(normalizedCategory)
      );
    }

    return String(categoryValue || '').toLowerCase().includes(normalizedCategory);
  });

  return {
    category: normalizedCategory,
    title: CATEGORY_CONFIG[normalizedCategory]?.title || 'Menu',
    items,
  };
};

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
            element: <CategoryMenu />,
            loader: async () => loadCategoryItems('breakfast'),
          },
          {
            path: ':category',
            element: <CategoryMenu />,
            loader: async ({ params }) => {
              const category = String(params.category || '').toLowerCase();

              if (!CATEGORY_CONFIG[category]) {
                return { category, title: 'Menu', items: [] };
              }

              return loadCategoryItems(category);
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
      {
        path: '/admin-register',
        element: <AdminRegistration />,
      },
      {
        path: '/admin',
        element: <AdminPrivateRoute />,
        children: [
          {
            index: true,
            element: <AdminHome />,
          },
          {
            path: 'accounts',
            element: <Accounts />,
          },
          {
            path: 'accounts/users',
            element: <Users />,
          },
          {
            path: 'accounts/coin-requests',
            element: <CoinRequests />,
          },
          {
            path: 'events',
            element: <Events />,
            children: [
              { index: true, element: <EventRecords /> },
              { path: 'current', element: <EventRecords /> },
              { path: 'past', element: <EventRecords /> },
              { path: 'manage-packages', element: <ManageFoodPackages /> }
            ]
          },
          {
            path: 'food-management',
            element: <ManageFood />,
          },
          {
            path: 'sales',
            element: <SalesReport />,
          },
          {
            path: 'queue',
            element: <AdminQueue />,
          },
          {
            path: 'home',
            element: <AdminHome />,
            children: [
              {
                index: true,
                element: <AdminBreakfast />,
              },
              {
                path: 'breakfast',
                element: <AdminBreakfast />,
              },
              {
                path: 'lunch',
                element: <AdminLunch />,
              },
              {
                path: 'dinner',
                element: <AdminDinner />,
              },
              {
                path: 'snacks',
                element: <AdminSnacks />,
              },
            ],
          },
        ],
      },
    ],
  },
]);

const AppRoutes = () => {
  return <RouterProvider router={router} />;
};

export default AppRoutes;
