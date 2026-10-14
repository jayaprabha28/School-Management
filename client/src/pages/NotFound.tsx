import { Link } from "react-router-dom";
import { Button } from "../components/ui";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="text-5xl font-bold text-slate-300">404</p>
      <h1 className="mt-3 text-lg font-semibold text-slate-800">Page not found</h1>
      <p className="mt-1 text-sm text-slate-500">The page you are looking for does not exist or you do not have access.</p>
      <Link to="/" className="mt-5">
        <Button variant="secondary">Back to dashboard</Button>
      </Link>
    </div>
  );
}
