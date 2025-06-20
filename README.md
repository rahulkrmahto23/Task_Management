#Overview
This is a comprehensive Project Management System API built with Node.js, Express, and MongoDB. It provides endpoints for managing users, teams, projects, and tasks with proper authentication and authorization.

#Features
User Management
User registration and login with JWT authentication

Role-based access control (Admin, Manager, Employee)

CRUD operations for users

User statistics and profile management

Team Management
Create, read, update, and delete teams

Add/remove team members

Team statistics and member management

Project assignment to teams

Project Management
Create projects within teams

Assign members to projects

Track project progress and statistics

Task management within projects

Task Management
Create, assign, and track tasks

Update task status (To-Do, In Progress, Done, etc.)

Task deadlines and assignment tracking

Comprehensive task statistics

Authorization Roles
Admin: Full access to all resources

Manager: Can manage teams, projects, and tasks they create or are assigned to

Employee: Can view and update their assigned tasks and projects

API Documentation
The API follows RESTful principles and uses JWT for authentication. All endpoints require proper authorization based on user roles.

Base URL
http://localhost:3000/api

Authentication
All endpoints (except login/register) require a valid JWT token in the cookie

Token is automatically set in cookies upon successful login/registration

Models
User: name, email, password, designation, role, teams, projects, tasks

Team: name, description, members, createdBy, projects

Project: name, description, team, members, createdBy, tasks

Task: title, description, deadline, project, assignedMembers, createdBy

Error Handling
All endpoints return appropriate HTTP status codes and error messages in case of failures.

Setup
Clone the repository

Install dependencies: npm install

Configure MongoDB connection

Set environment variables

Start the server: npm start

Dependencies
Express.js

MongoDB (Mongoose)

bcrypt (password hashing)

jsonwebtoken (authentication)

Other standard Node.js packages
