import React from "react";
import { Navbar } from "../components/Navbar";

const plans = [
  {
    name: "Free",
    price: "FREE",
    duration: "/forever",
    buttonText: "Current Plan",
    features: {
      chat: "limited access",
      image: "limited access",
      music: "limited access",
      tts: "limited access",
      ocr: "limited access",
    },
    isCurrent: true,
  },
  {
    name: "Pay As You Go",
    price: "$5.00",
    duration: "/starting",
    buttonText: "Get Started",
    features: {
      chat: "350",
      image: "100",
      music: "50",
      tts: "50",
      ocr: "100",
    },
  },
  {
    name: "Pro Plan",
    price: "$9.99",
    duration: "/month",
    buttonText: "Get Started",
    badge: "Most Advanced",
    features: {
      chat: "1750",
      image: "500",
      music: "190",
      tts: "150",
      ocr: "500",
    },
  },
];

const Pricing = () => {
  return (
    <div className="bg-[#0f0c1c] text-white min-h-screen">
      <Navbar />

      <div className="pt-32 px-6 max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">Pricing</h1>
        <p className="text-gray-400 mb-12">Manage your AI service plan</p>

        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {plans.map((plan, index) => (
            <div
              key={index}
              className="bg-[#1a162e] p-6 rounded-xl border border-gray-700 text-center relative"
            >
              {plan.badge && (
                <span className="absolute top-4 right-4 bg-purple-600 text-xs font-semibold px-2 py-1 rounded">
                  {plan.badge}
                </span>
              )}
              <h3 className="text-xl font-semibold mb-1">{plan.name}</h3>
              <p className="text-sm text-gray-400 mb-4">
                {plan.name === "Free"
                  ? "Standard Tools"
                  : plan.name === "Pay As You Go"
                  ? "Increased Access"
                  : "Most Advanced"}
              </p>
              <p className="text-3xl font-bold text-purple-400">
                {plan.price}
                <span className="text-base text-gray-400 font-normal">
                  {plan.duration}
                </span>
              </p>
              <button
                className={`mt-4 px-4 py-2 rounded-full text-sm font-medium ${
                  plan.isCurrent
                    ? "border border-purple-400 text-purple-400"
                    : "bg-purple-600 hover:bg-purple-500"
                }`}
              >
                {plan.buttonText}
              </button>
            </div>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-400 border-t border-gray-700">
            <thead>
              <tr className="text-white text-sm">
                <th className="py-3 px-4">Services</th>
                <th className="py-3 px-4 text-center">Free</th>
                <th className="py-3 px-4 text-center">Pay As You Go</th>
                <th className="py-3 px-4 text-center">Pro Plan</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["AI Chat Message", "chat"],
                ["Image Generator", "image"],
                ["Music Audio Generator", "music"],
                ["Text to Speech Generator", "tts"],
                ["OCR Service (Text from Image)", "ocr"],
              ].map(([label, key], i) => (
                <tr key={i} className="border-t border-gray-800">
                  <td className="py-3 px-4">{label}</td>
                  {plans.map((plan, idx) => (
                    <td key={idx} className="py-3 px-4 text-center">
                      {plan.features[key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
