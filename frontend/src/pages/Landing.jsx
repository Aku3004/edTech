import React from "react";
import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <>
      <div className="absolute top-4 right-24">
        <Link className="font-semibold" to="/signup">
          Signup
        </Link>
      </div>
      <div className="absolute top-4 right-10">
        <Link className="font-semibold" to="/login">
          login
        </Link>
      </div>
      <div className="font-semibold text-2xl">Landing</div>
    </>
  );
}
