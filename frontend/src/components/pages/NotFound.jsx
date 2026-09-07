import React from "react";
import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <main>
      <h1>404</h1>
      <h2>Page Not Found</h2>
      <p>Sorry, the page you're looking for doesn't exist.</p>

      <Link to="/login">Go to Login</Link>
    </main>
  );
};

export default NotFound;
