import LandingNav from "@/components/landing/LandingNav";
import LandingHero from "@/components/landing/LandingHero";

export default function HomePage() {
  return (
    <div className="grid-bg min-h-screen">
      <LandingNav />
      <LandingHero />
    </div>
  );
}
