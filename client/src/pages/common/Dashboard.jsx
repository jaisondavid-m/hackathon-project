import React from 'react';
import AdminDashboard from '../admin/AdminDashboard';
import FacultyDashboard from '../faculty/FacultyDashboard';
import StudentDashboard from '../student/StudentDashboard';
import { AlertCircle } from 'lucide-react';

function Dashboard({ user }) {
  if (!user) {
    return (
      <div className="max-w-md mx-auto mt-20 p-6 bg-rose-50 border border-rose-100 rounded-3xl text-center text-rose-700">
        <AlertCircle className="mx-auto mb-2 text-rose-500" size={32} />
        <h3 className="font-extrabold text-lg">Error Loading Profile</h3>
        <p className="text-sm mt-1">Please log out and log in again to refresh your session.</p>
      </div>
    );
  }

  // Switch dashboards based on role
  switch (user.role) {
    case 'admin':
      return <AdminDashboard />;
    case 'faculty':
      return <FacultyDashboard />;
    case 'student':
      return <StudentDashboard user={user} />;
    default:
      return (
        <div className="max-w-md mx-auto mt-20 p-6 bg-amber-50 border border-amber-100 rounded-3xl text-center text-amber-700">
          <AlertCircle className="mx-auto mb-2 text-amber-500" size={32} />
          <h3 className="font-extrabold text-lg">Unknown Access Role</h3>
          <p className="text-sm mt-1">
            Your user account is assigned an unrecognized role: <strong>"{user.role}"</strong>. Contact support.
          </p>
        </div>
      );
  }
}

export default Dashboard;
