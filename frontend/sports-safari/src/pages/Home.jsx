import { useNavigate } from "react-router-dom";
import "../styles/Home.css";

const sports = [
  { name: "Cricket", image: "/Cricket.jpg" },
  { name: "Football", image: "/Football.jpg" },
  { name: "Tennis", image: "/Tennis.jpg" },
  { name: "Golf", image: "/Golf.jpg" },
  { name: "Out Skating", image: "/OutSkating.jpg" },
];

const Home = () => {
  const navigate = useNavigate();

  const handleClick = (sport) => {
    navigate(`/grounds/sport/${sport}`);
  };

  return (
    <div className="home-root">
      {/* Full-screen Image Banner with Top-Left Text */}
      <div className="hero-banner">
        <h1 className="banner-heading">
          Book with<br />Confidence<br />Play with Joy!!
        </h1>
      </div>

      {/* Sports Cards in Single Row */}
      <div className="sports-container">
        <h2 className="section-title">Choose a Sport to Book</h2>
        <div className="horizontal-scroll">
          {sports.map((sport) => (
            <div
              key={sport.name}
              className="sport-card"
              onClick={() => handleClick(sport.name.toLowerCase())}
            >
              <img src={sport.image} alt={sport.name} className="sport-image" />
              <div className="sport-label">{sport.name}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;
