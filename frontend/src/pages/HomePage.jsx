import Hero from '../components/sections/Hero';
import LeadStrip from '../components/sections/LeadStrip';
import StatsBar from '../components/sections/StatsBar';
import FeaturedCommunities from '../components/sections/FeaturedCommunities';
import LatestLaunches from '../components/sections/LatestLaunches';
import About from '../components/sections/About';
import Services from '../components/sections/Services';
import FeaturedProjects from '../components/sections/FeaturedProjects';
import Testimonials from '../components/sections/Testimonials';
import Contact from '../components/sections/Contact';

export default function HomePage() {
  return (
    <>
      <Hero />
      <LeadStrip />
      <StatsBar />
      <FeaturedCommunities />
      <LatestLaunches />
      <About />
      <Services />
      <FeaturedProjects />
      <Testimonials />
      <Contact />
    </>
  );
}
