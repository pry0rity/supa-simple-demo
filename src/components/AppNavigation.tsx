import { Link } from "react-router-dom";
import {
  AlertTriangle,
  Database,
  Layers,
  Server,
  Cpu,
  Users,
  Home,
} from "./Icons";

type NavLinkProps = {
  to: string;
  icon: React.ElementType;
  children: React.ReactNode;
};

export const NavLink = ({ to, icon: Icon, children }: NavLinkProps) => (
  <Link
    to={to}
    className="flex items-center space-x-2 p-2 hover:bg-gray-700 rounded text-gray-300 hover:text-white"
  >
    <Icon size={18} />
    <span>{children}</span>
  </Link>
);

export function AppNavigation() {
  return (
    <>
      <NavLink to="/" icon={Home}>
        Home
      </NavLink>
      <NavLink to="/slow-api" icon={Server}>
        Slow API
      </NavLink>
      <NavLink to="/error" icon={AlertTriangle}>
        Error Demo
      </NavLink>
      <NavLink to="/db-query" icon={Database}>
        DB Query
      </NavLink>
      <NavLink to="/batch-requests" icon={Layers}>
        Batch Requests
      </NavLink>
      <NavLink to="/server-component" icon={Cpu}>
        Server Component
      </NavLink>
      <NavLink to="/client-component" icon={Users}>
        Client Component
      </NavLink>
    </>
  );
}