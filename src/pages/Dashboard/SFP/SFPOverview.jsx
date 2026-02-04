import { NavLink } from 'react-router-dom';

export default function SFPOverview() {
  return (
    <div className="mx-auto max-w-[1360px] py-10">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">
          System Funders Points
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-500">
          Earn points through donations, referrals, and verified promotions.
        </p>
      </section>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800">SFP Formula</h3>
          <p className="mt-2 text-sm text-slate-500">
            View the official calculation rules and voting thresholds.
          </p>
          <NavLink
            to="/dashboard/sfp/rewards"
            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
          >
            View Formula
          </NavLink>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800">Voting</h3>
          <p className="mt-2 text-sm text-slate-500">
            Browse current proposals. Voting unlocks at 10,000 SFP.
          </p>
          <NavLink
            to="/voting"
            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
          >
            Open Voting
          </NavLink>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800">Your Total</h3>
          <p className="mt-2 text-3xl font-semibold text-slate-900">0 SFP</p>
          <p className="mt-1 text-xs text-slate-500">Voting unlocked at 10,000 SFP.</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800">History</h3>
          <p className="mt-2 text-sm text-slate-500">
            Track donations, referrals, and social submissions.
          </p>
          <NavLink
            to="/dashboard/sfp/history"
            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
          >
            View History
          </NavLink>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800">Submit Content</h3>
          <p className="mt-2 text-sm text-slate-500">
            Earn SFP for verified social or video promotions.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <NavLink
              to="/dashboard/sfp/submit-social"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              Submit Social
            </NavLink>
            <NavLink
              to="/dashboard/sfp/submit-video"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              Submit Video
            </NavLink>
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-800">Formula & Rules</h3>
        <p className="mt-2 text-sm text-slate-500">
          View the official SFP calculation, referral rewards, and voting power
          rules.
        </p>
        <NavLink
          to="/dashboard/sfp/rewards"
          className="mt-4 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
        >
          Open Formula
        </NavLink>
      </div>
    </div>
  );
}
