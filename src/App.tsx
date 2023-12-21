import { useState } from 'react';
import {
  createHashRouter as createBrowserRouter,
  RouterProvider
} from 'react-router-dom';
import './App.css';
import HomePage from '@/pages/homePage';
import { Toaster } from 'react-hot-toast';

import HistoryPage from '@/pages/historyPage';
import IntroductionPage from '@/pages/draw/introductionPage';
import DrawingPage from '@/pages/draw/drawingPage';
import ConfigurationPage from '@/pages/configurationPage';
import StoryConfigPage from './pages/draw/storyConfigPage';

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
    {
      path: '/drawing',
      element: <IntroductionPage />
    },
    { path: '/drawing/story/:id', element: <DrawingPage /> },
    { path: '/drawing/config', element: <StoryConfigPage /> },
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
