import { createRouter, createRoute, createRootRoute, RouterProvider, Outlet } from '@tanstack/react-router';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Sales from './pages/Sales';
import Purchases from './pages/Purchases';
import Returns from './pages/Returns';
import StockView from './pages/StockView';
import Customers from './pages/Customers';
import Factory from './pages/Factory';

const rootRoute = createRootRoute({
  component: () => (
    <Layout>
      <Outlet />
    </Layout>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: Dashboard,
});

const salesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/sales',
  component: Sales,
});

const purchasesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/purchases',
  component: Purchases,
});

const returnsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/returns',
  component: Returns,
});

const stockRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/stock',
  component: StockView,
});

const customersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/customers',
  component: Customers,
});

const factoryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/factory',
  component: Factory,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  salesRoute,
  purchasesRoute,
  returnsRoute,
  stockRoute,
  customersRoute,
  factoryRoute,
]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
