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
  ListGroup,
  Dropdown
} from "react-bootstrap";
import { 
  FiEdit2, 
  FiTrash2, 
  FiUser,
  FiPlus,
  FiFilter,
  FiSearch,
  FiRefreshCw,
  FiCheck,
  FiClock,
  FiX,
  FiList,
  FiCalendar
} from "react-icons/fi";
import { 
  getAllTasks,
  createTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
  getTasksByProject,
} from "../helpers/task-api";
import { 
  getAllUsers
} from "../helpers/user-api";
import { 
  getAllProjects
} from "../helpers/project-api";
import toast, { Toaster } from "react-hot-toast";
import Select from 'react-select';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const statusOptions = [
  { value: 'to-do', label: 'To Do', variant: 'secondary' },
  { value: 'in-progress', label: 'In Progress', variant: 'primary' },
  { value: 'done', label: 'Done', variant: 'success' },
  { value: 'cancelled', label: 'Cancelled', variant: 'danger' }
];

const getStatusBadge = (status) => {
  const option = statusOptions.find(opt => opt.value === status) || statusOptions[0];
  return <Badge bg={option.variant} className="text-capitalize">{option.label}</Badge>;
};

const TaskPage = () => {
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [allProjects, setAllProjects] = useState([]);
  const [filters, setFilters] = useState({
    title: '',
    status: '',
    project: '',
    deadlineFrom: null,
    deadlineTo: null
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: 'deadline', direction: 'asc' });

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deadline: new Date(),
    project: null,
    assignedMembers: [],
    status: 'to-do'
  });
  const [formErrors, setFormErrors] = useState({});

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await getAllTasks();
      setTasks(response || []);
      setFilteredTasks(response || []);
    } catch (err) {
      setError(err.message || "Failed to fetch tasks");
      toast.error(err.message || "Failed to fetch tasks");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsersAndProjects = async () => {
    try {
      const [users, projects] = await Promise.all([
        getAllUsers(),
        getAllProjects()
      ]);
      setAllUsers(users || []);
      setAllProjects(projects || []);
    } catch (err) {
      toast.error(err.message || "Failed to fetch users and projects");
      setAllUsers([]);
      setAllProjects([]);
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchUsersAndProjects();
  }, []);

  useEffect(() => {
    let results = [...tasks];
    
    if (filters.title) {
      results = results.filter(t => 
        t?.title?.toLowerCase().includes(filters.title.toLowerCase())
      );
    }
    if (filters.status) {
      results = results.filter(t => t?.status === filters.status);
    }
    if (filters.project) {
      results = results.filter(t => t?.project?._id === filters.project);
    }
    if (filters.deadlineFrom) {
      results = results.filter(t => t?.deadline && new Date(t.deadline) >= filters.deadlineFrom);
    }
    if (filters.deadlineTo) {
      results = results.filter(t => t?.deadline && new Date(t.deadline) <= filters.deadlineTo);
    }
    
    // Apply sorting
    if (sortConfig.key) {
      results.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        if (aValue === undefined || bValue === undefined) return 0;
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    
    setFilteredTasks(results);
    setCurrentPage(1);
  }, [tasks, filters, sortConfig]);

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

  const handleDateFilterChange = (date, field) => {
    setFilters(prev => ({ ...prev, [field]: date }));
  };

  const clearFilters = () => {
    setFilters({
      title: '',
      status: '',
      project: '',
      deadlineFrom: null,
      deadlineTo: null
    });
    setSortConfig({ key: 'deadline', direction: 'asc' });
  };

  const handleAddClick = () => {
    setFormData({
      title: '',
      description: '',
      deadline: new Date(),
      project: null,
      assignedMembers: [],
      status: 'to-do'
    });
    setFormErrors({});
    setShowAddModal(true);
  };

  const handleEditClick = (task) => {
    if (!task) return;
    
    setSelectedTask(task);
    setFormData({
      title: task.title || '',
      description: task.description || '',
      deadline: task.deadline ? new Date(task.deadline) : new Date(),
      project: task.project ? {
        value: task.project._id,
        label: task.project.name
      } : null,
      assignedMembers: (task.assignedMembers || []).map(member => ({
        value: member?.member?._id,
        label: member?.member?.name || 'Unknown'
      })).filter(m => m.value), 
      status: task.status || 'to-do'
    });
    setFormErrors({});
    setShowEditModal(true);
  };

  const handleDeleteClick = (task) => {
    if (!task) return;
    setSelectedTask(task);
    setShowDeleteModal(true);
  };

  const handleViewDetails = (task) => {
    if (!task) return;
    setSelectedTask(task);
    setShowDetailsModal(true);
  };

  const handleStatusChange = async (taskId, newStatus) => {
    if (!taskId || !newStatus) return;
    
    try {
      setActionLoading(`status-${taskId}`);
      await updateTaskStatus(taskId, newStatus);
      await fetchTasks();
      toast.success("Task status updated!");
    } catch (err) {
      toast.error(err.message || "Failed to update task status");
    } finally {
      setActionLoading(null);
    }
  };

  const handleModalClose = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
    setShowDetailsModal(false);
    setSelectedTask(null);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleMembersChange = (selectedOptions) => {
    setFormData(prev => ({ ...prev, assignedMembers: selectedOptions || [] }));
  };

  const handleProjectChange = (selectedOption) => {
    setFormData(prev => ({ ...prev, project: selectedOption }));
  };

  const validateForm = () => {
    const errors = {};
    let isValid = true;
    
    if (!formData.title.trim()) {
      errors.title = 'Task title is required';
      isValid = false;
    }
    
    if (!formData.deadline) {
      errors.deadline = 'Deadline is required';
      isValid = false;
    } else if (new Date(formData.deadline) < new Date()) {
      errors.deadline = 'Deadline cannot be in the past';
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
      
      const assignedMembers = (formData.assignedMembers || []).map(member => ({
        member: member?.value
      })).filter(m => m.member); 
      
      const projectId = formData.project?.value || null;
      
      if (showAddModal) {
        // Create new task
        await createTask(
          formData.title,
          formData.description,
          formData.deadline.toISOString(),
          projectId,
          assignedMembers
        );
        toast.success("Task created successfully!");
      } else if (selectedTask?._id) {
        // Update existing task
        await updateTask(selectedTask._id, {
          title: formData.title,
          description: formData.description,
          deadline: formData.deadline.toISOString(),
          project: projectId,
          assignedMembers: assignedMembers
        });
        toast.success("Task updated successfully!");
      }
      
      await fetchTasks();
      handleModalClose();
    } catch (err) {
      toast.error(err.message || "Failed to save task");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!selectedTask?._id) {
      toast.error("No task selected for deletion");
      return;
    }
    
    try {
      setActionLoading('deleting');
      await deleteTask(selectedTask._id);
      await fetchTasks();
      toast.success("Task deleted successfully!");
      handleModalClose();
    } catch (err) {
      toast.error(err.message || "Failed to delete task");
    } finally {
      setActionLoading(null);
    }
  };


  const indexOfLastTask = currentPage * perPage;
  const indexOfFirstTask = indexOfLastTask - perPage;
  const currentTasks = filteredTasks.slice(indexOfFirstTask, indexOfLastTask);
  const totalPages = Math.ceil(filteredTasks.length / perPage);

  
  const userOptions = Array.isArray(allUsers) 
    ? allUsers.map(user => ({
        value: user?._id,
        label: user?.name || 'Unknown'
      })).filter(u => u.value) 
    : [];

  const projectOptions = Array.isArray(allProjects) 
    ? allProjects.map(project => ({
        value: project?._id,
        label: project?.name || 'Unknown'
      })).filter(p => p.value) // Filter out invalid projects
    : [];

  const statusBadgeOptions = statusOptions.map(option => (
    <Dropdown.Item 
      key={option.value} 
      onClick={() => handleStatusChange(selectedTask?._id, option.value)}
    >
      <Badge bg={option.variant} className="me-2">{option.label}</Badge>
    </Dropdown.Item>
  ));

  const getAssignedMembersBadges = (task) => {
    if (!task?.assignedMembers?.length) {
      return <Badge bg="secondary">Unassigned</Badge>;
    }
    
    return (
      <div className="d-flex flex-wrap gap-1">
        {task.assignedMembers.slice(0, 3).map(member => (
          <Badge key={member?.member?._id} bg="light" text="dark">
            <FiUser className="me-1" />
            {member?.member?.name || 'Unknown'}
          </Badge>
        ))}
        {task.assignedMembers.length > 3 && (
          <Badge bg="light" text="dark">
            +{task.assignedMembers.length - 3} more
          </Badge>
        )}
      </div>
    );
  };

  const getDeadlineDisplay = (task) => {
    if (!task?.deadline) return 'N/A';
    
    const deadlineDate = new Date(task.deadline);
    const isOverdue = deadlineDate < new Date() && task.status !== 'done' && task.status !== 'cancelled';
    
    return (
      <div className="d-flex align-items-center">
        <FiCalendar className="me-2" />
        {deadlineDate.toLocaleDateString()}
        {isOverdue && (
          <Badge bg="danger" className="ms-2">Overdue</Badge>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" role="status" />
        <p className="mt-2">Loading tasks...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger" className="text-center my-5">
        {error}
        <Button variant="link" onClick={fetchTasks}>Retry</Button>
      </Alert>
    );
  }

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
      <Card className="shadow-sm p-4 bg-light border-0">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3>
            <FiList className="me-2" />
            Task Management
          </h3>
          <div className="d-flex align-items-center gap-2">
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
              <FiPlus className="me-2" /> New Task
            </Button>
          </div>
        </div>

        {showFilters && (
          <Card className="mb-4 p-3">
            <Row>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Task Title</Form.Label>
                  <Form.Control
                    type="text"
                    name="title"
                    value={filters.title}
                    onChange={handleFilterChange}
                    placeholder="Filter by task title"
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    name="status"
                    value={filters.status}
                    onChange={handleFilterChange}
                  >
                    <option value="">All Statuses</option>
                    {statusOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Project</Form.Label>
                  <Form.Select
                    name="project"
                    value={filters.project}
                    onChange={handleFilterChange}
                  >
                    <option value="">All Projects</option>
                    {allProjects.map(project => (
                      <option key={project?._id} value={project?._id}>
                        {project?.name || 'Unknown'}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Row className="mt-3">
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Deadline From</Form.Label>
                  <DatePicker
                    selected={filters.deadlineFrom}
                    onChange={(date) => handleDateFilterChange(date, 'deadlineFrom')}
                    className="form-control"
                    placeholderText="Select start date"
                    dateFormat="dd/MM/yyyy"
                    isClearable
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Deadline To</Form.Label>
                  <DatePicker
                    selected={filters.deadlineTo}
                    onChange={(date) => handleDateFilterChange(date, 'deadlineTo')}
                    className="form-control"
                    placeholderText="Select end date"
                    dateFormat="dd/MM/yyyy"
                    isClearable
                    minDate={filters.deadlineFrom}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Card>
        )}

        {filteredTasks.length === 0 ? (
          <Alert variant="info" className="text-center">
            No tasks found matching your criteria
            <Button variant="link" onClick={clearFilters}>Clear filters</Button>
          </Alert>
        ) : (
          <>
            <div className="table-responsive">
              <Table striped bordered hover className="align-middle">
                <thead className="table-light">
                  <tr>
                    <th onClick={() => handleSort('title')} style={{ cursor: 'pointer' }}>
                      Title {sortConfig.key === 'title' && (
                        sortConfig.direction === 'asc' ? '↑' : '↓'
                      )}
                    </th>
                    <th>Status</th>
                    <th>Project</th>
                    <th>Assigned To</th>
                    <th onClick={() => handleSort('deadline')} style={{ cursor: 'pointer' }}>
                      Deadline {sortConfig.key === 'deadline' && (
                        sortConfig.direction === 'asc' ? '↑' : '↓'
                      )}
                    </th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentTasks.map((task) => (
                    <tr key={task?._id}>
                      <td className="fw-semibold">{task?.title || 'Untitled Task'}</td>
                      <td>{getStatusBadge(task?.status)}</td>
                      <td>
                        {task?.project ? (
                          <Badge bg="info">{task.project.name}</Badge>
                        ) : (
                          <Badge bg="secondary">No Project</Badge>
                        )}
                      </td>
                      <td>
                        {getAssignedMembersBadges(task)}
                      </td>
                      <td>
                        {getDeadlineDisplay(task)}
                      </td>
                      <td>
                        <div className="d-flex gap-2 justify-content-center">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => handleEditClick(task)}
                            disabled={actionLoading !== null}
                            title="Edit task"
                          >
                            <FiEdit2 />
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDeleteClick(task)}
                            disabled={actionLoading !== null}
                            title="Delete task"
                          >
                            <FiTrash2 />
                          </Button>
                          <Dropdown>
                            <Dropdown.Toggle variant="outline-secondary" size="sm" id="status-dropdown">
                              {actionLoading === `status-${task?._id}` ? (
                                <Spinner size="sm" animation="border" />
                              ) : (
                                'Status'
                              )}
                            </Dropdown.Toggle>
                            <Dropdown.Menu>
                              {statusBadgeOptions}
                            </Dropdown.Menu>
                          </Dropdown>
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
              Showing {indexOfFirstTask + 1} to {Math.min(indexOfLastTask, filteredTasks.length)} of {filteredTasks.length} tasks
            </div>
          </>
        )}
      </Card>

      {/* Add/Edit Task Modal */}
      <Modal show={showAddModal || showEditModal} onHide={handleModalClose} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{showAddModal ? 'Create New Task' : 'Edit Task'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Task Title</Form.Label>
                  <Form.Control
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleFormChange}
                    isInvalid={!!formErrors.title}
                    placeholder="Enter task title"
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.title}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="description"
                    value={formData.description}
                    onChange={handleFormChange}
                    placeholder="Enter task description (optional)"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Deadline</Form.Label>
                  <DatePicker
                    selected={formData.deadline}
                    onChange={(date) => setFormData(prev => ({ ...prev, deadline: date }))}
                    className="form-control"
                    dateFormat="dd/MM/yyyy"
                    minDate={new Date()}
                    showTimeSelect
                    timeFormat="HH:mm"
                    timeIntervals={15}
                    timeCaption="Time"
                    isClearable
                  />
                  {formErrors.deadline && (
                    <div className="text-danger small">{formErrors.deadline}</div>
                  )}
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Project (Optional)</Form.Label>
                  <Select
                    options={projectOptions}
                    value={formData.project}
                    onChange={handleProjectChange}
                    placeholder="Select a project"
                    isClearable
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Assigned Members</Form.Label>
                  <Select
                    isMulti
                    options={userOptions}
                    value={formData.assignedMembers}
                    onChange={handleMembersChange}
                    placeholder="Select team members"
                    className="basic-multi-select"
                    classNamePrefix="select"
                  />
                </Form.Group>
              </Col>
            </Row>
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
                'Create Task'
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
          Are you sure you want to delete the task <strong>{selectedTask?.title || 'this task'}</strong>? 
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
              'Delete Task'
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Task Details Modal */}
      <Modal show={showDetailsModal} onHide={handleModalClose} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <FiList className="me-2" />
            {selectedTask?.title || 'Task Details'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row>
            <Col md={6}>
              <h5>Task Information</h5>
              <ListGroup variant="flush">
                <ListGroup.Item>
                  <strong>Status:</strong> {getStatusBadge(selectedTask?.status)}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Project:</strong> {selectedTask?.project?.name || 'No Project'}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Created:</strong> {selectedTask?.createdAt ? new Date(selectedTask.createdAt).toLocaleString() : 'N/A'}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Deadline:</strong> {selectedTask?.deadline ? new Date(selectedTask.deadline).toLocaleString() : 'N/A'}
                  {selectedTask?.deadline && new Date(selectedTask.deadline) < new Date() && selectedTask.status !== 'done' && selectedTask.status !== 'cancelled' && (
                    <Badge bg="danger" className="ms-2">Overdue</Badge>
                  )}
                </ListGroup.Item>
              </ListGroup>

              <h5 className="mt-4">Description</h5>
              <Card>
                <Card.Body>
                  {selectedTask?.description || 'No description provided'}
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <h5>Assigned Members</h5>
              {selectedTask?.assignedMembers?.length > 0 ? (
                <ListGroup variant="flush">
                  {selectedTask.assignedMembers.map(member => (
                    <ListGroup.Item key={member?.member?._id}>
                      <div className="d-flex align-items-center">
                        <FiUser className="me-2" />
                        <div>
                          <div>{member?.member?.name || 'Unknown'}</div>
                          <div className="text-muted small">{member?.member?.designation || ''}</div>
                        </div>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              ) : (
                <Alert variant="info">No members assigned to this task</Alert>
              )}
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleModalClose}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default TaskPage;