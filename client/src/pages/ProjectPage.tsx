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
  Dropdown,
} from "react-bootstrap";
import {
  FiEdit2,
  FiTrash2,
  FiUsers,
  FiPlus,
  FiFilter,
  FiSearch,
  FiRefreshCw,
  FiUser,
  FiUserX,
  FiCheck,
  FiX,
  FiFolder,
} from "react-icons/fi";
import {
  getAllProjects,
  createProject,
  updateProject,
  deleteProject,
  getProjectsByTeam,
  getProjectsByUser,
  getProjectStats,
} from "../helpers/project-api";
import { getAllUsers } from "../helpers/user-api";
import { getAllTeams } from "../helpers/team-api";
import toast, { Toaster } from "react-hot-toast";
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface Project {
  _id: string;
  name: string;
  description?: string;
  members: any[];
  team?: any;
  createdBy: any;
  tasks?: any[];
  startDate?: Date;
  endDate?: Date;
}

interface FormData {
  name: string;
  description: string;
  members: { value: string; label: string }[];
  team: { value: string; label: string } | null;
  startDate: Date;
  endDate: Date | null;
}

const ProjectPage = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [allTeams, setAllTeams] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    name: "",
    description: "",
    team: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({
    key: "name",
    direction: "asc",
  });
  const [stats, setStats] = useState<any>(null);

  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    members: [],
    team: null,
    startDate: new Date(),
    endDate: null,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await getAllProjects();
      setProjects(response.data);
      setFilteredProjects(response.data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch projects");
      toast.error(err.message || "Failed to fetch projects");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsersAndTeams = async () => {
    try {
      const [usersResponse, teamsResponse] = await Promise.all([
        getAllUsers(),
        getAllTeams(),
      ]);

      const users = Array.isArray(usersResponse) ? usersResponse : [];
      const teams = Array.isArray(teamsResponse) ? teamsResponse : [];

      setAllUsers(users);
      setAllTeams(teams);
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch users and teams");
    }
  };

  const fetchProjectStats = async (projectId: string) => {
    try {
      const response = await getProjectStats(projectId);
      setStats(response.data);
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch project stats");
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchUsersAndTeams();
  }, []);

  useEffect(() => {
    if (selectedProject && showDetailsModal) {
      fetchProjectStats(selectedProject._id);
    }
  }, [selectedProject, showDetailsModal]);

  useEffect(() => {
    let results = [...projects];

    if (filters.name) {
      results = results.filter((p) =>
        p.name.toLowerCase().includes(filters.name.toLowerCase())
      );
    }
    if (filters.description) {
      results = results.filter((p) =>
        p.description?.toLowerCase().includes(filters.description.toLowerCase())
      );
    }
    if (filters.team) {
      results = results.filter((p) => p.team?._id === filters.team);
    }

    if (sortConfig.key) {
      results.sort((a: any, b: any) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue < bValue) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }

    setFilteredProjects(results);
    setCurrentPage(1);
  }, [projects, filters, sortConfig]);

  const handleSort = (key: string) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const handleFilterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({
      name: "",
      description: "",
      team: "",
    });
    setSortConfig({ key: "name", direction: "asc" });
  };

  const handleAddClick = () => {
    setFormData({
      name: "",
      description: "",
      members: [],
      team: null,
      startDate: new Date(),
      endDate: null,
    });
    setFormErrors({});
    setShowAddModal(true);
  };

  const handleEditClick = (project: Project) => {
    setSelectedProject(project);
    setFormData({
      name: project.name,
      description: project.description || "",
      members: project.members.map((member) => ({
        value: member._id,
        label: `${member.name} (${member.email})`,
      })),
      team: project.team
        ? {
            value: project.team._id,
            label: `${project.team.name} (${project.team.members.length} members)`,
          }
        : null,
      startDate: project.startDate ? new Date(project.startDate) : new Date(),
      endDate: project.endDate ? new Date(project.endDate) : null,
    });
    setFormErrors({});
    setShowEditModal(true);
  };

  const handleDeleteClick = (project: Project) => {
    setSelectedProject(project);
    setShowDeleteModal(true);
  };

  const handleViewDetails = (project: Project) => {
    setSelectedProject(project);
    setShowDetailsModal(true);
  };

  const handleModalClose = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
    setShowDetailsModal(false);
    setSelectedProject(null);
    setStats(null);
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleDateChange = (
    date: Date | null,
    field: "startDate" | "endDate"
  ) => {
    setFormData((prev) => ({ ...prev, [field]: date }));

    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleMembersChange = (selectedOptions: any) => {
    setFormData((prev) => ({ ...prev, members: selectedOptions }));
  };

  const handleTeamChange = (selectedOption: any) => {
    setFormData((prev) => ({ ...prev, team: selectedOption }));
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    let isValid = true;

    if (!formData.name.trim()) {
      errors.name = "Project name is required";
      isValid = false;
    }

    if (formData.endDate && formData.startDate > formData.endDate) {
      errors.endDate = "End date must be after start date";
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setActionLoading("submitting");

      const memberIds = formData.members.map((member) => member.value);
      const teamId = formData.team?.value || null;

      const projectData = {
        name: formData.name,
        description: formData.description,
        members: memberIds,
        team: teamId,
        startDate: formData.startDate,
        endDate: formData.endDate,
      };

      if (showAddModal) {
        await createProject(projectData);
        toast.success("Project created successfully!");
      } else if (selectedProject) {
        await updateProject(selectedProject._id, projectData);
        toast.success("Project updated successfully!");
      }

      await fetchProjects();
      handleModalClose();
    } catch (err: any) {
      console.error("Error saving project:", err);
      toast.error(
        err.response?.data?.message || err.message || "Failed to save project"
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!selectedProject) return;

    try {
      setActionLoading("deleting");
      await deleteProject(selectedProject._id);
      await fetchProjects();
      toast.success("Project deleted successfully!");
      handleModalClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete project");
    } finally {
      setActionLoading(null);
    }
  };

  const indexOfLastProject = currentPage * perPage;
  const indexOfFirstProject = indexOfLastProject - perPage;
  const currentProjects = filteredProjects.slice(
    indexOfFirstProject,
    indexOfLastProject
  );
  const totalPages = Math.ceil(filteredProjects.length / perPage);

  const userOptions = allUsers.map((user) => ({
    value: user._id,
    label: `${user.name} (${user.email})`,
  }));

  const teamOptions = allTeams.map((team) => ({
    value: team._id,
    label: `${team.name} (${team.members.length} members)`,
  }));

  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" role="status" />
        <p className="mt-2">Loading projects...</p>
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
          <h3>
            <FiFolder className="me-2" />
            Project Management
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
              <FiPlus className="me-2" /> New Project
            </Button>
          </div>
        </div>

        {showFilters && (
          <Card className="mb-4 p-3">
            <Row>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Project Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={filters.name}
                    onChange={handleFilterChange}
                    placeholder="Filter by project name"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    type="text"
                    name="description"
                    value={filters.description}
                    onChange={handleFilterChange}
                    placeholder="Filter by description"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Team</Form.Label>
                  <Form.Select
                    name="team"
                    value={filters.team}
                    onChange={handleFilterChange}
                  >
                    <option value="">All Teams</option>
                    {allTeams.map((team) => (
                      <option key={team._id} value={team._id}>
                        {team.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Card>
        )}

        {filteredProjects.length === 0 ? (
          <Alert variant="info" className="text-center">
            No projects found matching your criteria
          </Alert>
        ) : (
          <>
            <div className="table-responsive">
              <Table striped bordered hover className="align-middle">
                <thead className="table-light">
                  <tr>
                    <th
                      onClick={() => handleSort("name")}
                      style={{ cursor: "pointer" }}
                    >
                      Project Name{" "}
                      {sortConfig.key === "name" &&
                        (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </th>
                    <th
                      onClick={() => handleSort("description")}
                      style={{ cursor: "pointer" }}
                    >
                      Description{" "}
                      {sortConfig.key === "description" &&
                        (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </th>
                    <th>Team</th>
                    <th>Members</th>
                    <th>Created By</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentProjects.map((project) => (
                    <tr key={project._id}>
                      <td className="fw-semibold">
                        <Button
                          variant="link"
                          onClick={() => handleViewDetails(project)}
                          className="p-0 text-decoration-none"
                        >
                          {project.name}
                        </Button>
                      </td>
                      <td>{project.description || "-"}</td>
                      <td>
                        {project.team ? (
                          <Badge bg="info">{project.team.name}</Badge>
                        ) : (
                          <Badge bg="secondary">No Team</Badge>
                        )}
                      </td>
                      <td>
                        <Badge bg="primary" className="me-1">
                          {project.members.length} members
                        </Badge>
                      </td>
                      <td>{project.createdBy?.name || "Unknown"}</td>
                      <td>
                        <div className="d-flex gap-2 justify-content-center">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => handleEditClick(project)}
                            disabled={actionLoading !== null}
                            title="Edit project"
                          >
                            <FiEdit2 />
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDeleteClick(project)}
                            disabled={actionLoading !== null}
                            title="Delete project"
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
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
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
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
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
              Showing {indexOfFirstProject + 1} to{" "}
              {Math.min(indexOfLastProject, filteredProjects.length)} of{" "}
              {filteredProjects.length} projects
            </div>
          </>
        )}
      </Card>

      {/* Add/Edit Project Modal */}
      <Modal
        show={showAddModal || showEditModal}
        onHide={handleModalClose}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {showAddModal ? "Create New Project" : "Edit Project"}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Project Name <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    isInvalid={!!formErrors.name}
                    placeholder="Enter project name"
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.name}
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
                    placeholder="Enter project description (optional)"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Start Date</Form.Label>
                  <DatePicker
                    selected={formData.startDate}
                    onChange={(date: Date) =>
                      handleDateChange(date, "startDate")
                    }
                    className="form-control"
                    dateFormat="MMMM d, yyyy"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>End Date (Optional)</Form.Label>
                  <DatePicker
                    selected={formData.endDate}
                    onChange={(date: Date) => handleDateChange(date, "endDate")}
                    className="form-control"
                    dateFormat="MMMM d, yyyy"
                    minDate={formData.startDate}
                    isClearable
                    placeholderText="Select end date"
                  />
                  {formErrors.endDate && (
                    <Form.Control.Feedback
                      type="invalid"
                      style={{ display: "block" }}
                    >
                      {formErrors.endDate}
                    </Form.Control.Feedback>
                  )}
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Team (Optional)</Form.Label>
                  <Select
                    options={teamOptions}
                    value={formData.team}
                    onChange={handleTeamChange}
                    placeholder="Select a team"
                    isClearable
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Project Members</Form.Label>
                  <Select
                    isMulti
                    options={userOptions}
                    value={formData.members}
                    onChange={handleMembersChange}
                    placeholder="Select project members"
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
              disabled={actionLoading === "submitting"}
            >
              {actionLoading === "submitting" ? (
                <>
                  <Spinner size="sm" animation="border" className="me-2" />
                  {showAddModal ? "Creating..." : "Saving..."}
                </>
              ) : showAddModal ? (
                "Create Project"
              ) : (
                "Save Changes"
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
          Are you sure you want to delete the project{" "}
          <strong>{selectedProject?.name}</strong>? This action cannot be undone
          and will also delete all associated tasks.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleModalClose}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDelete}
            disabled={actionLoading === "deleting"}
          >
            {actionLoading === "deleting" ? (
              <>
                <Spinner size="sm" animation="border" className="me-2" />
                Deleting...
              </>
            ) : (
              "Delete Project"
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Project Details Modal */}
      <Modal
        show={showDetailsModal}
        onHide={handleModalClose}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <FiFolder className="me-2" />
            {selectedProject?.name} Details
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row>
            <Col md={6}>
              <h5>Project Information</h5>
              <ListGroup variant="flush">
                <ListGroup.Item>
                  <strong>Name:</strong> {selectedProject?.name}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Description:</strong>{" "}
                  {selectedProject?.description || "N/A"}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Team:</strong>{" "}
                  {selectedProject?.team?.name || "No Team Assigned"}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Created By:</strong>{" "}
                  {selectedProject?.createdBy?.name || "Unknown"}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Start Date:</strong>{" "}
                  {selectedProject?.startDate
                    ? new Date(selectedProject.startDate).toLocaleDateString()
                    : "N/A"}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>End Date:</strong>{" "}
                  {selectedProject?.endDate
                    ? new Date(selectedProject.endDate).toLocaleDateString()
                    : "N/A"}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Created At:</strong>{" "}
                  {selectedProject?.createdAt
                    ? new Date(selectedProject.createdAt).toLocaleString()
                    : "N/A"}
                </ListGroup.Item>
              </ListGroup>

              {stats && (
                <div className="mt-4">
                  <h5>Project Stats</h5>
                  <Row>
                    <Col md={6}>
                      <div className="d-flex align-items-center gap-3 mb-3">
                        <div className="bg-primary bg-opacity-10 p-3 rounded">
                          <FiUsers size={24} className="text-primary" />
                        </div>
                        <div>
                          <div className="text-muted small">Members</div>
                          <div className="h4 mb-0">{stats.memberCount}</div>
                        </div>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="d-flex align-items-center gap-3 mb-3">
                        <div className="bg-info bg-opacity-10 p-3 rounded">
                          <FiCheck size={24} className="text-info" />
                        </div>
                        <div>
                          <div className="text-muted small">Tasks</div>
                          <div className="h4 mb-0">{stats.taskCount}</div>
                        </div>
                      </div>
                    </Col>
                  </Row>
                </div>
              )}
            </Col>
            <Col md={6}>
              <h5>Project Members</h5>
              {selectedProject?.members?.length > 0 ? (
                <ListGroup variant="flush">
                  {selectedProject.members.map((member) => (
                    <ListGroup.Item key={member._id}>
                      <div className="d-flex align-items-center">
                        <div className="me-3">
                          <div
                            className="bg-light rounded-circle d-flex align-items-center justify-content-center"
                            style={{ width: 40, height: 40 }}
                          >
                            <FiUser className="text-muted" />
                          </div>
                        </div>
                        <div>
                          <div>{member.name}</div>
                          <div className="text-muted small">{member.email}</div>
                        </div>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              ) : (
                <Alert variant="info">
                  No members assigned to this project
                </Alert>
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

export default ProjectPage;
