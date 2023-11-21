import { useState } from 'react';
import {
  createHashRouter as createBrowserRouter,
  RouterProvider
} from 'react-router-dom';
import './App.css';
import HomePage from '@/pages/homePage';
import { Toaster } from 'react-hot-toast';

import HistoryPage from '@/pages/historyPage';
import DrawingPage from '@/pages/drawingPage';
import ConfigurationPage from '@/pages/configurationPage';

function App() {
  const router = createBrowserRouter([
    {
      path: '/',
      element: <HomePage />
    },
    {
      path: '/history',
      element: <HistoryPage />
    },
    { path: '/drawing', element: <DrawingPage /> },
    { path: '/configuration', element: <ConfigurationPage /> }
  ]);

  return (
    <>
      <Toaster />
      <RouterProvider router={router} />
    </>
  );
}

export default App;
