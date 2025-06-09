import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Container, Form, Button, InputGroup, Spinner } from 'react-bootstrap';
import { FaUser, FaLock } from 'react-icons/fa';
import { loginUser } from '../helpers/user-api'; 
import toast, { Toaster } from 'react-hot-toast';

const LoginPage = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await loginUser(email, password);
      if (response.success) {
        toast.success(response.message || 'Login successful! Redirecting...');

        const storage = keepLoggedIn ? localStorage : sessionStorage;
        storage.setItem('user', JSON.stringify({
          id: response.user.id,
          name: response.user.name,
          email: response.user.email,
          role: response.user.role,
          designation: response.user.designation
        }));

        setTimeout(() => {
      
          if (response.user.role === 'admin') {
            navigate('/admin'); 
          } else if (response.user.role === 'employee') {
            navigate('/employee'); 
          } else {
            
            navigate('/');
          }
        }, 1500);
      }
    } catch (err: any) {
      toast.error(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const backgroundStyle = {
    minHeight: '90vh',
    backgroundImage: 'url("/background.jpg")',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const formBoxStyle = {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: '40px',
    borderRadius: '10px',
    boxShadow: '0px 0px 10px rgba(0,0,0,0.3)',
    maxWidth: '400px',
    width: '100%',
    textAlign: 'center',
  };

  return (
    <div style={backgroundStyle}>
      <Toaster position="top-center" reverseOrder={false} />
      <div style={formBoxStyle}>
        <div style={{ fontSize: '40px', color: '#0d6efd', marginBottom: '10px' }}>
          <FaUser />
        </div>
        <h4 className="mb-4">LOGIN</h4>

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3" controlId="formEmail">
            <InputGroup>
              <InputGroup.Text><FaUser /></InputGroup.Text>
              <Form.Control
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </InputGroup>
          </Form.Group>

          <Form.Group className="mb-3" controlId="formPassword">
            <InputGroup>
              <InputGroup.Text><FaLock /></InputGroup.Text>
              <Form.Control
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </InputGroup>
          </Form.Group>

          <div className="d-flex justify-content-between align-items-center mb-3">
            <Form.Check
              type="checkbox"
              label="Keep me logged in"
              checked={keepLoggedIn}
              onChange={(e) => setKeepLoggedIn(e.target.checked)}
            />
            <Link to="/forgot-password" style={{ fontSize: '0.9rem' }}>Forgot Password?</Link>
          </div>

          <Button variant="primary" type="submit" className="w-100 mb-3" disabled={isLoading}>
            {isLoading ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                />
                <span className="ms-2">Logging in...</span>
              </>
            ) : (
              'Login'
            )}
          </Button>

          <div style={{ fontSize: '0.9rem' }}>
            Don't have an account? <Link to="/signup">Sign Up</Link>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default LoginPage;