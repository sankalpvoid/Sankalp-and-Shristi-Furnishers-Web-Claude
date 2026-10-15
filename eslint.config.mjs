import next from "eslint-config-next";

const config = [
  ...next,
  { ignores: [".next/**", "node_modules/**", "data/**"] },
  {
    rules: {
      "react-hooks/set-state-in-effect": "off",
    },
  },
];
export default config;
