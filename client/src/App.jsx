import React, { useEffect, useState } from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';

import api from './api';

import Shop from './pages/Shop.jsx';
import Admin from './pages/Admin.jsx';
import ProductDetails from './pages/ProductDetails.jsx';
import Wishlist from './pages/Wishlist.jsx';

export default function App() {
  const [settings, setSettings] = useState({
    storeName: 'Sanvi Collection',
    tagline: 'Handpicked fashion for you'
  });

  const [wishlistCount, setWishlistCount] = useState(0);

  async function refreshSettings() {
    try {
      const res = await api.get('/settings');
      setSettings(res.data);
    } catch (err) {
      // Keep defaults.
    }
  }

  function refreshWishlistCount() {
    try {
      const saved = JSON.parse(
        localStorage.getItem('sanvi_wishlist') || '[]'
      );

      setWishlistCount(
        Array.isArray(saved) ? saved.length : 0
      );
    } catch {
      setWishlistCount(0);
    }
  }

  useEffect(() => {
    refreshSettings();
    refreshWishlistCount();

    const handleWishlistChange = () => {
      refreshWishlistCount();
    };

    window.addEventListener(
      'wishlistChanged',
      handleWishlistChange
    );

    window.addEventListener(
      'storage',
      handleWishlistChange
    );

    return () => {
      window.removeEventListener(
        'wishlistChanged',
        handleWishlistChange
      );

      window.removeEventListener(
        'storage',
        handleWishlistChange
      );
    };
  }, []);

  return (
    <>
      <header className="site">

        {/* BRAND */}

        <NavLink
          to="/"
          className="brand"
          style={{
            textDecoration: 'none',
            color: 'inherit'
          }}
        >
          <div className="brand-mark">
            SC
          </div>

          <div>
            <div className="name display">
              {settings.storeName}
            </div>

            <div className="tagline">
              {settings.tagline}
            </div>
          </div>
        </NavLink>


        {/* NAVIGATION */}

        <nav className="tabs">

          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              isActive ? 'active' : ''
            }
          >
            Shop
          </NavLink>


          {/* WISHLIST */}

          <NavLink
            to="/wishlist"
            className={({ isActive }) =>
              isActive
                ? 'active wishlist-nav'
                : 'wishlist-nav'
            }
          >
            <span className="wishlist-nav-heart">
              ♥
            </span>

            <span>
              Wishlist
            </span>

            {wishlistCount > 0 && (
              <span className="wishlist-count">
                {wishlistCount}
              </span>
            )}
          </NavLink>


          {/* ADMIN */}

          <NavLink
            to="/admin"
            className={({ isActive }) =>
              isActive ? 'active' : ''
            }
          >
            Admin
          </NavLink>

        </nav>

      </header>


      <Routes>

        {/* SHOP */}

        <Route
          path="/"
          element={
            <Shop
              settings={settings}
            />
          }
        />


        {/* PRODUCT */}

        <Route
          path="/product/:id"
          element={
            <ProductDetails
              settings={settings}
            />
          }
        />


        {/* WISHLIST */}

        <Route
          path="/wishlist"
          element={
            <Wishlist
              settings={settings}
            />
          }
        />


        {/* ADMIN */}

        <Route
          path="/admin"
          element={
            <Admin
              settings={settings}
              onSettingsSaved={
                refreshSettings
              }
            />
          }
        />

      </Routes>
    </>
  );
}