import { Navigate, Route, Routes } from 'react-router-dom';
import BirthdayCardPage from './modules/birthday-card/BirthdayCardPage';
import MeetingMinutesPage from './modules/meeting-minutes/MeetingMinutesPage';
import { AppShell } from './shell/AppShell';

export function AppRouter() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Navigate to="/birthday-card" replace />} />
        <Route path="birthday-card" element={<BirthdayCardPage />} />
        <Route path="meeting-minutes" element={<MeetingMinutesPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/birthday-card" replace />} />
    </Routes>
  );
}
