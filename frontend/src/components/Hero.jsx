import gsap from "gsap";
import { useEffect, useState } from "react";
import { heroVideo, smallHeroVideo } from "../utils";
import { Link } from "react-router-dom";
import { TweenLite } from "gsap/gsap-core";

const Hero = () => {
  const [videoSrc, setVideoSrc] = useState(
    window.innerWidth < 760 ? smallHeroVideo : heroVideo
  );

  const handleVideoSrcSet = () => {
    if (window.innerWidth < 760) {
      setVideoSrc(smallHeroVideo);
    } else {
      setVideoSrc(heroVideo);
    }
  };

  useEffect(() => {
    window.addEventListener("resize", handleVideoSrcSet);

    return () => {
      window.removeEventListener("resize", handleVideoSrcSet);
    };
  }, []);

  useEffect(() => {
    // Hiệu ứng chữ xuất hiện
    gsap.fromTo(
      "#hero-text",
      { opacity: 0, y: 20 },
      {
        opacity: 1,
        y: 0,
        duration: 2,
        delay: 1.5,
        ease: "power3.out",
      }
    );

    // Hiệu ứng nút xuất hiện sau chữ
    gsap.fromTo(
      "#hero-button",
      { opacity: 0, scale: 0.8 },
      {
        opacity: 1,
        scale: 1,
        duration: 0.8,
        delay: 3,
        ease: "elastic.out(1, 0.5)",
      }
    );
  }, []);

  return (
    <section className="w-full h-screen overflow-auto relative">
      {/* Phần chữ */}
      <div
        id="hero-text"
        className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 text-white text-2xl md:text-3xl font-bold text-center"
      >
        Your next big idea starts with AI Tool Hub! Unlock the power of
        artificial intelligence with our innovative platform. Discover a wide
        range of cutting-edge AI tools and features designed to spark
        creativity, streamline workflows, and bring your ideas to life in
        groundbreaking ways.
      </div>
      {/* Nút "Try it" */}
      <div
        id="hero-button"
        className="absolute top-[50%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 my-4 "
      >
        <Link
          to="/text-assistance"
          className="bg-blue-500 text-white px-6 py-3 rounded-lg text-lg font-medium hover:bg-blue-600 transition "
        >
          <button>
            Stay tuned for the future of AI innovation with AI Tool Hub!
          </button>
        </Link>
      </div>
    </section>
  );
};

export default Hero;
