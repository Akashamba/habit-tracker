"use client";

import Button from "./Button";

const QuickMenu = () => {
  const handleCreateHabit = async () => {
    alert("Coming soon");
  };

  return (
    <div className="quick-menu scrollbar no-scrollbar mx-5 mb-7 flex gap-3 overflow-x-auto">
      <Button onClick={handleCreateHabit}>Create New Habit</Button>
      <Button>Option 2</Button>
      <Button>Option 3</Button>
      <Button>Option 4</Button>
    </div>
  );
};

export default QuickMenu;
