import { Navigate, Route, Routes } from 'react-router-dom';
import { MintProvider } from './context/MintContext.jsx';
import { AuthorityProvider } from './context/AuthorityContext.jsx';
import { UIProvider } from './context/UIContext.jsx';
import MainLayout from './layouts/MainLayout.jsx';
import MintPage from './pages/Mint/MintPage.jsx';
import Dashboard from './pages/Dashboard/Dashboard.jsx';
import SFPOverview from './pages/Dashboard/SFP/SFPOverview.jsx';
import SFPHistory from './pages/Dashboard/SFP/SFPHistory.jsx';
import SFPRewards from './pages/Dashboard/SFP/SFPRewards.jsx';
import SubmitSocial from './pages/Dashboard/SFP/SFPSubmit/SubmitSocial.jsx';
import SubmitVideo from './pages/Dashboard/SFP/SFPSubmit/SubmitVideo.jsx';
import SubmitReferral from './pages/Dashboard/SFP/SFPSubmit/SubmitReferral.jsx';
import VotingPublic from './pages/Voting/VotingPublic.jsx';

export default function App() {
  return (
    <UIProvider>
        <AuthorityProvider>
          <MintProvider>
            <Routes>
              <Route path="/" element={<MainLayout />}>
                <Route index element={<MintPage />} />
                <Route path="create" element={<MintPage />} />
                <Route path="create/*" element={<Navigate to="/create" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="dashboard/sfp/history" element={<SFPHistory />} />
                <Route path="dashboard/sfp/rewards" element={<SFPRewards />} />
                <Route path="dashboard/sfp/submit-social" element={<SubmitSocial />} />
                <Route path="dashboard/sfp/submit-video" element={<SubmitVideo />} />
                <Route path="dashboard/sfp/submit-referral" element={<SubmitReferral />} />
                <Route path="voting" element={<VotingPublic />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </MintProvider>
        </AuthorityProvider>
      </UIProvider>
  );
}
