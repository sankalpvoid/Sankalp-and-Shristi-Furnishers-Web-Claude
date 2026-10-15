import next from "eslint-config-next";

export default [
  ...next,
  { ignores: [".next/**", "node_modules/**", "data/**"] },
  {
    rules: {
      "react-hooks/set-state-in-effect": "off",
    },
  },
];
