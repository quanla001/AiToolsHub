import { useEffect, useRef } from "react";
import Hero from "./Hero";
import Highlights from "./Highlights";
import Introdution from "./Introdution";
import { Navbar } from "./Navbar";
import gsap from "gsap";
import { motion } from "framer-motion";
import Footer from "./Footer";

// FloatingPaths Component
function FloatingPaths({ position }) {
  const paths = Array.from({ length: 36 }, (_, i) => ({
    id: i,
    d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${
      380 - i * 5 * position
    } -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${
      152 - i * 5 * position
    } ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${
      684 - i * 5 * position
    } ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
    color: `rgba(15,23,42,${0.1 + i * 0.03})`,
    width: 0.5 + i * 0.03,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none">
      <svg
        className="w-full h-full text-slate-950 dark:text-white"
        viewBox="0 0 696 316"
        fill="none"
      >
        <title>Background Paths</title>
        {paths.map((path) => (
          <motion.path
            key={path.id}
            d={path.d}
            stroke="currentColor"
            strokeWidth={path.width}
            strokeOpacity={0.1 + path.id * 0.03}
            initial={{ pathLength: 0.3, opacity: 0.6 }}
            animate={{
              pathLength: 1,
              opacity: [0.3, 0.6, 0.3],
              pathOffset: [0, 1, 0],
            }}
            transition={{
              duration: 20 + Math.random() * 10,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
          />
        ))}
      </svg>
    </div>
  );
}

// Home Component
export const Home = () => {
  const heroRef = useRef(null);

  useEffect(() => {
    const images = [
      "bg-hero-pattern",
      "bg-hero-pattern-1",
      "bg-hero-pattern-2",
      "bg-hero-pattern-3",
    ];
    let currentIndex = 0;

    const changeBackground = () => {
      if (heroRef.current) {
        heroRef.current.classList.remove(images[currentIndex]);
        currentIndex = (currentIndex + 1) % images.length;
        heroRef.current.classList.add(images[currentIndex]);
      }
    };

    const transitionDuration = 1;
    const intervalDuration = 5;

    const interval = setInterval(() => {
      gsap.to(heroRef.current, {
        opacity: 0,
        duration: transitionDuration,
        onComplete: () => {
          changeBackground();
          gsap.to(heroRef.current, {
            opacity: 1,
            duration: transitionDuration,
          });
        },
      });
    }, intervalDuration * 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative min-h-screen bg-hero-pattern-3 bg-no-repeat bg-cover bg-center">
      {/* Hero Section */}
      <div className="relative h-screen overflow-hidden">
        {/* Background with floating paths animation */}
        <div
          ref={heroRef}
          className="absolute h-full inset-0 bg-hero-pattern bg-cover bg-no-repeat bg-center z-0"
          style={{
            maskImage:
              "linear-gradient(to bottom, black 90%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, black 70%, transparent 100%)",
          }}
        ></div>

        {/* FloatingPaths animation */}
        <FloatingPaths position={1} />
        <FloatingPaths position={-1} />

        {/* Navbar */}
        <div className="sticky top-0 left-0 w-full z-50">
          <Navbar />
        </div>

        {/* Hero Content */}
        <div className="relative z-20 flex flex-col items-center justify-center h-full text-white">
          <Hero />
        </div>
      </div>

      {/* Highlights Section */}
      <div className="relative z-30 py-20 text-white">
        <Highlights />
      </div>

      {/* Introduction Section */}
      <div className="relative z-30 py-20 text-white">
        <Introdution />
      </div>
      <div className="relative z-30 text-white">
        <Footer />
      </div>
    </div>
  );
};
