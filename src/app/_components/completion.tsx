import React from "react";

const Completion = ({ completed }: { completed: boolean }) => {
  return (
    <div
      className={`h-5 w-5 rounded-md ${completed ? "bg-[#07551C]" : "bg-[#383A4C]"}`}
    ></div>
  );
};

export default Completion;
