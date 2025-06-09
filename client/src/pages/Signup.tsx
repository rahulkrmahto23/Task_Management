import React, { useState, ChangeEvent, FormEvent } from 'react';
import { Container, Form, Button, InputGroup, Spinner, FormSelect } from 'react-bootstrap';
import { FaUser, FaEnvelope, FaLock, FaUserTag } from 'react-icons/fa';
import { signupUser } from '../helpers/user-api';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  designation: string;
  role: string;
}

const SignupPage: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    designation: '',
    role: 'employee',
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    // Password match validation
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Password should be at least 6 characters");
      setIsLoading(false);
      return;
    }

    try {
      const { name, email, password, designation, role } = formData;
      const response = await signupUser(name, email, password, designation, role);

      if (response.success) {
        toast.success(response.message || "Signup successful!");

        localStorage.setItem("user", JSON.stringify({
          id: response.user.id,
          name: response.user.name,
          email: response.user.email,
          role: response.user.role,
          designation: response.user.designation,
        }));

        setTimeout(() => {
          navigate(role === 'admin' ? '/admin' : '/dashboard');
        }, 1500);
      }
    } catch (err: any) {
      toast.error(err.message || "Signup failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const backgroundStyle: React.CSSProperties = {
    minHeight: '90vh',
    backgroundImage: 'url("/background.jpg")',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const formBoxStyle: React.CSSProperties = {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: '40px',
    borderRadius: '10px',
    boxShadow: '0px 0px 10px rgba(0,0,0,0.3)',
    maxWidth: '500px',
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
        <h4 className="mb-4">SIGN UP</h4>

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3" controlId="signupUsername">
            <InputGroup>
              <InputGroup.Text><FaUser /></InputGroup.Text>
              <Form.Control
                type="text"
                placeholder="Full Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                minLength={3}
              />
            </InputGroup>
          </Form.Group>

          <Form.Group className="mb-3" controlId="signupEmail">
            <InputGroup>
              <InputGroup.Text><FaEnvelope /></InputGroup.Text>
              <Form.Control
                type="email"
                placeholder="Email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </InputGroup>
          </Form.Group>

          <Form.Group className="mb-3" controlId="signupDesignation">
            <InputGroup>
              <InputGroup.Text><FaUserTag /></InputGroup.Text>
              <Form.Control
                type="text"
                placeholder="Designation"
                name="designation"
                value={formData.designation}
                onChange={handleChange}
                required
              />
            </InputGroup>
          </Form.Group>

          <Form.Group className="mb-3" controlId="signupRole">
            <InputGroup>
              <InputGroup.Text><FaUserTag /></InputGroup.Text>
              <FormSelect
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
              >
                <option value="employee">Employee</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </FormSelect>
            </InputGroup>
          </Form.Group>

          <Form.Group className="mb-3" controlId="signupPassword">
            <InputGroup>
              <InputGroup.Text><FaLock /></InputGroup.Text>
              <Form.Control
                type="password"
                placeholder="Password (min 6 characters)"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
              />
            </InputGroup>
          </Form.Group>

          <Form.Group className="mb-4" controlId="signupConfirmPassword">
            <InputGroup>
              <InputGroup.Text><FaLock /></InputGroup.Text>
              <Form.Control
                type="password"
                placeholder="Confirm Password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                minLength={6}
              />
            </InputGroup>
          </Form.Group>

          <Button 
            variant="primary" 
            type="submit" 
            className="w-100 mb-3"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                />
                <span className="ms-2">Signing Up...</span>
              </>
            ) : (
              'Sign Up'
            )}
          </Button>

          <div style={{ fontSize: '0.9rem' }}>
            Already have an account? <a href="/login">Login</a>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default SignupPage;