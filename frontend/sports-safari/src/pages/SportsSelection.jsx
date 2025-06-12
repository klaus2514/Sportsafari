import React from 'react';
import { Link } from 'react-router-dom';

const SportSelection = () => {
  const sports = ['Football', 'Basketball', 'Tennis', 'Cricket']; // List of sports

  return (
    <div>
      <h1>Select a Sport</h1>
      <div>
        {sports.map((sport) => (
          <Link key={sport} to={`/grounds/${sport.toLowerCase()}`}>
            <button>{sport}</button>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default SportSelection;
