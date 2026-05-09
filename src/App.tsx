import { Navigate, RouterProvider, createBrowserRouter } from 'react-router-dom';
import Layout from './components/Layout';
import CategoryPage from './pages/CategoryPage';
import DashboardPage from './pages/DashboardPage';
import DataLabPage from './pages/DataLabPage';
import ToolPage from './pages/ToolPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: 'data',
        element: <DataLabPage />,
      },
      {
        path: ':category',
        element: <CategoryPage />,
      },
      {
        path: ':category/:slug',
        element: <ToolPage />,
      },
      {
        path: '*',
        element: <Navigate replace to="/" />,
      },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}