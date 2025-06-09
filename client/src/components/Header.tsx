import React, { useEffect, useState } from "react";
import { Container, Row, Col, Image, Button } from "react-bootstrap";
import { useNavigate, useLocation } from "react-router-dom";
import logo from "../assets/logo.jpg";
import { logoutUser, verifyUser } from "../helpers/user-api";
import toast from "react-hot-toast";

interface User {
  name: string;
  email?: string;
  role?: string;
  [key: string]: any;
}

const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const headerStyle: React.CSSProperties = {
    background: "linear-gradient(to right, #0f1d4c, #002366)",
    color: "white",
    padding: "7px",
  };

  const buttonStyle: React.CSSProperties = {
    marginLeft: "10px",
    padding: "5px 10px",
    fontSize: "14px",
  };

  const isHomePage = location.pathname === "/";
  const isAuthPage =
    location.pathname === "/login" || location.pathname === "/signup";

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { user } = await verifyUser();
        setCurrentUser(user);
      } catch (error) {
        setCurrentUser(null);
      }
    };

    if (!isAuthPage && !isHomePage) {
      checkAuth();
    }
  }, [location.pathname, isAuthPage, isHomePage]);

  const handleLogout = async () => {
    try {
      const response = await logoutUser();
      setCurrentUser(null);
      navigate("/");
      toast.success(response.message || "Logged out successfully");
    } catch (error: any) {
      console.error("Logout failed:", error.message || error);
      toast.error(error.message || "Logout failed. Please try again.");
    }
  };

  return (
    <div style={headerStyle}>
      <Container fluid>
        <Row className="align-items-center">
          <Col md={6} className="d-flex align-items-center">
            <Image src={logo} alt="SAIL Logo" height={60} className="me-3" />
            <div>
              <div className="fw-bold" style={{ fontSize: 16 }}>
                आकाश प्रौद्योगिकी लिमिटेड
              </div>
              <div className="fw-bold" style={{ fontSize: 16 }}>
                Aakash Technologies Ltd.
              </div>
              <div style={{ fontSize: 14 }}>नवाचार INNOVATION</div>
            </div>
          </Col>

          <Col md={6} className="text-end">
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  marginLeft: 15,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {currentUser && (
                  <span style={{ marginRight: 10 }}>
                    Welcome, {currentUser.name}
                  </span>
                )}

                {isHomePage && (
                  <>
                    <Button
                      variant="outline-light"
                      style={buttonStyle}
                      onClick={() => navigate("/login")}
                    >
                      Login
                    </Button>
                    <Button
                      variant="light"
                      style={buttonStyle}
                      onClick={() => navigate("/signup")}
                    >
                      Signup
                    </Button>
                  </>
                )}

                {!isAuthPage && !isHomePage && (
                  <Button
                    variant="outline-light"
                    style={buttonStyle}
                    onClick={handleLogout}
                  >
                    Logout
                  </Button>
                )}
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Header;
