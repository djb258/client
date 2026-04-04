/*
 * CTB Metadata
 * ctb_id: CTB-A26EE7016E6A
 * ctb_branch: ui
 * ctb_path: ui/pages/barton-pages/NotFound.tsx
 * ctb_version: 1.0.0
 * created: 2025-10-23T16:37:01.863050
 * checksum: ae75445e
 */

import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-4">Oops! Page not found</p>
        <a href="/" className="text-blue-500 hover:text-blue-700 underline">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
