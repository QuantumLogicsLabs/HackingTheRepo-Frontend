import { Link } from "react-router-dom";
import type { ReactElement } from "react";
import LandingPageContent, {
  type LandingLinkProps,
} from "../components/landing/LandingPageContent";

function RouterLandingLink({
  href,
  className,
  style,
  children,
}: LandingLinkProps): ReactElement {
  return (
    <Link to={href} className={className} style={style}>
      {children}
    </Link>
  );
}

export default function LandingPage(): ReactElement {
  return <LandingPageContent Link={RouterLandingLink} />;
}
