import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { img2Light1Img, img2Light2Img, img2Light3Img } from "../utils";

const Highlights = () => {
  // Dữ liệu các card
  const cards = [
    {
      img: img2Light1Img,
      heading: "Multiple AI Modes",
      text: "Whether you're looking for high quality or faster generation, Flux variants or Freepik Mystic will cover your needs",
    },
    {
      img: img2Light2Img,
      heading: "Pick style, color filters, and perspective",
      text: "No need for long or complex prompts, just use the presets!",
    },
    {
      img: img2Light3Img,
      heading: "High-end textures and realism",
      text: "Skin tones, textures, details—everything is there",
    },
  ];

  const refs = useRef([]); // Tạo mảng refs cho tất cả các card
  useEffect(() => {
    // Hiệu ứng GSAP cho ảnh và text
    gsap.fromTo(
      refs.current.map((ref) => ref.img), // Áp dụng cho ảnh
      {
        opacity: 0,
        scale: 0.8,
      },
      {
        opacity: 1,
        scale: 1,
        duration: 1.5,
        ease: "elastic.out(1, 0.5)",
        stagger: 0.3,
        repeat: -1, // Lặp vô hạn
        repeatDelay: 2,
        yoyo: true,
      }
    );

    gsap.fromTo(
      refs.current.map((ref) => ref.heading), // Áp dụng cho heading
      {
        opacity: 0,
        y: 30,
      },
      {
        opacity: 1,
        y: 0,
        duration: 1.5,
        ease: "power4.out",
        stagger: 0.3,
        repeat: -1,
        repeatDelay: 1,
        yoyo: true,
      }
    );

    gsap.fromTo(
      refs.current.map((ref) => ref.text), // Áp dụng cho text
      {
        opacity: 0,
        y: 50,
      },
      {
        opacity: 1,
        y: 0,
        duration: 1.5,
        ease: "power4.out",
        stagger: 0.3,
        repeat: -1,
        repeatDelay: 1,
        yoyo: true,
      }
    );
  }, []);

  return (
    <section
      id="highlights"
      className="  flex flex-col items-center gap-10 h-auto  w-2/3 justify-center m-auto"
    >
      <div className="bg-white-glow-gradient w-full">
        <h2 className="text-4xl">The only AI Image Generator you need</h2>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 text-center mx-5  rounded-lg">
          {cards.map((card, index) => (
            <div
              key={index}
              className="flex flex-col items-center justify-center mt-4"
              ref={(el) =>
                (refs.current[index] = {
                  img: el?.querySelector("img"),
                  heading: el?.querySelector("h3"),
                  text: el?.querySelector("p"),
                })
              }
            >
              <img
                src={card.img}
                alt=""
                className="mb-4 w-[200px] h-[200px] object-cover rounded-lg"
              />
              <h3 className="text-lg font-semibold">{card.heading}</h3>
              <p className="text-md text-white">{card.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Highlights;
