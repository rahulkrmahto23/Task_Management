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
  Tab,
  Tabs,
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
  FiPieChart,
} from "react-icons/fi";
import {
  getAllTeams,
  createTeam,
  updateTeam,
  deleteTeam,
  getTeamsByUser,
  getTeamStats,
} from "../helpers/team-api";
import { getAllUsers } from "../helpers/user-api";
import toast, { Toaster } from "react-hot-toast";
import Select from "react-select";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

interface Team {
  _id: string;
  name: string;
  description?: string;
  members: any[];
  createdBy: any;
  projects: any[];
}

interface User {
  _id: string;
  name: string;
  email: string;
  designation: string;
  role: string;
}

interface TeamStats {
  projectCount: number;
  memberCount: number;
  taskStats: Record<string, number>;
}

const TeamPage = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [filteredTeams, setFilteredTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [teamStats, setTeamStats] = useState<TeamStats | null>(null);
  const [filters, setFilters] = useState({
    name: "",
    description: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({
    key: "name",
    direction: "asc",
  });

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    members: [] as { value: string; label: string }[],
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const response = await getAllTeams();
      setTeams(response);
      setFilteredTeams(response);
    } catch (err: any) {
      setError(err.message || "Failed to fetch teams");
      toast.error(err.message || "Failed to fetch teams");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const users = await getAllUsers();
      setAllUsers(users);
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch users");
    }
  };

  const fetchTeamStats = async (teamId: string) => {
    try {
      setActionLoading("loading-stats");
      const stats = await getTeamStats(teamId);
      setTeamStats(stats);
      setShowStatsModal(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch team stats");
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    fetchTeams();
    fetchUsers();
  }, []);

  useEffect(() => {
    let results = [...teams];

    if (filters.name) {
      results = results.filter((t) =>
        t.name.toLowerCase().includes(filters.name.toLowerCase())
      );
    }
    if (filters.description) {
      results = results.filter((t) =>
        t.description?.toLowerCase().includes(filters.description.toLowerCase())
      );
    }

    if (sortConfig.key) {
      results.sort((a, b) => {
        const aValue = a[sortConfig.key as keyof Team] || "";
        const bValue = b[sortConfig.key as keyof Team] || "";

        if (aValue < bValue) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }

    setFilteredTeams(results);
    setCurrentPage(1);
  }, [teams, filters, sortConfig]);

  const handleSort = (key: string) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({
      name: "",
      description: "",
    });
    setSortConfig({ key: "name", direction: "asc" });
  };

  const handleAddClick = () => {
    setFormData({
      name: "",
      description: "",
      members: [],
    });
    setFormErrors({});
    setShowAddModal(true);
  };

  const handleEditClick = (team: Team) => {
    setSelectedTeam(team);
    setFormData({
      name: team.name,
      description: team.description || "",
      members: team.members.map((member) => ({
        value: member._id,
        label: member.name,
      })),
    });
    setFormErrors({});
    setShowEditModal(true);
  };

  const handleDeleteClick = (team: Team) => {
    setSelectedTeam(team);
    setShowDeleteModal(true);
  };

  const handleViewMembers = (team: Team) => {
    setSelectedTeam(team);
    setShowMembersModal(true);
  };

  const handleViewStats = (team: Team) => {
    setSelectedTeam(team);
    fetchTeamStats(team._id);
  };

  const handleModalClose = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
    setShowMembersModal(false);
    setShowStatsModal(false);
    setSelectedTeam(null);
    setTeamStats(null);
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

  const handleMembersChange = (selectedOptions: any) => {
    setFormData((prev) => ({ ...prev, members: selectedOptions }));
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    let isValid = true;

    if (!formData.name.trim()) {
      errors.name = "Team name is required";
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

      if (showAddModal) {
        await createTeam(formData.name, formData.description, memberIds);
        toast.success("Team created successfully!");
      } else {
        await updateTeam(selectedTeam!._id, {
          name: formData.name,
          description: formData.description,
          members: memberIds,
        });
        toast.success("Team updated successfully!");
      }

      await fetchTeams();
      handleModalClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to save team");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    try {
      setActionLoading("deleting");
      await deleteTeam(selectedTeam!._id);
      await fetchTeams();
      toast.success("Team deleted successfully!");
      handleModalClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete team");
    } finally {
      setActionLoading(null);
    }
  };

  const indexOfLastTeam = currentPage * perPage;
  const indexOfFirstTeam = indexOfLastTeam - perPage;
  const currentTeams = filteredTeams.slice(indexOfFirstTeam, indexOfLastTeam);
  const totalPages = Math.ceil(filteredTeams.length / perPage);

  const userOptions = allUsers.map((user) => ({
    value: user._id,
    label: `${user.name} (${user.designation})`,
  }));

  const chartData = {
    labels: teamStats ? Object.keys(teamStats.taskStats) : [],
    datasets: [
      {
        data: teamStats ? Object.values(teamStats.taskStats) : [],
        backgroundColor: [
          "#FF6384",
          "#36A2EB",
          "#FFCE56",
          "#4BC0C0",
          "#9966FF",
        ],
        hoverBackgroundColor: [
          "#FF6384",
          "#36A2EB",
          "#FFCE56",
          "#4BC0C0",
          "#9966FF",
        ],
      },
    ],
  };

  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" role="status" />
        <p className="mt-2">Loading teams...</p>
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
          <h3>Team Management</h3>
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
              <FiPlus className="me-2" /> Create Team
            </Button>
          </div>
        </div>

        {showFilters && (
          <Card className="mb-4 p-3">
            <Row>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Team Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={filters.name}
                    onChange={handleFilterChange}
                    placeholder="Filter by team name"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
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
            </Row>
          </Card>
        )}

        {filteredTeams.length === 0 ? (
          <Alert variant="info" className="text-center">
            No teams found matching your criteria
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
                      Team Name{" "}
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
                    <th>Projects</th>
                    <th>Members</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentTeams.map((team) => (
                    <tr key={team._id}>
                      <td className="fw-semibold">{team.name}</td>
                      <td>{team.description || "-"}</td>
                      <td>
                        <Badge bg="secondary" className="me-1">
                          {team.projects?.length || 0} projects
                        </Badge>
                      </td>
                      <td>
                        <Badge bg="info" className="me-1">
                          {team.members.length} members
                        </Badge>
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() => handleViewMembers(team)}
                          className="p-0"
                        >
                          <FiUsers /> View
                        </Button>
                      </td>
                      <td>
                        <div className="d-flex gap-2 justify-content-center">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => handleEditClick(team)}
                            disabled={actionLoading !== null}
                            title="Edit team"
                          >
                            <FiEdit2 />
                          </Button>
                          <Button
                            variant="outline-info"
                            size="sm"
                            onClick={() => handleViewStats(team)}
                            disabled={actionLoading !== null}
                            title="View stats"
                          >
                            <FiPieChart />
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDeleteClick(team)}
                            disabled={actionLoading !== null}
                            title="Delete team"
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
              Showing {indexOfFirstTeam + 1} to{" "}
              {Math.min(indexOfLastTeam, filteredTeams.length)} of{" "}
              {filteredTeams.length} teams
            </div>
          </>
        )}
      </Card>

      {/* Add/Edit Team Modal */}
      <Modal
        show={showAddModal || showEditModal}
        onHide={handleModalClose}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {showAddModal ? "Create New Team" : "Edit Team"}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Team Name <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    isInvalid={!!formErrors.name}
                    placeholder="Enter team name"
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
                    placeholder="Enter team description (optional)"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Team Members</Form.Label>
                  <Select
                    isMulti
                    options={userOptions}
                    value={formData.members}
                    onChange={handleMembersChange}
                    placeholder="Select team members"
                    className="basic-multi-select"
                    classNamePrefix="select"
                  />
                  <small className="text-muted">
                    Hold Ctrl/Cmd to select multiple members
                  </small>
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
                "Create Team"
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
          <p>
            Are you sure you want to delete the team{" "}
            <strong>{selectedTeam?.name}</strong>?
          </p>
          <Alert variant="warning">
            <strong>Warning:</strong> This will also delete all associated
            projects and tasks. This action cannot be undone.
          </Alert>
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
              "Delete Team"
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Team Members Modal */}
      <Modal
        show={showMembersModal}
        onHide={handleModalClose}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <FiUsers className="me-2" />
            {selectedTeam?.name} Members
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Tabs defaultActiveKey="members" className="mb-3">
            <Tab eventKey="members" title="Members">
              {selectedTeam?.members?.length > 0 ? (
                <ListGroup variant="flush">
                  {selectedTeam.members.map((member) => (
                    <ListGroup.Item
                      key={member._id}
                      className="d-flex justify-content-between align-items-center"
                    >
                      <div>
                        <FiUser className="me-2" />
                        <strong>{member.name}</strong>
                        <div className="text-muted small">{member.email}</div>
                        <div className="small">{member.designation}</div>
                      </div>
                      <Badge
                        bg={
                          member.role === "admin"
                            ? "danger"
                            : member.role === "manager"
                            ? "warning"
                            : "secondary"
                        }
                      >
                        {member.role}
                      </Badge>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              ) : (
                <Alert variant="info" className="text-center">
                  No members in this team
                </Alert>
              )}
            </Tab>
            <Tab eventKey="projects" title="Projects">
              {selectedTeam?.projects?.length > 0 ? (
                <ListGroup variant="flush">
                  {selectedTeam.projects.map((project) => (
                    <ListGroup.Item key={project._id}>
                      <div>
                        <strong>{project.name}</strong>
                        {project.description && (
                          <div className="text-muted small">
                            {project.description}
                          </div>
                        )}
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              ) : (
                <Alert variant="info" className="text-center">
                  No projects in this team
                </Alert>
              )}
            </Tab>
          </Tabs>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleModalClose}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Team Stats Modal */}
      <Modal show={showStatsModal} onHide={handleModalClose} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <FiPieChart className="me-2" />
            {selectedTeam?.name} Statistics
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {teamStats ? (
            <Row>
              <Col md={6}>
                <Card className="mb-4">
                  <Card.Body>
                    <Card.Title>Team Overview</Card.Title>
                    <div className="d-flex justify-content-between mb-3">
                      <div>
                        <h5>{teamStats.projectCount}</h5>
                        <small className="text-muted">Projects</small>
                      </div>
                      <div>
                        <h5>{teamStats.memberCount}</h5>
                        <small className="text-muted">Members</small>
                      </div>
                    </div>
                  </Card.Body>
                </Card>

                {Object.keys(teamStats.taskStats).length > 0 && (
                  <Card>
                    <Card.Body>
                      <Card.Title>Task Status</Card.Title>
                      <ListGroup variant="flush">
                        {Object.entries(teamStats.taskStats).map(
                          ([status, count]) => (
                            <ListGroup.Item
                              key={status}
                              className="d-flex justify-content-between"
                            >
                              <span>{status}</span>
                              <Badge bg="primary">{count}</Badge>
                            </ListGroup.Item>
                          )
                        )}
                      </ListGroup>
                    </Card.Body>
                  </Card>
                )}
              </Col>
              <Col md={6}>
                {Object.keys(teamStats.taskStats).length > 0 && (
                  <Card>
                    <Card.Body>
                      <Card.Title>Task Distribution</Card.Title>
                      <div style={{ height: "300px" }}>
                        <Doughnut
                          data={chartData}
                          options={{
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                position: "right",
                              },
                            },
                          }}
                        />
                      </div>
                    </Card.Body>
                  </Card>
                )}
              </Col>
            </Row>
          ) : (
            <div className="text-center">
              <Spinner animation="border" />
              <p>Loading statistics...</p>
            </div>
          )}
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

export default TeamPage;
