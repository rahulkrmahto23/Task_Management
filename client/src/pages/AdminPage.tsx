import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Badge,
  Card,
  Form,
  Modal,
  Spinner,
  Alert,
  InputGroup,
  Pagination,
  Row,
  Col,
  Dropdown,
  ButtonGroup
} from "react-bootstrap";
import { 
  FiEdit2, 
  FiTrash2, 
  FiUserPlus,
  FiFilter,
  FiSearch,
  FiRefreshCw,
  FiEye,
  FiCheck,
  FiX,
  FiList,
  FiFolder,
  FiUsers
} from "react-icons/fi";
import { 
  getAllUsers, 
  deleteUser, 
  editUser,
  signupUser
} from "../helpers/user-api";
import toast, { Toaster } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const getRoleBadge = (role) => {
  const variant = {
    'ADMIN': 'danger',
    'MANAGER': 'warning',
    'CLIENT': 'primary',
    'REVIEWER': 'info'
  }[role] || 'secondary';
  
  return <Badge bg={variant} className="text-uppercase">{role.toLowerCase()}</Badge>;
};

const AdminPage = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    name: '',
    email: '',
    designation: '',
    role: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    designation: '',
    role: 'employee'
  });
  const [formErrors, setFormErrors] = useState({});

  const navigate = useNavigate();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await getAllUsers();
      setUsers(response);
      setFilteredUsers(response);
    } catch (err) {
      setError(err.message || "Failed to fetch users");
      toast.error(err.message || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    let results = [...users];
    
    // Apply filters
    if (filters.name) {
      results = results.filter(u => 
        u.name.toLowerCase().includes(filters.name.toLowerCase())
      );
    }
    if (filters.email) {
      results = results.filter(u => 
        u.email.toLowerCase().includes(filters.email.toLowerCase())
      );
    }
    if (filters.designation) {
      results = results.filter(u => 
        u.designation.toLowerCase().includes(filters.designation.toLowerCase())
      );
    }
    if (filters.role) {
      results = results.filter(u => u.role === filters.role);
    }
    
    // Apply sorting
    if (sortConfig.key) {
      results.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    
    setFilteredUsers(results);
    setCurrentPage(1);
  }, [users, filters, sortConfig]);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({
      name: '',
      email: '',
      designation: '',
      role: ''
    });
    setSortConfig({ key: 'name', direction: 'asc' });
  };

  const handleAddClick = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      designation: '',
      role: 'employee'
    });
    setFormErrors({});
    setShowAddModal(true);
  };

  const handleEditClick = (user) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '', 
      designation: user.designation,
      role: user.role
    });
    setFormErrors({});
    setShowEditModal(true);
  };

  const handleDeleteClick = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleModalClose = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
    setSelectedUser(null);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when field is changed
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    let isValid = true;
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
      isValid = false;
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
      isValid = false;
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      errors.email = 'Email is invalid';
      isValid = false;
    }
    
    if (showAddModal && !formData.password) {
      errors.password = 'Password is required';
      isValid = false;
    } else if (showAddModal && formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
      isValid = false;
    }
    
    if (!formData.designation.trim()) {
      errors.designation = 'Designation is required';
      isValid = false;
    }
    
    setFormErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setActionLoading('submitting');
      
      if (showAddModal) {
        // Create new user
        await signupUser(
          formData.name,
          formData.email,
          formData.password,
          formData.designation,
          formData.role
        );
        toast.success("User created successfully!");
      } else {
        // Update existing user
        await editUser(selectedUser._id, {
          name: formData.name,
          email: formData.email,
          designation: formData.designation,
          role: formData.role
        });
        toast.success("User updated successfully!");
      }
      
      await fetchUsers();
      handleModalClose();
    } catch (err) {
      toast.error(err.message || "Failed to save user");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    try {
      setActionLoading('deleting');
      await deleteUser(selectedUser._id);
      await fetchUsers();
      toast.success("User deleted successfully!");
      handleModalClose();
    } catch (err) {
      toast.error(err.message || "Failed to delete user");
    } finally {
      setActionLoading(null);
    }
  };

  // Navigation handlers
  const navigateToTasks = () => navigate("/task");
  const navigateToProjects = () => navigate("/project");
  const navigateToTeams = () => navigate("/team");

  // Pagination logic
  const indexOfLastUser = currentPage * perPage;
  const indexOfFirstUser = indexOfLastUser - perPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / perPage);

  const roleOptions = [
    { value: 'admin', label: 'Admin' },
    { value: 'manager', label: 'Manager' },
    { value: 'employee', label: 'Client' }
  ];

  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" role="status" />
        <p className="mt-2">Loading users...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger" className="text-center my-5">
        {error}
      </Alert>
    );
  }

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
      <Card className="shadow-sm p-4 bg-light border-0">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3>User Management</h3>
          <div className="d-flex align-items-center gap-2">
            <ButtonGroup>
              <Button 
                variant={showFilters ? "primary" : "outline-secondary"} 
                onClick={() => setShowFilters(!showFilters)}
              >
                <FiFilter className="me-2" /> Filters
              </Button>
              <Button variant="outline-secondary" onClick={clearFilters}>
                <FiRefreshCw /> Reset
              </Button>
              <Button variant="primary" onClick={handleAddClick}>
                <FiUserPlus className="me-2" /> Add User
              </Button>
            </ButtonGroup>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="mb-4">
          <ButtonGroup>
            <Button variant="outline-primary" onClick={navigateToTasks}>
              <FiList className="me-2" /> Tasks
            </Button>
            <Button variant="outline-primary" onClick={navigateToProjects}>
              <FiFolder className="me-2" /> Projects
            </Button>
            <Button variant="outline-primary" onClick={navigateToTeams}>
              <FiUsers className="me-2" /> Teams
            </Button>
          </ButtonGroup>
        </div>

        {showFilters && (
          <Card className="mb-4 p-3">
            <Row>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={filters.name}
                    onChange={handleFilterChange}
                    placeholder="Filter by name"
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="text"
                    name="email"
                    value={filters.email}
                    onChange={handleFilterChange}
                    placeholder="Filter by email"
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Designation</Form.Label>
                  <Form.Control
                    type="text"
                    name="designation"
                    value={filters.designation}
                    onChange={handleFilterChange}
                    placeholder="Filter by designation"
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Role</Form.Label>
                  <Form.Select
                    name="role"
                    value={filters.role}
                    onChange={handleFilterChange}
                  >
                    <option value="">All Roles</option>
                    {roleOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Card>
        )}

        {filteredUsers.length === 0 ? (
          <Alert variant="info" className="text-center">
            No users found matching your criteria
          </Alert>
        ) : (
          <>
            <div className="table-responsive">
              <Table striped bordered hover className="align-middle">
                <thead className="table-light">
                  <tr>
                    <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>
                      Name {sortConfig.key === 'name' && (
                        sortConfig.direction === 'asc' ? '↑' : '↓'
                      )}
                    </th>
                    <th onClick={() => handleSort('email')} style={{ cursor: 'pointer' }}>
                      Email {sortConfig.key === 'email' && (
                        sortConfig.direction === 'asc' ? '↑' : '↓'
                      )}
                    </th>
                    <th onClick={() => handleSort('designation')} style={{ cursor: 'pointer' }}>
                      Designation {sortConfig.key === 'designation' && (
                        sortConfig.direction === 'asc' ? '↑' : '↓'
                      )}
                    </th>
                    <th onClick={() => handleSort('role')} style={{ cursor: 'pointer' }}>
                      Role {sortConfig.key === 'role' && (
                        sortConfig.direction === 'asc' ? '↑' : '↓'
                      )}
                    </th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentUsers.map((user) => (
                    <tr key={user._id}>
                      <td className="fw-semibold">{user.name}</td>
                      <td>{user.email}</td>
                      <td>{user.designation}</td>
                      <td>{getRoleBadge(user.role)}</td>
                      <td>
                        <div className="d-flex gap-2 justify-content-center">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => handleEditClick(user)}
                            disabled={actionLoading !== null}
                            title="Edit user"
                          >
                            <FiEdit2 />
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDeleteClick(user)}
                            disabled={actionLoading !== null}
                            title="Delete user"
                          >
                            <FiTrash2 />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>

            {totalPages > 1 && (
              <div className="d-flex justify-content-center mt-4">
                <Pagination>
                  <Pagination.First 
                    onClick={() => setCurrentPage(1)} 
                    disabled={currentPage === 1} 
                  />
                  <Pagination.Prev 
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                    disabled={currentPage === 1} 
                  />
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <Pagination.Item
                        key={pageNum}
                        active={pageNum === currentPage}
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </Pagination.Item>
                    );
                  })}
                  
                  <Pagination.Next 
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
                    disabled={currentPage === totalPages} 
                  />
                  <Pagination.Last 
                    onClick={() => setCurrentPage(totalPages)} 
                    disabled={currentPage === totalPages} 
                  />
                </Pagination>
              </div>
            )}

            <div className="text-muted text-center mt-2">
              Showing {indexOfFirstUser + 1} to {Math.min(indexOfLastUser, filteredUsers.length)} of {filteredUsers.length} users
            </div>
          </>
        )}
      </Card>

      {/* Add/Edit User Modal */}
      <Modal show={showAddModal || showEditModal} onHide={handleModalClose} centered>
        <Modal.Header closeButton>
          <Modal.Title>{showAddModal ? 'Add New User' : 'Edit User'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                isInvalid={!!formErrors.name}
              />
              <Form.Control.Feedback type="invalid">
                {formErrors.name}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={formData.email}
                onChange={handleFormChange}
                isInvalid={!!formErrors.email}
              />
              <Form.Control.Feedback type="invalid">
                {formErrors.email}
              </Form.Control.Feedback>
            </Form.Group>

            {showAddModal && (
              <Form.Group className="mb-3">
                <Form.Label>Password</Form.Label>
                <Form.Control
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleFormChange}
                  isInvalid={!!formErrors.password}
                />
                <Form.Control.Feedback type="invalid">
                  {formErrors.password}
                </Form.Control.Feedback>
              </Form.Group>
            )}

            <Form.Group className="mb-3">
              <Form.Label>Designation</Form.Label>
              <Form.Control
                type="text"
                name="designation"
                value={formData.designation}
                onChange={handleFormChange}
                isInvalid={!!formErrors.designation}
              />
              <Form.Control.Feedback type="invalid">
                {formErrors.designation}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Role</Form.Label>
              <Form.Select
                name="role"
                value={formData.role}
                onChange={handleFormChange}
              >
                {roleOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleModalClose}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              type="submit"
              disabled={actionLoading === 'submitting'}
            >
              {actionLoading === 'submitting' ? (
                <Spinner size="sm" animation="border" />
              ) : showAddModal ? (
                'Add User'
              ) : (
                'Save Changes'
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={handleModalClose} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete user <strong>{selectedUser?.name}</strong>? 
          This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleModalClose}>
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={handleDelete}
            disabled={actionLoading === 'deleting'}
          >
            {actionLoading === 'deleting' ? (
              <Spinner size="sm" animation="border" />
            ) : (
              'Delete User'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default AdminPage;