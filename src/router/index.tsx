import { createBrowserRouter } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { HealthPage } from '../pages/HealthPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { APP_ROUTES } from '../constants/routes';

export const router = createBrowserRouter([
  {
    path: APP_ROUTES.ROOT,
    element: <AppShell />,
    children: [
      { index: true, element: <HealthPage /> },
      { path: APP_ROUTES.DASHBOARD, element: <HealthPage /> },
      { path: APP_ROUTES.NOT_FOUND, element: <NotFoundPage /> },
    ],
  },
]);
