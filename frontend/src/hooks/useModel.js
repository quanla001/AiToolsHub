import { useState, useRef } from "react";

const useModelSelection = () => {
  const models = [
    {
      name: "Stable Diffusion 1.0", //20s~
      api: "http://localhost:8080/api/tools/model1",
    },
    {
      name: "Stable Diffusion 3.5", //42s~
      api: "http://localhost:8080/api/tools/model2",
    },
    {
      name: "FLUX", //2.1m~
      api: "http://localhost:8080/api/tools/model3",
    },
    {
      name: "FLUX-RealismLora", //2.1m-3m
      api: "http://localhost:8080/api/tools/model4",
    },
  ];

  const [selectedModel, setSelectedModel] = useState(models[0].name);
  const [apiEndpoint, setApiEndpoint] = useState(models[0].api);
  const modelRefs = useRef([]);

  const handleModelClick = (model, index) => {
    setSelectedModel(model.name);
    setApiEndpoint(model.api);

    modelRefs.current.forEach((el, i) => {
      if (el) {
        el.classList.toggle(
          "border-2 border-[#6c63ff] bg-[#6c63ff]",
          i === index
        );
        el.classList.toggle("border border-gray-700 bg-gray-800", i !== index);
      }
    });
  };

  return {
    models,
    selectedModel,
    setSelectedModel,
    apiEndpoint,
    setApiEndpoint,
    modelRefs,
    handleModelClick,
  };
};

export default useModelSelection;
