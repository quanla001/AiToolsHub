import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import {
  img2Light1Img,
  img2Light2Img,
  img2Light3Img,
  img2Light4Img,
} from "../utils";
import { useEffect, useRef } from "react";

gsap.registerPlugin(ScrollTrigger);

const ImageRandom = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    const images = [img2Light1Img, img2Light2Img, img2Light3Img, img2Light4Img];

    // GSAP ScrollTrigger animation
    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top top",
        end: `+=${images.length * 100}%`, // Tăng chiều dài scroll dựa trên số lượng ảnh
        scrub: true,
        pin: true, // Pin vùng container
        // markers: true, // Uncomment để debug
      },
    });

    // Thêm animation thay đổi ảnh nền vào timeline
    images.forEach((image) => {
      timeline.to(containerRef.current, {
        backgroundImage: `url(${image})`,
        duration: 1,
        ease: "none",
      });
    });
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-screen"
      style={{
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundImage: `url(${img2Light1Img})`, // Ảnh mặc định ban đầu
      }}
    ></div>
  );
};

export default ImageRandom;
