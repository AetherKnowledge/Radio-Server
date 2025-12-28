"use client";

import { BandTypeFilter } from "../schema";

const FilterButton = ({
  bandTypeFilter,
  onClick,
  isActive,
}: {
  bandTypeFilter: BandTypeFilter;
  onClick: React.Dispatch<React.SetStateAction<BandTypeFilter>>;
  isActive: boolean;
}) => {
  return (
    <button
      className={`btn btn-sm flex-1 ${
        isActive ? "btn-primary" : "btn-outline"
      }`}
      onClick={() => onClick(bandTypeFilter)}
    >
      {bandTypeFilter}
    </button>
  );
};

export default FilterButton;
