import { BrowserRouter, Routes, Route } from "react-router-dom"
import Header from "./Header"
import RightPanel from "./RightPanel"
import ProblemList from "./ProblemList"
import Problem from "./Problem"
import Contest from "./Contest"
import ContestList from "./ContestList"
import Submission from "./Submission"
import SubmissionList from "./SubmissionList"
import Login from "./Login"
import Register from "./Register"
import Leaderboard from "./Leaderboard"

export default function App() {
	return (
		<BrowserRouter>
			<Header />
			<div>
				<RightPanel />
				<Routes>
					<Route path="/" element={<ProblemList />} />
					<Route path="/problems" element={<ProblemList />} />
					<Route path="/problems/:id" element={<Problem />} />
					<Route path="/contests" element={<ContestList />} />
					<Route path="/contests/:id" element={<Contest />} />
					<Route path="/submissions" element={<SubmissionList />} />
					<Route path="/submissions/:id" element={<Submission />} />
					<Route path="/login" element={<Login />} />
					<Route path="/register" element={<Register />} />
					<Route path="/leaderboard" element={<Leaderboard />} />
				</Routes>
			</div>
		</BrowserRouter>
	)
}
