import React, { useEffect, useState } from 'react';
import { getUserById } from '../helpers/user-api';

interface User {
  id: string;
  name: string;
  email: string;
  designation: string;
  role: string;
  teams: {
    id: string;
    name: string;
    description?: string;
  }[];
  projects: {
    id: string;
    name: string;
    description?: string;
  }[];
  tasks: {
    id: string;
    title: string;
    description: string;
    status: string;
    deadline: string;
  }[];
}

const EmployeePage = () => {
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        
        const verification = await verifyUser();
        
        const response = await getUserById(verification.user.id);
        setUserData(response.user);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch user data');
        setLoading(false);
        console.error(err);
      }
    };

    fetchUserData();
  }, []);

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  if (!userData) {
    return <div className="p-4">User not found</div>;
  }

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Employee Dashboard</h1>
      
      {/* User Profile Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-gray-600">Name:</p>
            <p className="font-medium">{userData.name}</p>
          </div>
          <div>
            <p className="text-gray-600">Email:</p>
            <p className="font-medium">{userData.email}</p>
          </div>
          <div>
            <p className="text-gray-600">Designation:</p>
            <p className="font-medium">{userData.designation}</p>
          </div>
          <div>
            <p className="text-gray-600">Role:</p>
            <p className="font-medium capitalize">{userData.role}</p>
          </div>
        </div>
      </div>
      
      {/* Teams Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Your Teams</h2>
        {userData.teams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userData.teams.map(team => (
              <div key={team.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <h3 className="font-medium text-lg">{team.name}</h3>
                <p className="text-gray-600 mt-2">{team.description || 'No description'}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">You are not part of any teams yet.</p>
        )}
      </div>
      
      {/* Projects Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Your Projects</h2>
        {userData.projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userData.projects.map(project => (
              <div key={project.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <h3 className="font-medium text-lg">{project.name}</h3>
                <p className="text-gray-600 mt-2">{project.description || 'No description'}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">You are not assigned to any projects yet.</p>
        )}
      </div>
      
      {/* Tasks Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Your Tasks</h2>
        {userData.tasks.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deadline</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {userData.tasks.map(task => (
                  <tr key={task.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium">{task.title}</div>
                      <div className="text-sm text-gray-500">{task.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${task.status === 'completed' ? 'bg-green-100 text-green-800' :
                          task.status === 'in progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'}`}>
                        {task.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(task.deadline).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">You don't have any tasks assigned yet.</p>
        )}
      </div>
    </div>
  );
};

export default EmployeePage;