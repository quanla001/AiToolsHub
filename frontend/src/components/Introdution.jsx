import React, { useEffect, useRef } from "react";
import {
  aiAssistance,
  img2Light2Img,
  img2Light3Img,
  img2Light4Img,
} from "../utils";
import gsap from "gsap";
import { Link } from "react-router-dom";

const Introduction = () => {
  const refs = useRef([]);
  const refs1 = useRef([]);
  useEffect(() => {
    // gsap.set sets properties on our items
    gsap.set("#text-content", {
      // Change this to -200px for a bigger cylinder
      transformOrigin: "center center -100px",
      // Comment this out to see the backs of letters
      backfaceVisibility: "hidden",
    });
    // gsap.to triggers animations
    gsap.to(
      // The array of letters
      "#text-content",
      // Animation duration in seconds
      3,
      {
        // Rotate on X axis 360 degrees
        rotationX: "360",
        // Delay the next item in seconds
        stagger: 0.1,
      }
    );
    refs1.current.forEach((ref, index) => {
      gsap.to(ref, {
        duration: 3,
        ease: "power3.inOut",
        x: `${index * 20}px`,
        repeat: -1,
        repeatDelay: 1,
        yoyo: true,
        transition: 10,
      });
    });

    refs.current.forEach((ref, index) => {
      gsap.to(ref, {
        rotation: index % 2 === 0 ? -10 : 10, // Nghiêng trái/phải tùy vị trí
        duration: 1,
        yoyo: true,
        repeat: -1,
        ease: "power1.inOut",
        delay: index * 0.5,
        y: "10px",
      });
    });
  }, []);

  return (
    <>
      <section className="py-10 text-white bg-blue-glow-gradient  ">
        <div className="flex justify-around items-center gap-10 w-2/3 mx-auto ">
          {/* Ảnh chồng lên nhau */}
          <div className="relative w-1/2 flex justify-center  ">
            <img
              src={aiAssistance}
              alt="Image 1"
              className="w-80 h-full object-cover rounded-lg shadow-lg"
            />
          </div>

          {/* Nội dung text */}
          <div className="flex flex-col w-1/2 space-y-4   " id="text-content">
            <h2 className="text-4xl font-bold">
              Revolutionize Your Experience with AI Assistance
            </h2>
            <p className="text-lg">Smart, Fast, and Always Ready</p>
            <span className="text-sm">
              Interact seamlessly with our advanced AI assistant to get instant
              answers, complete tasks efficiently, and unlock your creativity.
              Whether it’s problem-solving or content creation, AI is here to
              support you every step of the way!
            </span>
            <button className="px-6 py-2 bg-blue-glow-gradient rounded-lg shadow hover:bg-blue-700">
              <Link to="/text-assistance">Go to conversation</Link>
            </button>
          </div>
        </div>
        {/* Introducing 2 */}

        <div className="flex justify-around items-center gap-10 w-2/3 mx-auto mt-20">
          {/* Nội dung text */}
          <div className="flex flex-col w-1/2 space-y-4">
            <h2 className="text-4xl font-bold">New</h2>
            <p className="text-lg">Create consistent images with AI</p>
            <span className="text-sm">
              Create consistent visuals by training your styles (known as
              LoRAs), like Custom Styles and Custom Characters. Simply upload
              your images, tell the AI what to do, and watch as your styles and
              characters show up in different scenarios—all in just minutes.
            </span>
            <button className="px-6 py-2 bg-red-glow-gradient rounded-lg shadow">
              Generate AI Images
            </button>
          </div>
          {/* Ảnh chồng lên nhau */}
          <div className="w-1/2 justify-center grid grid-cols-2 gap-4 relative">
            <div ref={(el) => (refs.current[0] = el)} className="">
              <img
                src={img2Light2Img}
                alt="Image 1"
                className="w-[200px] h-[200px] object-cover rounded-lg shadow-lg"
              />
            </div>
            <div
              ref={(el) => (refs.current[1] = el)}
              className="top-0 left-0 transform translate-x-[10%] translate-y-[-10%] z-20"
            >
              <img
                src={img2Light3Img}
                alt="Image 2"
                className="w-[200px] h-[200px] object-cover rounded-lg shadow-lg"
              />
            </div>
            <div
              ref={(el) => (refs.current[2] = el)}
              className="top-0 left-0 transform translate-x-[40%] translate-y-[30%] z-30"
            >
              <img
                src={img2Light4Img}
                alt="Image 3"
                className="w-[200px] h-[200px] object-cover rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>

        {/* Introducing 2 */}
      </section>
    </>
  );
};

export default Introduction;
