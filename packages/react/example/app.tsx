import React, { useState } from "react";
import ErrorBoundary from "./error";
import * as Icons from "../src/ssr";
const iconComponents = Object.entries(Icons).map(([name, Icon]) => ({
  name,
  Icon,
}));

const IconGrid: React.FC = () => {
  // Convert the imported Icons object into an array of components

  const [type, setType] = useState<"icon" | "font">("icon");

  return (
    <div>
      <div className="flex gap-4 mb-4 sticky top-0 bg-white p-4">
        <label>
          <input
            type="radio"
            name="type"
            value="icon"
            checked={type === "icon"}
            onChange={() => setType("icon")}
          />
          Icon
        </label>
        <label>
          <input
            type="radio"
            name="type"
            value="font"
            checked={type === "font"}
            onChange={() => setType("font")}
          />
          Font
        </label>
      </div>
      <div className="grid grid-cols-5 gap-4">
        {iconComponents.map(({ name, Icon }) => (
          <div className="flex flex-col items-center justify-center" key={name}>
            <ErrorBoundary key={name}>
              <Icon size="100px" type={type} />
            </ErrorBoundary>
            <div className="text-sm">{name}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function App() {
  return (
    <div className="p-4 container mx-auto">
      <IconGrid />
    </div>
  );
}
