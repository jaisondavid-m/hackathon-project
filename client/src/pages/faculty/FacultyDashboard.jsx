import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';

function FacultyDashboard() {
  const [selectedClass, setSelectedClass] = useState('CS101');

  const classes = [
    { id: 'CS101', name: 'Computer Science (CS-A)', time: '09:00 AM - 10:00 AM', count: 5 },
    { id: 'CS202', name: 'Data Structures (CS-B)', time: '11:30 AM - 12:30 PM', count: 4 },
    { id: 'CS305', name: 'Web Engineering', time: '02:00 PM - 03:00 PM', count: 5 },
  ];

  return (
    <div className="w-full">
      <Outlet context={{ selectedClass, setSelectedClass, classes }} />
    </div>
  );
}

export default FacultyDashboard;
