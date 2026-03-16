import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import Layout from "./components/Layout";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Customers from "./pages/Customers";
import Dashboard from "./pages/Dashboard";
import Factory from "./pages/Factory";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import Purchases from "./pages/Purchases";
import Returns from "./pages/Returns";
import Sales from "./pages/Sales";
import StockView from "./pages/StockView";

function RootComponent() {
  const { currentUser } = useAuth();
  if (!currentUser) return <Login />;
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

const rootRoute = createRootRoute({
  component: RootComponent,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Dashboard,
});

const salesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/sales",
  component: Sales,
});

const purchasesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/purchases",
  component: Purchases,
});

const returnsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/returns",
  component: Returns,
});

const stockRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/stock",
  component: StockView,
});

const customersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/customers",
  component: Customers,
});

const factoryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/factory",
  component: Factory,
});

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile",
  component: Profile,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  salesRoute,
  purchasesRoute,
  returnsRoute,
  stockRoute,
  customersRoute,
  factoryRoute,
  profileRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
