import React from "react";
import { Link } from "react-router-dom";

export default function Login() {
  return (
    <>
      <div className="absolute top-4 left-4">
        <Link className="font-medium" to="/">
          Back
        </Link>
      </div>
      <div className="font-semibold text-2xl">
        <h1>Login Page</h1>
      </div>
    </>
  );
}
