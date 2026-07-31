import React from 'react';
import { useOutletContext } from 'react-router-dom';
import SubjectBreakdown from './SubjectBreakdown';
import HistoryLogs from './HistoryLogs';

function StudentHistory() {
  const { records } = useOutletContext();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-7">
        <SubjectBreakdown records={records} />
      </div>

      <div className="lg:col-span-5">
        <HistoryLogs records={records} />
      </div>
    </div>
  );
}

export default StudentHistory;
